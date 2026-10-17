-- Pre-launch lock-down of tables an old setup left open to every signed-in user (and a few to anyone).
-- Found in the live database, not in earlier migrations, so every change here checks that the table and policy
-- exist first. Policies are narrowed in place with ALTER POLICY; nothing is removed.
--   * voice_profiles / voice_generations: any user could read, change or remove anyone's cloned family voices.
--   * user_metadata: any user could read or change anyone's security score.
--   * ai_service_config: anyone, even signed out, could read the rows, which have an api_key column.
--   * knowledge_base: anyone could read it and any user could add to or change what the AI assistant reads.
--   * internal settings, keys and logs: readable and changeable by every user; now admins only.
--   * three public storage buckets (empty today) made private so nothing family-related is ever world-readable.

do $$
declare
  r record;
  own_tables text[] := array['user_metadata'];
  admin_tables text[] := array['api_key_management', 'system_settings', 'system_logs', 'system_health_metrics',
    'model_performance_metrics_staging', 'system_performance_logs', 'function_logs', 'notification_logs',
    'notification_channels', 'function_metrics'];
  rule text;
begin
  -- Cloned voices: only the owner.
  for r in select policyname, tablename, cmd from pg_policies
           where schemaname = 'public' and tablename = 'voice_profiles' and 'authenticated' = any(roles)
             and (qual = 'true' or with_check = 'true') loop
    rule := '(user_id = auth.uid())';
    execute format('alter policy %I on public.%I %s', r.policyname, r.tablename,
      case r.cmd when 'INSERT' then 'with check ' || rule when 'UPDATE' then 'using ' || rule || ' with check ' || rule else 'using ' || rule end);
  end loop;

  -- Generated speech: only through a voice the user owns.
  for r in select policyname, tablename, cmd from pg_policies
           where schemaname = 'public' and tablename = 'voice_generations' and 'authenticated' = any(roles)
             and (qual = 'true' or with_check = 'true') loop
    rule := '(exists (select 1 from public.voice_profiles vp where vp.id = voice_profile_id and vp.user_id = auth.uid()))';
    execute format('alter policy %I on public.%I %s', r.policyname, r.tablename,
      case r.cmd when 'INSERT' then 'with check ' || rule when 'UPDATE' then 'using ' || rule || ' with check ' || rule else 'using ' || rule end);
  end loop;

  for r in select policyname, tablename, cmd from pg_policies
           where schemaname = 'public' and tablename = any(own_tables) and (qual = 'true' or with_check = 'true') loop
    rule := '(user_id = auth.uid())';
    execute format('alter policy %I on public.%I %s', r.policyname, r.tablename,
      case r.cmd when 'INSERT' then 'with check ' || rule when 'UPDATE' then 'using ' || rule || ' with check ' || rule else 'using ' || rule end);
  end loop;

  -- Internal tables: admins only.
  for r in select policyname, tablename, cmd from pg_policies
           where schemaname = 'public' and tablename = any(admin_tables) and not ('service_role' = any(roles))
             and (qual = 'true' or with_check = 'true') loop
    rule := '(public.is_admin())';
    execute format('alter policy %I on public.%I %s', r.policyname, r.tablename,
      case r.cmd when 'INSERT' then 'with check ' || rule when 'UPDATE' then 'using ' || rule || ' with check ' || rule else 'using ' || rule end);
  end loop;

  -- Error reports: the app may still send one (as the signed-in user), but only admins read or change them.
  for r in select policyname, tablename, cmd from pg_policies
           where schemaname = 'public' and tablename in ('error_recovery_logs', 'error_logs')
             and (qual in ('true', '(auth.uid() IS NOT NULL)') or with_check in ('true', '(auth.uid() IS NOT NULL)')) loop
    if r.cmd = 'INSERT' then
      if r.tablename = 'error_recovery_logs' then
        execute format('alter policy %I on public.%I with check (user_id is null or user_id = auth.uid())', r.policyname, r.tablename);
      end if;
    elsif r.cmd = 'UPDATE' then
      execute format('alter policy %I on public.%I using (public.is_admin()) with check (public.is_admin())', r.policyname, r.tablename);
    else
      execute format('alter policy %I on public.%I using (public.is_admin())', r.policyname, r.tablename);
    end if;
  end loop;

  -- AI provider settings (has an api_key column): admins only, never signed-out visitors.
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_service_config' and policyname = 'Users can view active AI service configs') then
    alter policy "Users can view active AI service configs" on public.ai_service_config to authenticated using (public.is_admin());
  end if;

  -- Knowledge base: signed-in users read it; only admins (or the service-role ingest job) add or change it.
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'knowledge_base' and policyname = 'Enable read access for all users') then
    alter policy "Enable read access for all users" on public.knowledge_base to authenticated using (true);
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'knowledge_base' and policyname = 'Enable insert for authenticated users') then
    alter policy "Enable insert for authenticated users" on public.knowledge_base with check (public.is_admin());
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'knowledge_base' and policyname = 'Enable update for authenticated users') then
    alter policy "Enable update for authenticated users" on public.knowledge_base using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Belt and braces: signed-out visitors can't read provider settings or internal keys at all.
do $$ begin
  if to_regclass('public.ai_service_config') is not null then revoke all on public.ai_service_config from anon; end if;
  if to_regclass('public.api_key_management') is not null then revoke all on public.api_key_management from anon; end if;
end $$;

-- Public buckets that hold nothing today: make them private so family audio and media are never world-readable.
update storage.buckets set public = false
where id in ('generated-audio', 'timeline-media', 'recipe-images') and public;
