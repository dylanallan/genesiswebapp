-- Pre-launch waitlist. Add-only. Visitors can only join through join_waitlist() (email checked, repeats ignored,
-- sign-ups capped per hour against spam); only admins can read the list.
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text,
  code text not null,
  referred_by text,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_signups_email_key on public.waitlist_signups (lower(email));
create unique index if not exists waitlist_signups_code_key on public.waitlist_signups (code);
create index if not exists waitlist_signups_created_idx on public.waitlist_signups (created_at);
alter table public.waitlist_signups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'waitlist_signups' and policyname = 'Admins can read the waitlist') then
    create policy "Admins can read the waitlist" on public.waitlist_signups for select to authenticated using (public.is_admin());
  end if;
end $$;
revoke insert, update, delete on public.waitlist_signups from anon, authenticated;
revoke select on public.waitlist_signups from anon;

-- Returns {ok, position, code, invited, already} or {ok:false, reason}.
create or replace function public.join_waitlist(p_email text, p_name text default null, p_source text default null, p_ref text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  row public.waitlist_signups;
  new_code text;
begin
  if length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    return jsonb_build_object('ok', false, 'reason', 'Please enter a valid email address.');
  end if;

  select * into row from public.waitlist_signups where lower(email) = e;
  if row.id is null then
    -- Against bots: no more than 300 new sign-ups an hour overall.
    if (select count(*) from public.waitlist_signups where created_at > now() - interval '1 hour') >= 300 then
      return jsonb_build_object('ok', false, 'reason', 'Lots of people are joining right now. Please try again in a few minutes.');
    end if;
    loop
      new_code := substr(md5(gen_random_uuid()::text), 1, 8);
      exit when not exists (select 1 from public.waitlist_signups where code = new_code);
    end loop;
    insert into public.waitlist_signups (email, name, source, code, referred_by)
    values (e, nullif(left(trim(coalesce(p_name, '')), 80), ''), nullif(left(trim(coalesce(p_source, '')), 60), ''), new_code,
            (select code from public.waitlist_signups where code = left(trim(coalesce(p_ref, '')), 16)))
    returning * into row;
    return jsonb_build_object('ok', true, 'already', false, 'code', row.code,
      'position', (select count(*) from public.waitlist_signups where created_at <= row.created_at), 'invited', 0);
  end if;

  return jsonb_build_object('ok', true, 'already', true, 'code', row.code,
    'position', (select count(*) from public.waitlist_signups where created_at <= row.created_at),
    'invited', (select count(*) from public.waitlist_signups where referred_by = row.code));
end;
$$;
revoke all on function public.join_waitlist(text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated, service_role;
