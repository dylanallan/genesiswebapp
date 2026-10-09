-- PayPal payment links: a second way to pay that works with any PayPal Business account, without developer
-- (REST API) credentials. The customer gets a reference code, pays through the admin's PayPal payment link
-- with the code in the note, and an admin confirms it in Payments (admin), exactly like an e-Transfer.

alter table public.manual_payments drop constraint if exists manual_payments_method_check;
alter table public.manual_payments add constraint manual_payments_method_check check (method in ('etransfer', 'paypal_link'));

insert into public.app_settings (key, value, category, data_type, description) values
  ('paypal_link_monthly_url', '""'::jsonb, 'billing', 'string', 'PayPal payment link for one month of Pro (same price as e-Transfer)'),
  ('paypal_link_yearly_url', '""'::jsonb, 'billing', 'string', 'PayPal payment link for one year of Pro (same price as e-Transfer)')
on conflict (key) do nothing;

-- One request function for both manual methods. Prices come only from app_settings, never from the browser.
create or replace function public.create_manual_payment_request(p_plan text, p_method text default 'etransfer')
returns public.manual_payments language plpgsql security definer set search_path = public as $$
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
    where user_id = uid and plan = p_plan and method = p_method and status = 'pending' order by created_at desc limit 1;
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
revoke all on function public.create_manual_payment_request(text, text) from public, anon;
grant execute on function public.create_manual_payment_request(text, text) to authenticated;

create or replace function public.create_etransfer_request(p_plan text)
returns public.manual_payments language sql security definer set search_path = public as $$
  select * from public.create_manual_payment_request(p_plan, 'etransfer');
$$;

-- Confirming records which method paid, so the Plans page can describe it correctly.
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
    values (pay.user_id, pay.method, 'active', pay.plan,
            base + case when pay.plan = 'monthly' then interval '1 month' else interval '1 year' end, true, now())
    on conflict (user_id) do update set
      provider = excluded.provider, status = 'active', price_id = excluded.price_id,
      current_period_end = excluded.current_period_end, cancel_at_period_end = true, updated_at = now();
  end if;
  return pay;
end;
$$;

-- The admin list now says how each request is being paid.
drop function if exists public.admin_list_manual_payments(text);
create function public.admin_list_manual_payments(p_status text default 'pending')
returns table (id uuid, user_id uuid, email text, method text, plan text, amount_cents integer, currency text,
               reference_code text, status text, admin_note text, created_at timestamptz, confirmed_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select m.id, m.user_id, u.email::text, m.method, m.plan, m.amount_cents, m.currency, m.reference_code, m.status,
           m.admin_note, m.created_at, m.confirmed_at
    from public.manual_payments m join auth.users u on u.id = m.user_id
    where p_status is null or m.status = p_status
    order by m.created_at desc
    limit 200;
end;
$$;
revoke all on function public.admin_list_manual_payments(text) from public, anon;
grant execute on function public.admin_list_manual_payments(text) to authenticated;
