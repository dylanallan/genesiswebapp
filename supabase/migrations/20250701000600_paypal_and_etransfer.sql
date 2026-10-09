-- Payments: PayPal subscriptions (automatic) and Interac e-Transfer (manual, confirmed by an admin).

alter table public.subscriptions
  add column if not exists provider text,                       -- paypal | etransfer (legacy rows: stripe)
  add column if not exists provider_subscription_id text,
  add column if not exists provider_customer_id text;
create unique index if not exists subscriptions_provider_sub_idx
  on public.subscriptions (provider_subscription_id) where provider_subscription_id is not null;

-- Webhook de-duplication for any payment provider.
create table if not exists public.billing_events (
  id text primary key,          -- provider event id
  provider text not null,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.billing_events enable row level security;   -- service role only

-- One rule for "does this user have Pro?", used by the database, Edge Functions and the app:
-- an active plan whose paid period has not ended (3-day grace for late renewals),
-- or a cancelled plan that is still inside the period already paid for.
create or replace function public.has_pro_access(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  -- Signed-in users may only ask about themselves (admins and the service role may ask about anyone).
  select (auth.uid() is null or auth.uid() = p_user or public.is_admin()) and exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user and (
      (s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end + interval '3 days' > now()))
      or (s.status = 'canceled' and s.current_period_end > now())
    )
  );
$$;

-- Interac e-Transfer requests. The customer creates one (pending); an admin confirms it after the money arrives.
create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  method text not null default 'etransfer' check (method in ('etransfer')),
  plan text not null check (plan in ('monthly', 'yearly')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'CAD',
  reference_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  payer_note text,
  admin_note text,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists manual_payments_status_idx on public.manual_payments (status, created_at desc);
alter table public.manual_payments enable row level security;
drop policy if exists "Users see their own payments" on public.manual_payments;
create policy "Users see their own payments" on public.manual_payments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- No insert policy: customers create requests only through create_etransfer_request (server-side prices).

-- Creates an e-Transfer request with a short, unique reference code and the configured price.
-- Prices come only from app_settings (admin-managed), never from the browser.
insert into public.app_settings (key, value, category, data_type, description) values
  ('etransfer_monthly_cents', '1900'::jsonb, 'billing', 'number', 'Interac e-Transfer price for one month of Pro, in cents (CAD)'),
  ('etransfer_yearly_cents', '19000'::jsonb, 'billing', 'number', 'Interac e-Transfer price for one year of Pro, in cents (CAD)'),
  ('etransfer_email', '""'::jsonb, 'billing', 'string', 'Email address customers send Interac e-Transfers to')
on conflict (key) do nothing;

create or replace function public.create_etransfer_request(p_plan text)
returns public.manual_payments language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  code text;
  row public.manual_payments;
  configured_monthly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_monthly_cents');
  configured_yearly integer := (select (value #>> '{}')::integer from public.app_settings where key = 'etransfer_yearly_cents');
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_plan not in ('monthly', 'yearly') then raise exception 'Unknown plan'; end if;
  if coalesce(configured_monthly, 0) <= 0 or coalesce(configured_yearly, 0) <= 0 then raise exception 'e-Transfer prices are not configured'; end if;
  -- Reuse an open request for the same plan instead of piling up duplicates.
  select * into row from public.manual_payments where user_id = uid and plan = p_plan and status = 'pending' order by created_at desc limit 1;
  if found then return row; end if;
  loop
    code := 'GEN-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.manual_payments where reference_code = code);
  end loop;
  insert into public.manual_payments (user_id, plan, amount_cents, reference_code)
  values (uid, p_plan, case when p_plan = 'monthly' then configured_monthly else configured_yearly end, code)
  returning * into row;
  return row;
end;
$$;

-- Admin confirms (or rejects) a received e-Transfer; confirming extends Pro by one month or one year.
create or replace function public.review_manual_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns public.manual_payments language plpgsql security definer set search_path = public as $$
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

  if p_approve then
    -- Extend from the later of now or the current paid-through date, so paying early never loses days.
    select greatest(now(), coalesce(current_period_end, now())) into base from public.subscriptions where user_id = pay.user_id;
    base := coalesce(base, now());
    insert into public.subscriptions (user_id, provider, status, price_id, current_period_end, cancel_at_period_end, updated_at)
    values (pay.user_id, 'etransfer', 'active', pay.plan,
            base + case when pay.plan = 'monthly' then interval '1 month' else interval '1 year' end, true, now())
    on conflict (user_id) do update set
      provider = 'etransfer', status = 'active', price_id = excluded.price_id,
      current_period_end = excluded.current_period_end, cancel_at_period_end = true, updated_at = now();
  end if;
  return pay;
end;
$$;

revoke all on function public.create_etransfer_request(text) from public, anon;
grant execute on function public.create_etransfer_request(text) to authenticated;
revoke all on function public.review_manual_payment(uuid, boolean, text) from public, anon;
grant execute on function public.review_manual_payment(uuid, boolean, text) to authenticated;

-- Admin view of e-Transfer requests, with the customer's email so transfers can be matched.
drop function if exists public.admin_list_manual_payments(text); -- return type changes in a later migration
create function public.admin_list_manual_payments(p_status text default 'pending')
returns table (id uuid, user_id uuid, email text, plan text, amount_cents integer, currency text,
               reference_code text, status text, admin_note text, created_at timestamptz, confirmed_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select m.id, m.user_id, u.email::text, m.plan, m.amount_cents, m.currency, m.reference_code, m.status,
           m.admin_note, m.created_at, m.confirmed_at
    from public.manual_payments m join auth.users u on u.id = m.user_id
    where p_status is null or m.status = p_status
    order by m.created_at desc
    limit 200;
end;
$$;
revoke all on function public.admin_list_manual_payments(text) from public, anon;
grant execute on function public.admin_list_manual_payments(text) to authenticated;
