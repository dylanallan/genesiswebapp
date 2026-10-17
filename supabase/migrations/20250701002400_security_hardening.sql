-- Security hardening from the live database's security advisor. Changes permissions and settings only; nothing is
-- removed. Safe to re-run.

-- 1. Older projects still carry a find_similar_messages that searches every person's AI conversations when no user
--    id is given. Nothing in the app calls it any more (memory search was retired), so signed-in users lose access.
--    The Edge Functions (service role) keep it.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.proname = 'find_similar_messages'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- 2. Materialized views ignore row-level security, so they must not be readable over the public API.
--    model_performance_summary (AI service speed, no personal data) stays readable for the admin dashboard.
do $$
declare v record;
begin
  for v in select c.oid::regclass as rel, c.relname from pg_class c
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'm'
  loop
    execute format('revoke all on %s from anon', v.rel);
    if v.relname <> 'model_performance_summary' then
      execute format('revoke all on %s from authenticated', v.rel);
    end if;
  end loop;
end $$;

-- 3. Every function gets a fixed search path, so a function can't be tricked into using a look-alike table or
--    function from another schema. Functions that belong to extensions (vector, pg_trgm) are left as they are.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p')
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set search_path = public, extensions, pg_temp', f.sig);
  end loop;
end $$;
