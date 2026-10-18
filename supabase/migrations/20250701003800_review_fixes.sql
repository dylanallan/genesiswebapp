-- Fixes from the pre-launch security review. Add-only (policies are narrowed in place, functions re-created).

-- 1) Gift codes: buyers read their gifts only through my_gifts(), which hides the code until the payment is confirmed.
--    Reading the table directly is for admins only.
alter policy "Buyers see their gifts, admins see all" on public.gift_codes using (public.is_admin());

create or replace function public.my_gifts()
returns table (id uuid, code text, plan text, months integer, recipient_name text, recipient_email text, message text,
               status text, created_at timestamptz, paid_at timestamptz, expires_at timestamptz, redeemed_at timestamptz,
               reference_code text, amount_cents integer, method text)
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select g.id, case when g.status in ('paid', 'redeemed') then g.code end, g.plan, g.months, g.recipient_name, g.recipient_email,
         g.message, g.status, g.created_at, g.paid_at, g.expires_at, g.redeemed_at, m.reference_code, m.amount_cents, m.method
  from public.gift_codes g join public.manual_payments m on m.id = g.payment_id
  where g.buyer_id = (select auth.uid()) and (select auth.uid()) is not null
  order by g.created_at desc
  limit 100;
$$;
revoke all on function public.my_gifts() from public, anon;
grant execute on function public.my_gifts() to authenticated, service_role;

-- 2) Waitlist: joining again with an email that is already on the list only says so. It no longer returns that
--    person's referral code, place in line or invite count (anyone could type someone else's email).
create or replace function public.join_waitlist(p_email text, p_name text default null, p_source text default null, p_ref text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  row public.waitlist_signups;
  new_code text;
begin
  if length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
    return jsonb_build_object('ok', false, 'reason', 'Please enter a valid email address.');
  end if;

  if exists (select 1 from public.waitlist_signups where lower(email) = e) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

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
end;
$$;

-- Details (who they are, organisation, note) are saved only for a brand-new sign-up, never added to an existing one.
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
  if not coalesce((result->>'ok')::boolean, false) or coalesce((result->>'already')::boolean, false) then return result; end if;
  if i is not null and i not in ('family', 'society', 'partner', 'investor') then i := null; end if;
  update public.waitlist_signups set
    interest = i,
    organization = nullif(left(trim(coalesce(p_organization, '')), 120), ''),
    note = nullif(left(trim(coalesce(p_note, '')), 1000), '')
  where code = result->>'code';
  return result;
end;
$$;
