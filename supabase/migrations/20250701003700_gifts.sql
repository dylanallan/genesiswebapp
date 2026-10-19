-- Gift subscriptions: someone pays for a month or a year of Pro for another person, who redeems a code.
-- Built on the existing manual payments (Interac e-Transfer and PayPal payment links, confirmed by an admin):
-- a gift is a manual payment marked 'gift' plus a row in gift_codes. When the admin confirms that payment the
-- code becomes usable; the buyer does not get Pro from it. Add-only.

-- Which manual payments are for the payer's own plan and which buy a gift.
alter table public.manual_payments add column if not exists purpose text not null default 'self';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'manual_payments_purpose_check') then
    alter table public.manual_payments add constraint manual_payments_purpose_check check (purpose in ('self', 'gift'));
  end if;
end $$;

create table if not exists public.gift_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{12}$'), -- no I, O, 0 or 1, so it reads aloud and types easily
  plan text not null check (plan in ('monthly', 'yearly')),
  months integer not null check (months in (1, 12)),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text check (char_length(recipient_name) <= 80),
  recipient_email text check (char_length(recipient_email) <= 254),
  message text check (char_length(message) <= 500),
  payment_id uuid not null unique references public.manual_payments(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'redeemed', 'cancelled')),
  paid_at timestamptz,
  expires_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists gift_codes_buyer_idx on public.gift_codes (buyer_id, created_at desc);
create index if not exists gift_codes_redeemed_by_idx on public.gift_codes (redeemed_by);
alter table public.gift_codes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gift_codes' and policyname = 'Buyers see their gifts, admins see all') then
    create policy "Buyers see their gifts, admins see all" on public.gift_codes for select to authenticated
      using (buyer_id = (select auth.uid()) or public.is_admin());
  end if;
end $$;
-- No insert, update or delete policies: gifts change only through the functions below.
revoke insert, update, delete on public.gift_codes from anon, authenticated;
revoke select on public.gift_codes from anon;

-- Starts a gift: a pending manual payment (price from app_settings, never from the browser) and its gift code.
-- Returns {payment, gift_id}. The code is only shown to the buyer once the payment is confirmed.
create or replace function public.create_gift_request(p_plan text, p_method text default 'etransfer',
  p_recipient_name text default null, p_recipient_email text default null, p_message text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid();
  ref text;
  gift_code text;
  pay public.manual_payments;
  gift_id uuid;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  configured_monthly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_monthly_cents');
  configured_yearly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_yearly_cents');
  link text := (select value #>> '{}' from public.app_settings where key = 'paypal_link_' || p_plan || '_url');
  email text := nullif(lower(trim(coalesce(p_recipient_email, ''))), '');
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_plan not in ('monthly', 'yearly') then raise exception 'Unknown plan'; end if;
  if p_method not in ('etransfer', 'paypal_link') then raise exception 'Unknown payment method'; end if;
  if coalesce(configured_monthly, 0) <= 0 or coalesce(configured_yearly, 0) <= 0 then raise exception 'Manual payment prices are not configured'; end if;
  if p_method = 'paypal_link' and coalesce(link, '') = '' then raise exception 'PayPal payment link is not configured'; end if;
  if email is not null and (length(email) > 254 or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$') then raise exception 'Recipient email is not valid'; end if;
  -- Against spam: at most 10 unpaid gifts waiting at once.
  if (select count(*) from public.gift_codes where buyer_id = uid and status = 'pending') >= 10 then
    raise exception 'Too many unpaid gifts';
  end if;

  loop
    ref := 'GIFT-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.manual_payments where reference_code = ref);
  end loop;
  insert into public.manual_payments (user_id, method, plan, amount_cents, reference_code, purpose)
  values (uid, p_method, p_plan, case when p_plan = 'monthly' then configured_monthly else configured_yearly end, ref, 'gift')
  returning * into pay;

  loop
    bytes := gen_random_bytes(12);
    gift_code := '';
    for i in 0..11 loop
      gift_code := gift_code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.gift_codes where code = gift_code);
  end loop;
  insert into public.gift_codes (code, plan, months, buyer_id, recipient_name, recipient_email, message, payment_id)
  values (gift_code, p_plan, case when p_plan = 'monthly' then 1 else 12 end, uid,
          nullif(left(trim(coalesce(p_recipient_name, '')), 80), ''), email, nullif(left(trim(coalesce(p_message, '')), 500), ''), pay.id)
  returning id into gift_id;

  return jsonb_build_object('payment', to_jsonb(pay), 'gift_id', gift_id);
end;
$$;
revoke all on function public.create_gift_request(text, text, text, text, text) from public, anon;
grant execute on function public.create_gift_request(text, text, text, text, text) to authenticated, service_role;

-- The person's own plan requests never pick up one of their gift payments.
create or replace function public.create_manual_payment_request(p_plan text, p_method text default 'etransfer')
returns public.manual_payments language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid();
  code text;
  row public.manual_payments;
  configured_monthly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_monthly_cents');
  configured_yearly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_yearly_cents');
  link text := (select value #>> '{}' from public.app_settings where key = 'paypal_link_' || p_plan || '_url');
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_plan not in ('monthly', 'yearly') then raise exception 'Unknown plan'; end if;
  if p_method not in ('etransfer', 'paypal_link') then raise exception 'Unknown payment method'; end if;
  if coalesce(configured_monthly, 0) <= 0 or coalesce(configured_yearly, 0) <= 0 then raise exception 'Manual payment prices are not configured'; end if;
  if p_method = 'paypal_link' and coalesce(link, '') = '' then raise exception 'PayPal payment link is not configured'; end if;
  -- Reuse an open request for the same plan and method instead of piling up duplicates.
  select * into row from public.manual_payments
    where user_id = uid and plan = p_plan and method = p_method and status = 'pending' and purpose = 'self'
    order by created_at desc limit 1;
  if found then return row; end if;
  loop
    code := 'GEN-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.manual_payments where reference_code = code);
  end loop;
  insert into public.manual_payments (user_id, method, plan, amount_cents, reference_code)
  values (uid, p_method, p_plan, case when p_plan = 'monthly' then configured_monthly else configured_yearly end, code)
  returning * into row;
  return row;
end;
$$;

-- Confirming a gift payment makes its code usable for two years; it does not give the buyer Pro.
-- Confirming any other payment works exactly as before.
create or replace function public.review_manual_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns public.manual_payments language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  pay public.manual_payments;
  base timestamptz;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into pay from public.manual_payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if pay.status <> 'pending' then raise exception 'This payment was already reviewed'; end if;

  update public.manual_payments
    set status = case when p_approve then 'confirmed' else 'rejected' end,
        admin_note = p_note, confirmed_by = auth.uid(), confirmed_at = now()
    where id = p_payment_id returning * into pay;

  if pay.purpose = 'gift' then
    update public.gift_codes
      set status = case when p_approve then 'paid' else 'cancelled' end,
          paid_at = case when p_approve then now() end,
          expires_at = case when p_approve then now() + interval '2 years' end
      where payment_id = pay.id and status = 'pending';
    return pay;
  end if;

  if p_approve then
    -- Extend from the later of now or the current paid-through date, so paying early never loses days.
    select greatest(now(), coalesce(current_period_end, now())) into base from public.subscriptions where user_id = pay.user_id;
    base := coalesce(base, now());
    insert into public.subscriptions (user_id, provider, status, price_id, current_period_end, cancel_at_period_end, updated_at)
    values (pay.user_id, pay.method, 'active', pay.plan,
            base + case when pay.plan = 'monthly' then interval '1 month' else interval '1 year' end, true, now())
    on conflict (user_id) do update set
      provider = excluded.provider, status = 'active', price_id = excluded.price_id,
      current_period_end = excluded.current_period_end, cancel_at_period_end = true, updated_at = now();
  end if;
  return pay;
end;
$$;

-- Redeems a gift code for the signed-in person: adds 1 or 12 months of Pro on top of any Pro they already have.
-- Returns {ok, months, until} or {ok:false, reason}. Answers instead of raising, so the daily try counter is kept.
create or replace function public.redeem_gift_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid();
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  g public.gift_codes;
  sub public.subscriptions;
  base timestamptz;
  until timestamptz;
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  -- At most 10 tries a day per person, so codes can't be guessed.
  if not public.consume_daily_quota(uid, 'gift_redeem', 10) then
    return jsonb_build_object('ok', false, 'reason', 'Too many tries today. Please try again tomorrow.');
  end if;

  select * into g from public.gift_codes where code = c for update;
  if not found or g.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'reason', 'That code doesn’t match a gift. Check it and try again.');
  end if;
  if g.status = 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'This gift is waiting for its payment to be confirmed. Please try again later.');
  end if;
  if g.status = 'redeemed' then
    return jsonb_build_object('ok', false, 'reason', 'This gift code has already been used.');
  end if;
  if g.expires_at is not null and g.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'This gift code has expired.');
  end if;

  select * into sub from public.subscriptions where user_id = uid for update;
  -- A PayPal subscription that renews by itself is managed by PayPal; adding time here would be overwritten.
  if found and sub.provider = 'paypal' and sub.status = 'active' and not coalesce(sub.cancel_at_period_end, false) then
    return jsonb_build_object('ok', false, 'reason', 'You already have a PayPal subscription that renews automatically. Cancel it on the Plans page first, or give this gift to someone else.');
  end if;
  base := greatest(now(), coalesce(case when found then sub.current_period_end end, now()));
  until := base + make_interval(months => g.months);

  insert into public.subscriptions (user_id, provider, status, price_id, current_period_end, cancel_at_period_end, updated_at)
  values (uid, 'gift', 'active', g.plan, until, true, now())
  on conflict (user_id) do update set
    provider = 'gift', status = 'active', price_id = excluded.price_id,
    current_period_end = excluded.current_period_end, cancel_at_period_end = true, updated_at = now();

  update public.gift_codes set status = 'redeemed', redeemed_by = uid, redeemed_at = now() where id = g.id;
  return jsonb_build_object('ok', true, 'months', g.months, 'until', until);
end;
$$;
revoke all on function public.redeem_gift_code(text) from public, anon;
grant execute on function public.redeem_gift_code(text) to authenticated, service_role;

-- The gifts this person has bought. The code shows only once the payment is confirmed.
create or replace function public.my_gifts()
returns table (id uuid, code text, plan text, months integer, recipient_name text, recipient_email text, message text,
               status text, created_at timestamptz, paid_at timestamptz, expires_at timestamptz, redeemed_at timestamptz,
               reference_code text, amount_cents integer, method text)
language sql stable security invoker set search_path = public, extensions, pg_temp as $$
  select g.id, case when g.status in ('paid', 'redeemed') then g.code end, g.plan, g.months, g.recipient_name, g.recipient_email,
         g.message, g.status, g.created_at, g.paid_at, g.expires_at, g.redeemed_at, m.reference_code, m.amount_cents, m.method
  from public.gift_codes g join public.manual_payments m on m.id = g.payment_id
  where g.buyer_id = (select auth.uid())
  order by g.created_at desc
  limit 100;
$$;
revoke all on function public.my_gifts() from public, anon;
grant execute on function public.my_gifts() to authenticated, service_role;
