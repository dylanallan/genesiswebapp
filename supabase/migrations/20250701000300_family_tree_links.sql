-- Fields the family tree UI needs (relationship to the user, links between people, provenance).
alter table public.family_members
  add column if not exists relationship text,
  add column if not exists parent_ids uuid[] not null default '{}',
  add column if not exists spouse_ids uuid[] not null default '{}',
  add column if not exists children_ids uuid[] not null default '{}',
  add column if not exists source text not null default 'user',     -- user | ai | validated
  add column if not exists confidence integer not null default 100;

alter table public.family_members alter column user_id set default auth.uid();
alter table public.family_members alter column last_name drop not null;  -- many ancestors are known by one name
create index if not exists family_members_user_idx on public.family_members (user_id);

-- Explicit write check (FOR ALL with only USING also checks inserts, but be explicit).
drop policy if exists "Users can manage their family members" on public.family_members;
create policy "Users can manage their family members" on public.family_members
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
