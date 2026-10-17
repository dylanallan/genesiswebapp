-- Speed for big family trees: privacy rules that call auth.uid() re-check it for every row. Wrapped as
-- (select auth.uid()) Postgres works it out once per query instead. Same rules, same people allowed; only faster.
-- Rewrites each policy in place with ALTER POLICY. Safe to run again (already-wrapped calls are left alone).
do $$
declare
  r record;
  q text;
  c text;
  wrap constant text := '(select auth.uid())';
begin
  for r in select schemaname, tablename, policyname, qual, with_check from pg_policies
           where schemaname = 'public' and (qual ~ 'auth\.uid\(\)' or with_check ~ 'auth\.uid\(\)') loop
    -- Hide calls that are already wrapped, wrap the rest, then put the hidden ones back.
    q := replace(replace(replace(r.qual, '( SELECT auth.uid() AS uid)', '@@W@@'), 'auth.uid()', wrap), '@@W@@', '( SELECT auth.uid() AS uid)');
    c := replace(replace(replace(r.with_check, '( SELECT auth.uid() AS uid)', '@@W@@'), 'auth.uid()', wrap), '@@W@@', '( SELECT auth.uid() AS uid)');
    if q is distinct from r.qual or c is distinct from r.with_check then
      execute format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename)
        || case when q is not null then format(' using (%s)', q) else '' end
        || case when c is not null then format(' with check (%s)', c) else '' end;
    end if;
  end loop;
end $$;
