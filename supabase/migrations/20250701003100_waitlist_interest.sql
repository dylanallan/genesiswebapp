-- Waitlist segments: who is signing up (a family, a genealogy group, a business partner, an investor or buyer),
-- plus an optional organisation and note, so the owner can follow up with the right people. Add-only.
alter table public.waitlist_signups add column if not exists interest text;
alter table public.waitlist_signups add column if not exists organization text;
alter table public.waitlist_signups add column if not exists note text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'waitlist_signups_interest_check') then
    alter table public.waitlist_signups add constraint waitlist_signups_interest_check
      check (interest is null or interest in ('family', 'society', 'partner', 'investor'));
  end if;
end $$;
create index if not exists waitlist_signups_interest_idx on public.waitlist_signups (interest);

-- Same as join_waitlist, and also records the segment. Details are only filled in when still empty, so someone who
-- knows another person's email can't overwrite what that person told us.
create or replace function public.join_waitlist_v2(p_email text, p_name text default null, p_source text default null, p_ref text default null,
  p_interest text default null, p_organization text default null, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  result jsonb := public.join_waitlist(p_email, p_name, p_source, p_ref);
  i text := nullif(lower(trim(coalesce(p_interest, ''))), '');
begin
  if not coalesce((result->>'ok')::boolean, false) then return result; end if;
  if i is not null and i not in ('family', 'society', 'partner', 'investor') then i := null; end if;
  update public.waitlist_signups set
    interest = coalesce(interest, i),
    organization = coalesce(organization, nullif(left(trim(coalesce(p_organization, '')), 120), '')),
    note = coalesce(note, nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  where code = result->>'code';
  return result;
end;
$$;
revoke all on function public.join_waitlist_v2(text, text, text, text, text, text, text) from public;
grant execute on function public.join_waitlist_v2(text, text, text, text, text, text, text) to anon, authenticated, service_role;
