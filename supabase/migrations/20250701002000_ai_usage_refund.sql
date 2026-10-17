-- Give a chat message back to someone's daily allowance when no AI service could answer it. Add-only; server use only.
create or replace function public.refund_ai_usage(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_usage_daily set count = count - 1
  where user_id = p_user and day = (now() at time zone 'utc')::date and count > 0;
$$;
revoke all on function public.refund_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_usage(uuid) to service_role;
