-- Error reports from people's browsers, so problems can be found and fixed without anyone having to report them.
-- Add-only. People can only add reports through report_client_error (capped per person per day); only admins can read them.
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  location text,
  page text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists client_errors_created_idx on public.client_errors (created_at desc);
create index if not exists client_errors_user_day_idx on public.client_errors (user_id, created_at);
alter table public.client_errors enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'client_errors' and policyname = 'Admins can read client errors') then
    create policy "Admins can read client errors" on public.client_errors for select to authenticated using (public.is_admin());
  end if;
end $$;
revoke insert, update, delete on public.client_errors from anon, authenticated;

create or replace function public.report_client_error(p_message text, p_location text default null, p_page text default null, p_user_agent text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or coalesce(trim(p_message), '') = '' then
    return false;
  end if;
  -- At most 30 reports per person per day, and never the same message twice in ten minutes.
  if (select count(*) from public.client_errors where user_id = me and created_at > now() - interval '1 day') >= 30 then
    return false;
  end if;
  if exists (select 1 from public.client_errors where user_id = me and message = left(p_message, 500) and created_at > now() - interval '10 minutes') then
    return false;
  end if;
  insert into public.client_errors (user_id, message, location, page, user_agent)
  values (me, left(p_message, 500), left(p_location, 2000), left(p_page, 300), left(p_user_agent, 300));
  return true;
end;
$$;
revoke all on function public.report_client_error(text, text, text, text) from public, anon;
grant execute on function public.report_client_error(text, text, text, text) to authenticated;
