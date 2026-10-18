-- A gift that was paid for keeps working if the buyer later deletes their account: the person who received it
-- shouldn't lose it. Add-only: when a paid, unused gift is removed together with the buyer's account, it is first
-- copied to gift_codes_kept (without the recipient's email, which was only for the buyer's own list), and
-- redeem_gift_code accepts codes from there too.

create table if not exists public.gift_codes_kept (
  id uuid primary key,
  code text not null unique,
  plan text not null check (plan in ('monthly', 'yearly')),
  months integer not null check (months in (1, 12)),
  recipient_name text,
  message text,
  status text not null default 'paid' check (status in ('paid', 'redeemed')),
  paid_at timestamptz,
  expires_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null,
  kept_at timestamptz not null default now()
);
alter table public.gift_codes_kept enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gift_codes_kept' and policyname = 'Admins can read kept gifts') then
    create policy "Admins can read kept gifts" on public.gift_codes_kept for select to authenticated using (public.is_admin());
  end if;
end $$;
revoke insert, update, delete on public.gift_codes_kept from anon, authenticated;
revoke select on public.gift_codes_kept from anon;

create or replace function public.keep_paid_gift()
returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if old.status = 'paid' then
    insert into public.gift_codes_kept (id, code, plan, months, recipient_name, message, status, paid_at, expires_at, created_at)
    values (old.id, old.code, old.plan, old.months, old.recipient_name, old.message, 'paid', old.paid_at, old.expires_at, old.created_at)
    on conflict do nothing;
  end if;
  return old;
end;
$$;
revoke all on function public.keep_paid_gift() from public, anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'gift_codes_keep_paid' and tgrelid = 'public.gift_codes'::regclass) then
    create trigger gift_codes_keep_paid before delete on public.gift_codes for each row execute function public.keep_paid_gift();
  end if;
end $$;

-- Same as before, and also redeems kept gifts.
create or replace function public.redeem_gift_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  uid uuid := auth.uid();
  c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  g public.gift_codes;
  k public.gift_codes_kept;
  kept boolean := false;
  g_status text;
  g_months integer;
  g_plan text;
  g_expires timestamptz;
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
  if found then
    g_status := g.status; g_months := g.months; g_plan := g.plan; g_expires := g.expires_at;
  else
    select * into k from public.gift_codes_kept where code = c for update;
    if found then
      kept := true; g_status := k.status; g_months := k.months; g_plan := k.plan; g_expires := k.expires_at;
    end if;
  end if;

  if g_status is null or g_status = 'cancelled' then
    return jsonb_build_object('ok', false, 'reason', 'That code doesn’t match a gift. Check it and try again.');
  end if;
  if g_status = 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'This gift is waiting for its payment to be confirmed. Please try again later.');
  end if;
  if g_status = 'redeemed' then
    return jsonb_build_object('ok', false, 'reason', 'This gift code has already been used.');
  end if;
  if g_expires is not null and g_expires < now() then
    return jsonb_build_object('ok', false, 'reason', 'This gift code has expired.');
  end if;

  select * into sub from public.subscriptions where user_id = uid for update;
  -- A PayPal subscription that renews by itself is managed by PayPal; adding time here would be overwritten.
  if found and sub.provider = 'paypal' and sub.status = 'active' and not coalesce(sub.cancel_at_period_end, false) then
    return jsonb_build_object('ok', false, 'reason', 'You already have a PayPal subscription that renews automatically. Cancel it on the Plans page first, or give this gift to someone else.');
  end if;
  base := greatest(now(), coalesce(case when found then sub.current_period_end end, now()));
  until := base + make_interval(months => g_months);

  insert into public.subscriptions (user_id, provider, status, price_id, current_period_end, cancel_at_period_end, updated_at)
  values (uid, 'gift', 'active', g_plan, until, true, now())
  on conflict (user_id) do update set
    provider = 'gift', status = 'active', price_id = excluded.price_id,
    current_period_end = excluded.current_period_end, cancel_at_period_end = true, updated_at = now();

  if kept then
    update public.gift_codes_kept set status = 'redeemed', redeemed_by = uid, redeemed_at = now() where id = k.id;
  else
    update public.gift_codes set status = 'redeemed', redeemed_by = uid, redeemed_at = now() where id = g.id;
  end if;
  return jsonb_build_object('ok', true, 'months', g_months, 'until', until);
end;
$$;
revoke all on function public.redeem_gift_code(text) from public, anon;
grant execute on function public.redeem_gift_code(text) to authenticated, service_role;
