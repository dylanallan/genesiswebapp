-- Upgrades projects created by older versions of this app, whose tables may already exist with a different
-- layout. Only adds what later migrations rely on; nothing is dropped or renamed and no rows are changed.
-- On a fresh project these tables do not exist yet, so every statement here is a no-op.

-- Older layouts have required (NOT NULL, no default) columns the app never fills, which would make every insert
-- fail. Those become optional; the app's own required columns and primary keys keep their constraints.
create or replace function public._relax_old_required_columns(p_table text, p_keep text[])
returns void language plpgsql set search_path = public as $$
declare r record;
begin
  for r in
    select c.column_name from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = p_table and c.is_nullable = 'NO' and c.column_default is null
      and c.column_name <> all(p_keep)
      and c.column_name not in (
        select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
        where i.indrelid = to_regclass('public.' || quote_ident(p_table)) and i.indisprimary)
  loop
    execute format('alter table public.%I alter column %I drop not null', p_table, r.column_name);
  end loop;
end;
$$;
revoke all on function public._relax_old_required_columns(text, text[]) from public, anon, authenticated;

alter table if exists public.admin_roles
  add column if not exists user_id uuid,
  add column if not exists role text default 'admin',
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('admin_roles', array['user_id', 'role', 'created_at']);
alter table if exists public.user_profiles
  add column if not exists id uuid,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists ancestry text,
  add column if not exists business_goals text,
  add column if not exists cultural_background text,
  add column if not exists location text,
  add column if not exists timezone text,
  add column if not exists language text,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists preferences jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
select public._relax_old_required_columns('user_profiles', array['id', 'onboarding_completed', 'preferences', 'created_at', 'updated_at']);
alter table if exists public.user_data
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists preferences jsonb default '{}'::jsonb,
  add column if not exists settings jsonb default '{}'::jsonb,
  add column if not exists last_login timestamptz,
  add column if not exists login_count integer default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.user_data alter column user_id set default auth.uid();
select public._relax_old_required_columns('user_data', array['user_id', 'preferences', 'settings', 'login_count', 'created_at', 'updated_at']);
alter table if exists public.user_profile_history
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists field_name text,
  add column if not exists old_value text,
  add column if not exists new_value text,
  add column if not exists reason text,
  add column if not exists ip_address text,
  add column if not exists created_at timestamptz default now();
alter table if exists public.user_profile_history alter column user_id set default auth.uid();
select public._relax_old_required_columns('user_profile_history', array['id', 'user_id', 'field_name', 'created_at']);
alter table if exists public.cultural_artifacts
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists tags text[] default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.cultural_artifacts alter column user_id set default auth.uid();
select public._relax_old_required_columns('cultural_artifacts', array['id', 'user_id', 'title', 'category', 'metadata', 'tags', 'created_at', 'updated_at']);
alter table if exists public.cultural_stories
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists title text,
  add column if not exists content text,
  add column if not exists storyteller text,
  add column if not exists date_recorded timestamptz default now(),
  add column if not exists location text,
  add column if not exists themes text[] default '{}',
  add column if not exists language text,
  add column if not exists translation text,
  add column if not exists verification_status text default 'unverified',
  add column if not exists verification_details jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.cultural_stories alter column user_id set default auth.uid();
select public._relax_old_required_columns('cultural_stories', array['id', 'user_id', 'title', 'content', 'verification_status', 'verification_details', 'created_at', 'updated_at']);
alter table if exists public.traditions
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists origin text,
  add column if not exists historical_context text,
  add column if not exists modern_application text,
  add column if not exists frequency text,
  add column if not exists participants text[] default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.traditions alter column user_id set default auth.uid();
select public._relax_old_required_columns('traditions', array['id', 'user_id', 'name', 'created_at', 'updated_at']);
alter table if exists public.celebrations
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists date_or_season text,
  add column if not exists significance text,
  add column if not exists location text,
  add column if not exists participants text[] default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.celebrations alter column user_id set default auth.uid();
select public._relax_old_required_columns('celebrations', array['id', 'user_id', 'name', 'created_at', 'updated_at']);
alter table if exists public.family_contacts
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists relationship text,
  add column if not exists contact_info jsonb default '{}'::jsonb,
  add column if not exists birth_date date,
  add column if not exists location text,
  add column if not exists notes text,
  add column if not exists related_names text[] default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.family_contacts alter column user_id set default auth.uid();
select public._relax_old_required_columns('family_contacts', array['id', 'user_id', 'name', 'contact_info', 'created_at', 'updated_at']);
alter table if exists public.recipes
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists origin text,
  add column if not exists "culturalSignificance" text,
  add column if not exists ingredients jsonb default '[]'::jsonb,
  add column if not exists instructions jsonb default '[]'::jsonb,
  add column if not exists "prepTime" integer,
  add column if not exists "cookTime" integer,
  add column if not exists servings integer,
  add column if not exists difficulty text,
  add column if not exists story text,
  add column if not exists tags text[] default '{}',
  add column if not exists rating numeric,
  add column if not exists image text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.recipes alter column user_id set default auth.uid();
select public._relax_old_required_columns('recipes', array['id', 'user_id', 'name', 'ingredients', 'instructions', 'created_at', 'updated_at']);
alter table if exists public.timeline_events
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists date date,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists location text,
  add column if not exists people text[] default '{}',
  add column if not exists media jsonb default '[]'::jsonb,
  add column if not exists category text default 'other',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.timeline_events alter column user_id set default auth.uid();
select public._relax_old_required_columns('timeline_events', array['id', 'user_id', 'date', 'title', 'people', 'media', 'category', 'created_at', 'updated_at']);
alter table if exists public.dna_insights
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists insights jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.dna_insights alter column user_id set default auth.uid();
select public._relax_old_required_columns('dna_insights', array['id', 'user_id', 'insights', 'created_at']);
alter table if exists public.photo_analyses
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists photo_path text,
  add column if not exists analysis jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.photo_analyses alter column user_id set default auth.uid();
select public._relax_old_required_columns('photo_analyses', array['id', 'user_id', 'photo_path', 'analysis', 'created_at']);
alter table if exists public.face_names
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists face_id text,
  add column if not exists name text,
  add column if not exists updated_at timestamptz default now();
alter table if exists public.face_names alter column user_id set default auth.uid();
select public._relax_old_required_columns('face_names', array['user_id', 'face_id', 'name', 'updated_at']);
alter table if exists public.conversations
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists title text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.conversations alter column user_id set default auth.uid();
select public._relax_old_required_columns('conversations', array['id', 'user_id', 'created_at', 'updated_at']);
alter table if exists public.messages
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists conversation_id uuid,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('messages', array['id', 'conversation_id', 'role', 'content', 'metadata', 'created_at']);
alter table if exists public.conversation_summaries
  add column if not exists session_id text,
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists summary text,
  add column if not exists summary_type text default 'brief',
  add column if not exists message_count integer,
  add column if not exists created_at timestamptz default now();
alter table if exists public.conversation_summaries alter column user_id set default auth.uid();
select public._relax_old_required_columns('conversation_summaries', array['session_id', 'user_id', 'summary', 'summary_type', 'created_at']);
alter table if exists public.ai_conversation_history
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists conversation_id uuid,
  add column if not exists session_id text,
  add column if not exists message text,
  add column if not exists role text,
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.ai_conversation_history alter column user_id set default auth.uid();
select public._relax_old_required_columns('ai_conversation_history', array['id', 'user_id', 'message', 'role', 'created_at']);
alter table if exists public.ai_custom_instructions
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists instructions text default '',
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamptz default now();
alter table if exists public.ai_custom_instructions alter column user_id set default auth.uid();
select public._relax_old_required_columns('ai_custom_instructions', array['user_id', 'instructions', 'is_active', 'updated_at']);
alter table if exists public.ai_embeddings
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists content text,
  add column if not exists content_id text,
  add column if not exists content_type text,
  add column if not exists source text,
  add column if not exists embedding vector(1536),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.ai_embeddings alter column user_id set default auth.uid();
select public._relax_old_required_columns('ai_embeddings', array['id', 'user_id', 'content', 'metadata', 'created_at']);
alter table if exists public.knowledge_base
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists content text,
  add column if not exists content_length integer,
  add column if not exists content_tokens integer,
  add column if not exists embedding vector(1536),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists source text,
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('knowledge_base', array['id', 'content', 'content_length', 'content_tokens', 'metadata', 'created_at']);
alter table if exists public.ai_feedback
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists response_id text,
  add column if not exists rating integer,
  add column if not exists was_helpful boolean,
  add column if not exists categories text[] default '{}',
  add column if not exists comment text,
  add column if not exists created_at timestamptz default now();
alter table if exists public.ai_feedback alter column user_id set default auth.uid();
select public._relax_old_required_columns('ai_feedback', array['id', 'user_id', 'created_at']);
alter table if exists public.ai_usage_quotas
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists monthly_token_limit integer,
  add column if not exists tokens_used integer default 0,
  add column if not exists period_start date default date_trunc('month', now())::date,
  add column if not exists updated_at timestamptz default now();
alter table if exists public.ai_usage_quotas alter column user_id set default auth.uid();
select public._relax_old_required_columns('ai_usage_quotas', array['user_id', 'tokens_used', 'period_start', 'updated_at']);
alter table if exists public.ai_request_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists provider_id text,
  add column if not exists success boolean default true,
  add column if not exists prompt text,
  add column if not exists request_data jsonb,
  add column if not exists response_data jsonb,
  add column if not exists response_time_ms integer,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('ai_request_logs', array['id', 'success', 'created_at']);
alter table if exists public.automation_workflows
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists status text default 'draft',
  add column if not exists tags text[] default '{}',
  add column if not exists "n8nUrl" text,
  add column if not exists "lastRun" timestamptz,
  add column if not exists "nextRun" timestamptz,
  add column if not exists "executionCount" integer default 0,
  add column if not exists "successRate" numeric default 0,
  add column if not exists "averageExecutionTime" numeric default 0,
  add column if not exists "createdAt" timestamptz,
  add column if not exists "updatedAt" timestamptz,
  add column if not exists trigger_conditions jsonb default '{}'::jsonb,
  add column if not exists actions jsonb default '[]'::jsonb,
  add column if not exists is_active boolean default true,
  add column if not exists metrics jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.automation_workflows alter column user_id set default auth.uid();
select public._relax_old_required_columns('automation_workflows', array['id', 'user_id', 'name', 'status', 'tags', '"executionCount"', '"successRate"', '"averageExecutionTime"', 'trigger_conditions', 'actions', 'is_active', 'metrics', 'created_at', 'updated_at']);
alter table if exists public.workflow_executions
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists execution_id uuid,
  add column if not exists workflow_id uuid,
  add column if not exists user_id uuid,
  add column if not exists status text,
  add column if not exists results jsonb,
  add column if not exists error text,
  add column if not exists execution_time integer,
  add column if not exists steps_completed integer,
  add column if not exists total_steps integer,
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('workflow_executions', array['id', 'execution_id', 'status', 'created_at']);
alter table if exists public.notification_templates
  add column if not exists id text,
  add column if not exists subject text,
  add column if not exists body text,
  add column if not exists channel text default 'email',
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('notification_templates', array['id', 'body', 'channel', 'created_at']);
alter table if exists public.marketing_funnels
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists stages jsonb default '[]'::jsonb,
  add column if not exists metrics jsonb default '{}'::jsonb,
  add column if not exists settings jsonb default '{}'::jsonb,
  add column if not exists conversions integer default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
alter table if exists public.marketing_funnels alter column user_id set default auth.uid();
select public._relax_old_required_columns('marketing_funnels', array['id', 'user_id', 'name', 'stages', 'metrics', 'settings', 'conversions', 'created_at', 'updated_at']);
alter table if exists public.integration_settings
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists integration_type text,
  add column if not exists url text,
  add column if not exists webhook_url text,
  add column if not exists api_key text,
  add column if not exists settings jsonb default '{}'::jsonb,
  add column if not exists is_active boolean default true,
  add column if not exists connected_at timestamptz,
  add column if not exists updated_at timestamptz default now();
alter table if exists public.integration_settings alter column user_id set default auth.uid();
select public._relax_old_required_columns('integration_settings', array['user_id', 'integration_type', 'settings', 'is_active', 'updated_at']);
alter table if exists public.app_settings
  add column if not exists key text,
  add column if not exists value jsonb,
  add column if not exists category text default 'general',
  add column if not exists data_type text default 'string',
  add column if not exists description text,
  add column if not exists updated_by uuid,
  add column if not exists updated_at timestamptz default now();
select public._relax_old_required_columns('app_settings', array['key', 'category', 'data_type', 'updated_at']);
alter table if exists public.ai_service_config
  add column if not exists service_name text,
  add column if not exists is_active boolean default true,
  add column if not exists api_key text,
  add column if not exists updated_at timestamptz default now();
select public._relax_old_required_columns('ai_service_config', array['service_name', 'is_active', 'updated_at']);
alter table if exists public.analytics_events
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists event_type text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists timestamp timestamptz default now();
alter table if exists public.analytics_events alter column user_id set default auth.uid();
select public._relax_old_required_columns('analytics_events', array['id', 'event_type', 'metadata', 'timestamp']);
alter table if exists public.analytics_insights
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists impact text,
  add column if not exists confidence numeric,
  add column if not exists action_items jsonb default '[]'::jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.analytics_insights alter column user_id set default auth.uid();
select public._relax_old_required_columns('analytics_insights', array['id', 'title', 'action_items', 'created_at']);
alter table if exists public.error_recovery_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists component text,
  add column if not exists error_message text,
  add column if not exists stack_trace text,
  add column if not exists recovery_strategy text,
  add column if not exists user_agent text,
  add column if not exists timestamp timestamptz default now();
alter table if exists public.error_recovery_logs alter column user_id set default auth.uid();
select public._relax_old_required_columns('error_recovery_logs', array['id', 'timestamp']);
alter table if exists public.system_optimization_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists component text,
  add column if not exists status text,
  add column if not exists error text,
  add column if not exists recommendations jsonb,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.system_optimization_logs alter column user_id set default auth.uid();
select public._relax_old_required_columns('system_optimization_logs', array['id', 'created_at']);
alter table if exists public.system_health_metrics
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists metric_name text,
  add column if not exists metric_value numeric,
  add column if not exists ts timestamptz default now(),
  add column if not exists database_health numeric,
  add column if not exists ai_service_health numeric,
  add column if not exists performance_health numeric,
  add column if not exists user_activity_health numeric,
  add column if not exists active_users integer,
  add column if not exists total_activities integer,
  add column if not exists total_requests integer,
  add column if not exists success_rate numeric,
  add column if not exists avg_response_time numeric,
  add column if not exists connections integer,
  add column if not exists size bigint,
  add column if not exists tables integer,
  add column if not exists metadata jsonb default '{}'::jsonb;
select public._relax_old_required_columns('system_health_metrics', array['id', 'ts', 'metadata']);
alter table if exists public.security_alerts
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists anomaly_score numeric,
  add column if not exists metrics jsonb,
  add column if not exists timestamp timestamptz default now(),
  add column if not exists resolved boolean default false,
  add column if not exists resolution_notes text,
  add column if not exists resolved_at timestamptz;
select public._relax_old_required_columns('security_alerts', array['id', 'anomaly_score', 'metrics', 'timestamp', 'resolved']);
alter table if exists public.user_activity_log
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists activity_type text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
alter table if exists public.user_activity_log alter column user_id set default auth.uid();
select public._relax_old_required_columns('user_activity_log', array['id', 'activity_type', 'metadata', 'created_at']);
alter table if exists public.function_logs
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists function_name text,
  add column if not exists status text,
  add column if not exists execution_time integer,
  add column if not exists error text,
  add column if not exists created_at timestamptz default now();
select public._relax_old_required_columns('function_logs', array['id', 'function_name', 'status', 'created_at']);
alter table if exists public.performance_metrics
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists metric_name text,
  add column if not exists metric_value numeric,
  add column if not exists timestamp timestamptz default now();
select public._relax_old_required_columns('performance_metrics', array['id', 'metric_name', 'metric_value', 'timestamp']);
alter table if exists public.health_check
  add column if not exists id integer default 1,
  add column if not exists count integer default 0,
  add column if not exists checked_at timestamptz default now();
select public._relax_old_required_columns('health_check', array['id', 'count', 'checked_at']);
alter table if exists public.contact_requests
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists requirements text,
  add column if not exists plan text,
  add column if not exists source text default 'app',
  add column if not exists status text default 'new',
  add column if not exists created_at timestamptz default now();
alter table if exists public.contact_requests alter column user_id set default auth.uid();
select public._relax_old_required_columns('contact_requests', array['id', 'name', 'email', 'source', 'status', 'created_at']);
alter table if exists public.billing_events
  add column if not exists id text,
  add column if not exists provider text,
  add column if not exists type text,
  add column if not exists received_at timestamptz default now();
select public._relax_old_required_columns('billing_events', array['id', 'provider', 'type', 'received_at']);
alter table if exists public.manual_payments
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists method text default 'etransfer',
  add column if not exists plan text,
  add column if not exists amount_cents integer,
  add column if not exists currency text default 'CAD',
  add column if not exists reference_code text,
  add column if not exists status text default 'pending',
  add column if not exists payer_note text,
  add column if not exists admin_note text,
  add column if not exists confirmed_by uuid,
  add column if not exists confirmed_at timestamptz,
  add column if not exists created_at timestamptz default now();
alter table if exists public.manual_payments alter column user_id set default auth.uid();
select public._relax_old_required_columns('manual_payments', array['id', 'user_id', 'method', 'plan', 'amount_cents', 'currency', 'reference_code', 'status', 'created_at']);
alter table if exists public.voice_profiles
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid default auth.uid(),
  add column if not exists name text,
  add column if not exists relationship text,
  add column if not exists sample_path text,
  add column if not exists provider text default 'elevenlabs',
  add column if not exists provider_voice_id text,
  add column if not exists consent_statement text,
  add column if not exists consent_at timestamptz default now(),
  add column if not exists created_at timestamptz default now();
alter table if exists public.voice_profiles alter column user_id set default auth.uid();
select public._relax_old_required_columns('voice_profiles', array['id', 'user_id', 'name', 'sample_path', 'provider', 'consent_statement', 'consent_at', 'created_at']);

drop function public._relax_old_required_columns(text, text[]);
