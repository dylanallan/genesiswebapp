-- Per-person daily usage counters, so no one (or no bot) can use the app to bulk-copy data or run up costs.
create table if not exists public.daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, kind, day)
);
alter table public.daily_usage enable row level security;
do $do$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_usage' and policyname = 'Users read their own usage') then
    create policy "Users read their own usage" on public.daily_usage for select to authenticated using (auth.uid() = user_id);
  end if;
end $do$;

-- Adds one use and says whether it is still within today's limit. Called by Edge Functions (service role) only.
create or replace function public.consume_daily_quota(p_user uuid, p_kind text, p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  used integer;
begin
  insert into public.daily_usage as u (user_id, kind, day, count) values (p_user, p_kind, current_date, 1)
  on conflict (user_id, kind, day) do update set count = u.count + 1
  returning count into used;
  return used <= p_limit;
end;
$$;
revoke all on function public.consume_daily_quota(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consume_daily_quota(uuid, text, integer) to service_role;
