-- A third sharing level, "editor": a trusted relative who can also fix names, dates and places and add missing
-- relatives to the owner's tree (like Ancestry's Editor role). Editors see living relatives' details, because they
-- help keep them right. They still never see private notes, DNA links, privacy settings or verification notes,
-- they can't delete anyone, and every change goes through shared_save_member, which only touches the owner's tree.
-- Add-only: an editor is a contributor share with can_edit switched on; the role check on family_shares is unchanged.

alter table public.family_shares add column if not exists can_edit boolean not null default false;

create or replace function public._effective_role(p_role text, p_can_edit boolean)
returns text language sql immutable as $$
  select case when p_role = 'contributor' and coalesce(p_can_edit, false) then 'editor' else p_role end;
$$;
revoke all on function public._effective_role(text, boolean) from public, anon, authenticated;

create or replace function public._share_role(p_owner uuid)
returns text language sql stable security definer set search_path = public as $$
  select case when auth.uid() = p_owner then 'owner' else
    (select public._effective_role(role, can_edit) from public.family_shares
      where owner_id = p_owner and member_id = auth.uid() and status = 'active' limit 1) end;
$$;
revoke all on function public._share_role(uuid) from public, anon, authenticated;

-- Editors may add memories too (otherwise as in 20250701001500).
create or replace function public.add_shared_story(p_owner uuid, p_title text, p_content text, p_storyteller text default null, p_member uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  if coalesce(public._share_role(p_owner), '') not in ('owner', 'contributor', 'editor') then
    raise exception 'You can view this family but not add to it' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_content), '') = '' then raise exception 'Please add a title and the story'; end if;
  insert into public.cultural_stories (user_id, title, content, storyteller, family_member_id, verification_details)
  values (p_owner, left(p_title, 200), left(p_content, 20000), p_storyteller, p_member,
          jsonb_build_object('contributed_by', public._display_name(auth.uid())))
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.add_shared_story(uuid, text, text, text, uuid) from public, anon;
grant execute on function public.add_shared_story(uuid, text, text, text, uuid) to authenticated;

-- The role names people see in lists and invite previews include "editor".
create or replace function public.my_shared_families()
returns table (owner_id uuid, owner_name text, role text) language sql stable security definer set search_path = public as $$
  select s.owner_id, public._display_name(s.owner_id), public._effective_role(s.role, s.can_edit)
  from public.family_shares s where s.member_id = auth.uid() and s.status = 'active';
$$;
revoke all on function public.my_shared_families() from public, anon;
grant execute on function public.my_shared_families() to authenticated;

create or replace function public.my_family_members_shared()
returns table (id uuid, invitee_name text, member_name text, role text, status text, token text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.invitee_name, case when s.member_id is null then null else public._display_name(s.member_id) end,
         public._effective_role(s.role, s.can_edit), s.status, s.token, s.created_at
  from public.family_shares s where s.owner_id = auth.uid() order by s.created_at desc;
$$;
revoke all on function public.my_family_members_shared() from public, anon;
grant execute on function public.my_family_members_shared() to authenticated;

-- As in 20250701001500, reporting "editor" for editors.
create or replace function public.accept_family_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.family_shares;
  existing public.family_shares;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  select * into s from public.family_shares where token = p_token for update;
  if not found or s.status = 'revoked' then raise exception 'This invite link is no longer valid'; end if;
  if s.owner_id = auth.uid() then raise exception 'This is your own invite link. Send it to a relative.'; end if;
  if s.status = 'active' and s.member_id <> auth.uid() then raise exception 'This invite link has already been used'; end if;
  select * into existing from public.family_shares
    where owner_id = s.owner_id and member_id = auth.uid() and status = 'active' and id <> s.id limit 1;
  if found then
    return jsonb_build_object('owner_id', existing.owner_id, 'owner_name', public._display_name(existing.owner_id), 'role', public._effective_role(existing.role, existing.can_edit));
  end if;
  update public.family_shares set member_id = auth.uid(), status = 'active', accepted_at = coalesce(accepted_at, now())
    where id = s.id returning * into s;
  return jsonb_build_object('owner_id', s.owner_id, 'owner_name', public._display_name(s.owner_id), 'role', public._effective_role(s.role, s.can_edit));
end;
$$;
revoke all on function public.accept_family_invite(text) from public, anon;
grant execute on function public.accept_family_invite(text) to authenticated;

create or replace function public.preview_family_invite(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.family_shares;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  select * into s from public.family_shares where token = p_token;
  if not found or s.status = 'revoked' or (s.status = 'active' and s.member_id <> auth.uid()) then
    raise exception 'This invite link is no longer valid';
  end if;
  return jsonb_build_object('owner_name', public._display_name(s.owner_id), 'role', public._effective_role(s.role, s.can_edit),
                            'own', s.owner_id = auth.uid(), 'joined', s.member_id = auth.uid());
end;
$$;
revoke all on function public.preview_family_invite(text) from public, anon;
grant execute on function public.preview_family_invite(text) to authenticated;

-- Editors see everyone's details (minus private fields); viewers and contributors keep the living-relatives rule.
create or replace function public.shared_family_snapshot(p_owner uuid)
returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  r text := public._share_role(p_owner);
begin
  if r is null then raise exception 'This family has not been shared with you' using errcode = '42501'; end if;
  return jsonb_build_object(
    'owner_name', public._display_name(p_owner),
    'role', r,
    'members', coalesce((select jsonb_agg(
                           case when r in ('owner', 'editor')
                             then to_jsonb(m) - array['user_id', 'notes', 'dna_profile_id', 'privacy_settings', 'verification_notes']
                             else public._shared_member(m) end
                           order by m.birth_date nulls last)
                         from public.family_members m where m.user_id = p_owner), '[]'::jsonb),
    'stories', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'content', s.content,
                           'storyteller', s.storyteller, 'family_member_id', s.family_member_id, 'created_at', s.created_at)
                           order by s.created_at desc)
                         from public.cultural_stories s where s.user_id = p_owner), '[]'::jsonb),
    'storybooks', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'title', b.title, 'chapters', b.chapters, 'created_at', b.created_at)
                           order by b.created_at desc)
                         from public.storybooks b where b.user_id = p_owner), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.shared_family_snapshot(uuid) from public, anon;
grant execute on function public.shared_family_snapshot(uuid) to authenticated;

-- An editor fixes someone's facts (p_person has an id) or adds a relative of an existing person
-- (p_relative_of and p_relation = 'parent' | 'child' | 'spouse'). Only plain facts can be set; links are kept
-- on both people. Returns the person's id.
create or replace function public.shared_save_member(p_owner uuid, p_person jsonb, p_relative_of uuid default null, p_relation text default null)
returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  pid uuid := nullif(p_person->>'id', '')::uuid;
  first_n text := left(nullif(trim(p_person->>'first_name'), ''), 100);
  last_n text := left(nullif(trim(p_person->>'last_name'), ''), 100);
  d_birth date; d_death date;
begin
  if coalesce(public._share_role(p_owner), '') not in ('owner', 'editor') then
    raise exception 'You can’t edit this family tree' using errcode = '42501';
  end if;
  begin
    d_birth := nullif(p_person->>'birth_date', '')::date;
    d_death := nullif(p_person->>'death_date', '')::date;
  exception when others then
    raise exception 'Please check the dates' using errcode = '22023';
  end;
  if d_birth is not null and d_death is not null and d_death < d_birth then
    raise exception 'The death date is before the birth date' using errcode = '22023';
  end if;
  if coalesce(p_person->>'gender', '') not in ('', 'male', 'female', 'other') then
    raise exception 'Please check the gender' using errcode = '22023';
  end if;

  if pid is not null then
    if not exists (select 1 from public.family_members where id = pid and user_id = p_owner) then
      raise exception 'That person is not in this family' using errcode = '22023';
    end if;
    update public.family_members set
      first_name = coalesce(first_n, first_name),
      middle_name = case when p_person ? 'middle_name' then left(nullif(trim(p_person->>'middle_name'), ''), 100) else middle_name end,
      last_name = coalesce(last_n, last_name),
      maiden_name = case when p_person ? 'maiden_name' then left(nullif(trim(p_person->>'maiden_name'), ''), 100) else maiden_name end,
      gender = case when p_person ? 'gender' then nullif(p_person->>'gender', '') else gender end,
      birth_date = case when p_person ? 'birth_date' then d_birth else birth_date end,
      birth_location = case when p_person ? 'birth_location' then left(nullif(trim(p_person->>'birth_location'), ''), 200) else birth_location end,
      death_date = case when p_person ? 'death_date' then d_death else death_date end,
      death_location = case when p_person ? 'death_location' then left(nullif(trim(p_person->>'death_location'), ''), 200) else death_location end,
      is_living = case when p_person ? 'death_date' and d_death is not null then false else is_living end,
      updated_at = now()
    where id = pid and user_id = p_owner;
    return pid;
  end if;

  -- Adding someone new: they must be linked to a person already in this tree.
  if first_n is null or last_n is null then
    raise exception 'A first and last name are required' using errcode = '22023';
  end if;
  if p_relation not in ('parent', 'child', 'spouse')
     or not exists (select 1 from public.family_members where id = p_relative_of and user_id = p_owner) then
    raise exception 'Choose who this person is related to' using errcode = '22023';
  end if;
  insert into public.family_members (user_id, first_name, middle_name, last_name, maiden_name, gender, birth_date, birth_location,
    death_date, death_location, is_living, parent_ids, spouse_ids, children_ids)
  values (p_owner, first_n, left(nullif(trim(p_person->>'middle_name'), ''), 100), last_n,
    left(nullif(trim(p_person->>'maiden_name'), ''), 100), nullif(p_person->>'gender', ''), d_birth,
    left(nullif(trim(p_person->>'birth_location'), ''), 200), d_death, left(nullif(trim(p_person->>'death_location'), ''), 200),
    d_death is null,
    case when p_relation = 'child' then array[p_relative_of] else '{}'::uuid[] end,
    case when p_relation = 'spouse' then array[p_relative_of] else '{}'::uuid[] end,
    case when p_relation = 'parent' then array[p_relative_of] else '{}'::uuid[] end)
  returning id into pid;
  update public.family_members set
    parent_ids = case when p_relation = 'parent' then array_append(coalesce(parent_ids, '{}'), pid) else parent_ids end,
    children_ids = case when p_relation = 'child' then array_append(coalesce(children_ids, '{}'), pid) else children_ids end,
    spouse_ids = case when p_relation = 'spouse' then array_append(coalesce(spouse_ids, '{}'), pid) else spouse_ids end,
    updated_at = now()
  where id = p_relative_of and user_id = p_owner;
  return pid;
end;
$$;
revoke all on function public.shared_save_member(uuid, jsonb, uuid, text) from public, anon;
grant execute on function public.shared_save_member(uuid, jsonb, uuid, text) to authenticated;
