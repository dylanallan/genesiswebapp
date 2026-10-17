-- Merging two records of the same person also moves the records saved to the duplicate (and undo moves them back). Add-only.
alter table public.family_merges add column if not exists records_moved uuid[] not null default '{}';

create or replace function public.merge_family_members(p_keep uuid, p_remove uuid, p_fields jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  me uuid := auth.uid();
  k public.family_members;
  r public.family_members;
  log_id uuid;
  v_touched jsonb;
  v_stories uuid[];
  v_records uuid[];
  v_parents uuid[];
begin
  if me is null then raise exception 'Please sign in again.'; end if;
  if p_keep is null or p_remove is null or p_keep = p_remove then raise exception 'Choose two different people to merge.'; end if;
  select * into k from public.family_members where id = p_keep and user_id = me for update;
  select * into r from public.family_members where id = p_remove and user_id = me for update;
  if k.id is null or r.id is null then raise exception 'Both people must be in your own tree.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'parent_ids', f.parent_ids, 'children_ids', f.children_ids, 'spouse_ids', f.spouse_ids)), '[]'::jsonb)
    into v_touched
    from public.family_members f
   where f.user_id = me and f.id not in (p_keep, p_remove)
     and (p_remove = any(coalesce(f.parent_ids, '{}')) or p_remove = any(coalesce(f.children_ids, '{}')) or p_remove = any(coalesce(f.spouse_ids, '{}')));
  select coalesce(array_agg(id), '{}') into v_stories from public.cultural_stories where user_id = me and family_member_id = p_remove;
  select coalesce(array_agg(id), '{}') into v_records from public.saved_records where user_id = me and family_member_id = p_remove;

  insert into public.family_merges (user_id, kept_id, removed_id, kept_before, removed_row, touched, stories_moved, records_moved)
  values (me, p_keep, p_remove, to_jsonb(k), to_jsonb(r), v_touched, v_stories, v_records)
  returning id into log_id;

  -- Everyone who pointed at the duplicate now points at the kept person.
  update public.family_members f set
    parent_ids = public._swap_id(f.parent_ids, p_remove, p_keep, f.id),
    children_ids = public._swap_id(f.children_ids, p_remove, p_keep, f.id),
    spouse_ids = public._swap_id(f.spouse_ids, p_remove, p_keep, f.id)
  where f.user_id = me and f.id not in (p_keep, p_remove)
    and (p_remove = any(coalesce(f.parent_ids, '{}')) or p_remove = any(coalesce(f.children_ids, '{}')) or p_remove = any(coalesce(f.spouse_ids, '{}')));

  -- The kept person gets both records' links (never more than two parents) and the chosen details.
  v_parents := public._swap_id(coalesce(k.parent_ids, '{}') || coalesce(r.parent_ids, '{}'), p_remove, p_keep, p_keep);
  update public.family_members set
    parent_ids = v_parents[1:2],
    children_ids = public._swap_id(coalesce(k.children_ids, '{}') || coalesce(r.children_ids, '{}'), p_remove, p_keep, p_keep),
    spouse_ids = public._swap_id(coalesce(k.spouse_ids, '{}') || coalesce(r.spouse_ids, '{}'), p_remove, p_keep, p_keep),
    first_name = case when p_fields ? 'first_name' then coalesce(nullif(p_fields->>'first_name', ''), first_name) else first_name end,
    middle_name = case when p_fields ? 'middle_name' then nullif(p_fields->>'middle_name', '') else middle_name end,
    last_name = case when p_fields ? 'last_name' then coalesce(p_fields->>'last_name', '') else last_name end,
    gender = case when p_fields ? 'gender' then nullif(p_fields->>'gender', '') else gender end,
    birth_date = case when p_fields ? 'birth_date' then nullif(p_fields->>'birth_date', '')::date else birth_date end,
    birth_location = case when p_fields ? 'birth_location' then nullif(p_fields->>'birth_location', '') else birth_location end,
    death_date = case when p_fields ? 'death_date' then nullif(p_fields->>'death_date', '')::date else death_date end,
    death_location = case when p_fields ? 'death_location' then nullif(p_fields->>'death_location', '') else death_location end,
    notes = case when p_fields ? 'notes' then nullif(p_fields->>'notes', '') else notes end,
    is_living = coalesce(k.is_living, true) and coalesce(r.is_living, true)
                and (case when p_fields ? 'death_date' then nullif(p_fields->>'death_date', '') is null else death_date is null end)
  where id = p_keep;

  update public.cultural_stories set family_member_id = p_keep where user_id = me and family_member_id = p_remove;
  update public.saved_records set family_member_id = p_keep where user_id = me and family_member_id = p_remove;
  return log_id;
end;
$$;
revoke all on function public.merge_family_members(uuid, uuid, jsonb) from public, anon;
grant execute on function public.merge_family_members(uuid, uuid, jsonb) to authenticated;

create or replace function public.undo_family_merge(p_merge uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  me uuid := auth.uid();
  m public.family_merges;
  t jsonb;
  b public.family_members;
begin
  select * into m from public.family_merges where id = p_merge and user_id = me and undone_at is null for update;
  if m.id is null then raise exception 'That merge was already undone or is not yours.'; end if;

  -- Bring back the removed record exactly as it was (if the app already removed it).
  if not exists (select 1 from public.family_members where id = m.removed_id) then
    insert into public.family_members select * from jsonb_populate_record(null::public.family_members, m.removed_row);
  end if;

  -- Put the kept person's details and links back.
  b := jsonb_populate_record(null::public.family_members, m.kept_before);
  update public.family_members set
    first_name = b.first_name, middle_name = b.middle_name, last_name = b.last_name, gender = b.gender,
    birth_date = b.birth_date, birth_location = b.birth_location, death_date = b.death_date, death_location = b.death_location,
    notes = b.notes, is_living = b.is_living, parent_ids = b.parent_ids, children_ids = b.children_ids, spouse_ids = b.spouse_ids
  where id = m.kept_id and user_id = me;

  -- Restore everyone else's links.
  for t in select * from jsonb_array_elements(m.touched) loop
    update public.family_members set
      parent_ids = coalesce((select array_agg(v::uuid) from jsonb_array_elements_text(coalesce(t->'parent_ids', '[]'::jsonb)) v), '{}'),
      children_ids = coalesce((select array_agg(v::uuid) from jsonb_array_elements_text(coalesce(t->'children_ids', '[]'::jsonb)) v), '{}'),
      spouse_ids = coalesce((select array_agg(v::uuid) from jsonb_array_elements_text(coalesce(t->'spouse_ids', '[]'::jsonb)) v), '{}')
    where id = (t->>'id')::uuid and user_id = me;
  end loop;

  update public.cultural_stories set family_member_id = m.removed_id where user_id = me and id = any(m.stories_moved);
  update public.saved_records set family_member_id = m.removed_id where user_id = me and id = any(coalesce(m.records_moved, '{}'));
  update public.family_merges set undone_at = now() where id = m.id;
  return m.removed_id;
end;
$$;
revoke all on function public.undo_family_merge(uuid) from public, anon;
grant execute on function public.undo_family_merge(uuid) to authenticated;
