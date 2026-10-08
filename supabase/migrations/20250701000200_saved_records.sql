-- Records a user saves from federated search into their own research notebook.
create table if not exists public.saved_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_id text not null,
  title text not null,
  snippet text,
  record_date text,
  url text not null,
  license text,
  attribution text,
  notes text,
  family_member_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, source, source_id)
);
alter table public.saved_records enable row level security;
drop policy if exists "Users manage their own saved records" on public.saved_records;
create policy "Users manage their own saved records" on public.saved_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
