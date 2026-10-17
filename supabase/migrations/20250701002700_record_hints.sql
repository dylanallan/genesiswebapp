-- Record hints: likely matching archive records found for people in the tree, each with its evidence. Add-only.
-- record_hint_checks remembers when each person was last searched, so hints move on through the whole tree;
-- record_hints keeps each suggestion and what the person decided (saved or "not them"), so a dismissed hint never returns.
create table if not exists public.record_hint_checks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  checked_at timestamptz not null default now(),
  primary key (user_id, family_member_id)
);
alter table public.record_hint_checks enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'record_hint_checks' and policyname = 'Owners manage their hint checks') then
    create policy "Owners manage their hint checks" on public.record_hint_checks for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
revoke all on public.record_hint_checks from anon;

create table if not exists public.record_hints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  source text not null,
  source_id text not null,
  source_label text,
  title text not null,
  snippet text,
  record_date text,
  url text not null,
  license text,
  attribution text,
  score integer not null,
  level text not null check (level in ('strong', 'possible', 'weak', 'unlikely')),
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'saved', 'dismissed')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (user_id, family_member_id, source, source_id)
);
create index if not exists record_hints_user_status_idx on public.record_hints (user_id, status, score desc);
alter table public.record_hints enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'record_hints' and policyname = 'Owners manage their record hints') then
    create policy "Owners manage their record hints" on public.record_hints for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
revoke all on public.record_hints from anon;
