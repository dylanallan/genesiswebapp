-- Speed: an index on every single-column link between tables that has none (for example a story's family member,
-- or a hint's person), so opening and tidying a big tree doesn't scan whole tables. Add-only; safe to run again.
do $$
declare r record;
begin
  for r in select c.conrelid::regclass as tbl, (select relname from pg_class where oid = c.conrelid) as tname, a.attname as col
           from pg_constraint c
           join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
           where c.contype = 'f' and array_length(c.conkey, 1) = 1
             and (select relnamespace from pg_class where oid = c.conrelid) = 'public'::regnamespace
             and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]) loop
    execute format('create index if not exists %I on %s (%I)', left('fk_' || r.tname || '_' || r.col, 63), r.tbl, r.col);
  end loop;
end $$;
