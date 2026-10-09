-- Sales / service enquiries submitted from inside the app (Flow Builder "contact us").
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  company text,
  requirements text,
  plan text,
  source text not null default 'app',
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
drop policy if exists "Users can submit requests" on public.contact_requests;
create policy "Users can submit requests" on public.contact_requests for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Users see their own requests" on public.contact_requests;
create policy "Users see their own requests" on public.contact_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
