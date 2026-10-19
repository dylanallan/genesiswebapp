-- Privacy for shared family trees: relatives you invite see the whole tree, but for people who are still living
-- they see only names, how they are related, and their place in the tree (no birth dates, places, notes, photos,
-- documents or other details), as Ancestry and MyHeritage do for guests. Private fields (notes, DNA links,
-- privacy settings, verification notes) are never shared for anyone. Someone counts as living when there is no
-- death date, they aren't marked as not living, and they were born less than 100 years ago (or the date is unknown).
create or replace function public._shared_member(m public.family_members)
returns jsonb language sql stable set search_path = public, extensions, pg_temp as $$
  with j as (select to_jsonb(m) as d),
  living as (
    -- is_living defaults to true for everyone, so on its own it can't be trusted: a death date, or being marked
    -- not living, always wins, and anyone born more than 100 years ago is treated as an ancestor.
    select d->>'death_date' is null
       and coalesce((d->>'is_living')::boolean, true)
       and (d->>'birth_date' is null or (d->>'birth_date')::date > current_date - interval '100 years') as yes
    from j
  )
  select case when (select yes from living) then
      (select jsonb_object_agg(k, v) from jsonb_each((select d from j)) e(k, v)
        where k = any (array['id', 'first_name', 'middle_name', 'last_name', 'gender', 'relationship',
                             'parent_ids', 'spouse_ids', 'children_ids'])) || jsonb_build_object('is_living', true)
    else
      (select d from j) - array['user_id', 'notes', 'dna_profile_id', 'privacy_settings', 'verification_notes']
    end;
$$;
revoke all on function public._shared_member(public.family_members) from public, anon, authenticated;

create or replace function public.shared_family_snapshot(p_owner uuid)
returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  r text := public._share_role(p_owner);
begin
  if r is null then raise exception 'This family has not been shared with you' using errcode = '42501'; end if;
  return jsonb_build_object(
    'owner_name', public._display_name(p_owner),
    'role', r,
    'members', coalesce((select jsonb_agg(public._shared_member(m) order by m.birth_date nulls last)
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
