-- Older projects have required columns the app never fills (for example voice_profiles.audio_path), so inserts
-- from the app fail. Giving them a neutral default keeps the old data and constraints and lets new rows in.
-- (The 20250701000350 upgrade also makes such columns optional; this covers projects where that step was deferred.)
-- Columns that do not exist are skipped, so this is a no-op on fresh projects.
do $$
declare
  d record;
begin
  for d in select * from (values
    ('ai_request_logs', 'request_type', $v$''$v$), ('ai_request_logs', 'service_name', $v$''$v$),
    ('ai_service_config', 'api_key', $v$''$v$),
    ('automation_workflows', 'actions', $v$'[]'::jsonb$v$), ('automation_workflows', 'trigger_conditions', $v$'{}'::jsonb$v$),
    ('family_members', 'last_name', $v$''$v$),
    ('function_logs', 'environment', $v$''$v$), ('function_logs', 'function', $v$''$v$),
    ('function_logs', 'level', $v$'info'$v$), ('function_logs', 'message', $v$''$v$),
    ('notification_templates', 'name', $v$''$v$),
    ('performance_metrics', 'service_name', $v$''$v$),
    ('recipes', 'ingredients', $v$'[]'::jsonb$v$), ('recipes', 'instructions', $v$'[]'::jsonb$v$),
    ('system_health_metrics', 'metric_name', $v$'snapshot'$v$), ('system_health_metrics', 'metric_value', $v$0$v$),
    ('timeline_events', 'event_date', $v$current_date$v$),
    ('voice_profiles', 'audio_path', $v$''$v$)
  ) as t(tbl, col, def)
  loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = d.tbl and column_name = d.col and column_default is null) then
      execute format('alter table public.%I alter column %I set default %s', d.tbl, d.col, d.def);
    end if;
  end loop;
end $$;
