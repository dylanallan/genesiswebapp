-- Billing + usage metering. All writes come from Edge Functions using the service role.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none',        -- active | trialing | past_due | canceled | none ...
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
-- No insert/update/delete policies: clients can never grant themselves a plan.

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage_daily enable row level security;
drop policy if exists "Users can read their own usage" on public.ai_usage_daily;
create policy "Users can read their own usage"
  on public.ai_usage_daily for select using (auth.uid() = user_id);

-- Atomically add one use and return the new count for today (service role only).
create or replace function public.increment_ai_usage(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  insert into public.ai_usage_daily (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage_daily.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
revoke all on function public.increment_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.increment_ai_usage(uuid) to service_role;

-- Stripe webhooks can be delivered more than once; remember which events we handled.
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;  -- no policies: service role only
