-- Privileged (SECURITY DEFINER) functions must never be callable by signed-out visitors, and signed-in users may
-- call only the ones the app itself uses. Several functions accept a user id so Edge Functions (service role) can
-- act for a user; they reject a mismatched id only when a user is signed in, so the anon role must not reach them.
-- Older projects also carry legacy functions (API-key readers, chat-history readers taking any user id) that the
-- app no longer uses. Only privileges change; no function, table or row is removed.
do $$
declare
  f record;
  app_rpcs text[] := array[
    'admin_list_manual_payments', 'analyze_conversation', 'create_etransfer_request', 'create_manual_payment_request',
    'find_similar_messages', 'get_ai_provider_metrics', 'get_user_profile', 'get_user_profile_history',
    'has_pro_access', 'optimize_database_performance', 'review_manual_payment', 'set_setting',
    'track_ai_usage', 'update_user_profile_batch'];
begin
  for f in
    select p.oid::regprocedure as sig, p.proname as name
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.prokind = 'f'
  loop
    -- is_admin() is evaluated inside row-level security policies, so every role keeps it (it only says yes for admins).
    continue when f.name = 'is_admin';
    execute format('revoke execute on function %s from public, anon', f.sig);
    if not (f.name = any (app_rpcs)) then
      execute format('revoke execute on function %s from authenticated', f.sig);
    end if;
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- Views from older projects that ran with their creator's rights now apply the caller's row-level security.
do $$
declare v record;
begin
  for v in
    select c.oid::regclass as rel from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
      and not coalesce('security_invoker=true' = any (c.reloptions), false)
  loop
    execute format('alter view %s set (security_invoker = true)', v.rel);
  end loop;
end $$;

-- Materialized views cannot enforce row-level security; signed-out visitors must not read them.
do $$
declare m record;
begin
  for m in select c.oid::regclass as rel from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'm'
  loop
    execute format('revoke select on %s from anon', m.rel);
  end loop;
end $$;

-- Tables an older version left without row-level security (all unused by the app): server-side access only.
alter table if exists public.media_assets enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.external_sources enable row level security;
alter table if exists public.historical_events enable row level security;
