-- Family sharing, storybooks, interview recordings and "download all my data".
-- Written add-only so it can be applied safely to the live project.

-- Interviews and stories can belong to a person in the tree and carry their recording.
alter table public.cultural_stories
  add column if not exists family_member_id uuid,
  add column if not exists audio_path text;

-- Saved AI family storybooks.
create table if not exists public.storybooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  focus text,
  chapters jsonb not null default '[]'::jsonb, -- [{ heading, body }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists storybooks_user_idx on public.storybooks (user_id);
alter table public.storybooks enable row level security;
do $do$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'storybooks' and policyname = 'Owner access') then
    create policy "Owner access" on public.storybooks for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $do$;

-- Invite links that let relatives see (viewer) or add memories to (contributor) someone's family.
create table if not exists public.family_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token text not null unique default (md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text)),
  invitee_name text,
  role text not null default 'viewer' check (role in ('viewer', 'contributor')),
  member_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists family_shares_owner_idx on public.family_shares (owner_id);
create index if not exists family_shares_member_idx on public.family_shares (member_id);
alter table public.family_shares enable row level security;
do $do$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_shares' and policyname = 'Owners manage their invites') then
    create policy "Owners manage their invites" on public.family_shares for all to authenticated
      using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_shares' and policyname = 'Members see their invites') then
    create policy "Members see their invites" on public.family_shares for select to authenticated
      using (auth.uid() = member_id);
  end if;
end $do$;

create or replace function public._display_name(p_user uuid)
returns text language sql stable security definer set search_path = public, auth as $$
  select coalesce(nullif(p.full_name, ''), split_part(u.email::text, '@', 1), 'A relative')
  from auth.users u left join public.profiles p on p.id = u.id where u.id = p_user;
$$;
revoke all on function public._display_name(uuid) from public, anon, authenticated;

create or replace function public._share_role(p_owner uuid)
returns text language sql stable security definer set search_path = public as $$
  select case when auth.uid() = p_owner then 'owner' else
    (select role from public.family_shares where owner_id = p_owner and member_id = auth.uid() and status = 'active' limit 1) end;
$$;
revoke all on function public._share_role(uuid) from public, anon, authenticated;

create or replace function public.accept_family_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.family_shares;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  select * into s from public.family_shares where token = p_token for update;
  if not found or s.status = 'revoked' then raise exception 'This invite link is no longer valid'; end if;
  if s.owner_id = auth.uid() then raise exception 'This is your own invite link. Send it to a relative.'; end if;
  if s.status = 'active' and s.member_id <> auth.uid() then raise exception 'This invite link has already been used'; end if;
  update public.family_shares set member_id = auth.uid(), status = 'active', accepted_at = coalesce(accepted_at, now())
    where id = s.id returning * into s;
  return jsonb_build_object('owner_id', s.owner_id, 'owner_name', public._display_name(s.owner_id), 'role', s.role);
end;
$$;

create or replace function public.my_shared_families()
returns table (owner_id uuid, owner_name text, role text) language sql stable security definer set search_path = public as $$
  select s.owner_id, public._display_name(s.owner_id), s.role
  from public.family_shares s where s.member_id = auth.uid() and s.status = 'active';
$$;

create or replace function public.my_family_members_shared()
returns table (id uuid, invitee_name text, member_name text, role text, status text, token text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.invitee_name, case when s.member_id is null then null else public._display_name(s.member_id) end,
         s.role, s.status, s.token, s.created_at
  from public.family_shares s where s.owner_id = auth.uid() order by s.created_at desc;
$$;

-- Read-only copy of a family for someone it has been shared with.
create or replace function public.shared_family_snapshot(p_owner uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r text := public._share_role(p_owner);
begin
  if r is null then raise exception 'This family has not been shared with you' using errcode = '42501'; end if;
  return jsonb_build_object(
    'owner_name', public._display_name(p_owner),
    'role', r,
    'members', coalesce((select jsonb_agg(to_jsonb(m) - 'user_id' order by m.birth_date nulls last)
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

-- Contributors add memories to the family they were invited to; the owner keeps ownership.
create or replace function public.add_shared_story(p_owner uuid, p_title text, p_content text, p_storyteller text default null, p_member uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  if public._share_role(p_owner) not in ('owner', 'contributor') then
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

-- Every row the signed-in person owns, from every table that has a user_id column.
create or replace function public.export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t record;
  rows jsonb;
  result jsonb := jsonb_build_object('exported_at', now());
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'user_id'
      and c.table_name not in ('admin_roles', 'manual_payments_audit')
    order by c.table_name
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x where x.user_id = $1', t.table_name)
      into rows using auth.uid();
    if rows <> '[]'::jsonb then result := result || jsonb_build_object(t.table_name, rows); end if;
  end loop;
  result := result || jsonb_build_object('profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()));
  return result;
end;
$$;

-- Used by the account-removal function (service role only) to find every table holding a user's rows.
create or replace function public.user_data_tables()
returns setof text language sql stable security definer set search_path = public as $$
  select c.table_name::text from information_schema.columns c
  join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
  where c.table_schema = 'public' and c.column_name = 'user_id';
$$;

revoke all on function public.accept_family_invite(text) from public, anon;
revoke all on function public.my_shared_families() from public, anon;
revoke all on function public.my_family_members_shared() from public, anon;
revoke all on function public.shared_family_snapshot(uuid) from public, anon;
revoke all on function public.add_shared_story(uuid, text, text, text, uuid) from public, anon;
revoke all on function public.export_my_data() from public, anon;
revoke all on function public.user_data_tables() from public, anon, authenticated;
grant execute on function public.accept_family_invite(text) to authenticated;
grant execute on function public.my_shared_families() to authenticated;
grant execute on function public.my_family_members_shared() to authenticated;
grant execute on function public.shared_family_snapshot(uuid) to authenticated;
grant execute on function public.add_shared_story(uuid, text, text, text, uuid) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.user_data_tables() to service_role;
