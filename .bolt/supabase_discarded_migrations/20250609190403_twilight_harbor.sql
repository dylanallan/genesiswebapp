/*
  # Fix Database Structure and Migrations

  1. New Tables
    - `error_recovery_logs` - Tracks system error recovery attempts
    - `system_optimizations` - Records system optimization operations
    - `ai_provider_metrics` - Stores metrics for AI providers
    - `user_preferences_enhanced` - Enhanced user preferences with theme settings

  2. Functions
    - Added `update_user_preferences` - Securely updates user preferences
    - Added `get_ai_provider_metrics` - Retrieves AI provider performance data
    - Added `refresh_analytics_views` - Refreshes all materialized views
    - Added `process_automation_rules` - Processes automation workflows
    - Added `log_ai_request` - Logs AI request metrics

  3. Views
    - Added `ai_provider_performance` - Summarizes AI provider performance
    - Added `system_health_hourly` - Aggregates system health metrics by hour
    - Added `model_performance_summary` - Summarizes model performance
    - Added `funnel_performance_summary` - Summarizes marketing funnel performance

  4. Indexes
    - Added indexes for system health metrics
    - Added indexes for AI request logs
    - Added text search indexes for knowledge base and content
*/

-- Enable extensions first (these are safe in transactions)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Try to enable TimescaleDB if available (Supabase may not have it)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB extension not available, skipping';
END
$$;

-- Create error recovery logs table
CREATE TABLE IF NOT EXISTS public.error_recovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  recovery_strategy text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  successful boolean DEFAULT false
);

-- Enable RLS on error_recovery_logs
ALTER TABLE public.error_recovery_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for error_recovery_logs
CREATE POLICY "Admins can manage error recovery logs" 
  ON public.error_recovery_logs
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

-- Create system optimizations table
CREATE TABLE IF NOT EXISTS public.system_optimizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id text NOT NULL,
  component_name text NOT NULL,
  optimization_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  performance_before numeric,
  performance_after numeric,
  optimization_details jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_optimizations
ALTER TABLE public.system_optimizations ENABLE ROW LEVEL SECURITY;

-- Create policy for system_optimizations
CREATE POLICY "Admins can manage system optimizations" 
  ON public.system_optimizations
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

-- Create AI provider metrics table
CREATE TABLE IF NOT EXISTS public.ai_provider_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  total_requests integer NOT NULL DEFAULT 0,
  successful_requests integer NOT NULL DEFAULT 0,
  failed_requests integer NOT NULL DEFAULT 0,
  avg_response_time_ms numeric NOT NULL DEFAULT 0,
  avg_tokens_used numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on ai_provider_metrics
ALTER TABLE public.ai_provider_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_provider_metrics
CREATE POLICY "Admins can manage AI provider metrics" 
  ON public.ai_provider_metrics
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

-- Create enhanced user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences_enhanced (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'light',
  color_scheme jsonb NOT NULL DEFAULT '{
    "primary": "#ffffff",
    "secondary": "#f1f5f9",
    "accent": "#3b82f6",
    "background": "#f8fafc",
    "text": "#1e293b",
    "border": "#e2e8f0"
  }'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{
    "email": true,
    "push": true,
    "marketing": false,
    "system": true
  }'::jsonb,
  ai_preferences jsonb NOT NULL DEFAULT '{
    "preferred_model": "auto",
    "response_length": "balanced",
    "creativity": "balanced",
    "save_history": true
  }'::jsonb,
  heritage_preferences jsonb NOT NULL DEFAULT '{
    "ancestry": [],
    "cultural_interests": [],
    "family_history_privacy": "private"
  }'::jsonb,
  business_preferences jsonb NOT NULL DEFAULT '{
    "industry": null,
    "company_size": null,
    "automation_goals": []
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences_enhanced
ALTER TABLE public.user_preferences_enhanced ENABLE ROW LEVEL SECURITY;

-- Create policy for user_preferences_enhanced
CREATE POLICY "Users can manage their own preferences" 
  ON public.user_preferences_enhanced
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create system health metrics table with proper structure
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_name_ts 
ON system_health_metrics (metric_name, ts);

CREATE INDEX IF NOT EXISTS idx_system_health_ts 
ON system_health_metrics (ts);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Create index on ai_request_logs for better performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_created
ON ai_request_logs (provider_id, created_at);

-- Create materialized view for AI system insights
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_system_insights AS
WITH model_stats AS (
  SELECT 
    model_id,
    avg(value) as avg_performance,
    stddev(value) as performance_stability,
    count(*) as sample_count
  FROM model_performance_metrics
  WHERE timestamp > now() - interval '30 days'
  GROUP BY model_id
),
knowledge_stats AS (
  SELECT 
    count(*) as total_entries,
    avg(array_length(regexp_split_to_array(content::text, '\s+'), 1)) as avg_content_length
  FROM knowledge_base
)
SELECT 
  ms.*,
  ks.*,
  now() as last_updated
FROM model_stats ms
CROSS JOIN knowledge_stats ks;

-- Create materialized view for AI provider performance
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_provider_performance AS
SELECT
  provider_id,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  ROUND((COUNT(*) FILTER (WHERE success = true))::numeric / NULLIF(COUNT(*), 0) * 100, 2) as success_rate,
  ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
  ROUND(AVG(tokens_used), 2) as avg_tokens_used,
  SUM(cost) as total_cost,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM
  ai_request_logs
WHERE
  created_at >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY
  provider_id;

-- Create hourly aggregation view
CREATE MATERIALIZED VIEW IF NOT EXISTS system_health_hourly AS
SELECT
  date_trunc('hour', ts) AS bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
GROUP BY bucket, metric_name;

-- Create model performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS model_performance_summary AS
SELECT
  model_id,
  metric_type,
  avg(value) as avg_value,
  count(*) as sample_count,
  max(timestamp) as last_updated
FROM model_performance_metrics
WHERE timestamp > now() - interval '7 days'
GROUP BY model_id, metric_type;

-- Create funnel performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_performance_summary AS
SELECT
  funnel_id,
  name as funnel_name,
  user_id,
  count(*) as total_leads,
  count(*) FILTER (WHERE cj.current_stage = 'converted') as conversions,
  CASE 
    WHEN count(*) > 0 THEN 
      (count(*) FILTER (WHERE cj.current_stage = 'converted')::numeric / count(*)::numeric) * 100
    ELSE 0 
  END as conversion_rate,
  EXTRACT(epoch FROM avg(cj.updated_at - cj.started_at) FILTER (WHERE cj.current_stage = 'converted'))::integer / 86400 as avg_days_to_convert
FROM client_journeys cj
JOIN marketing_funnels mf ON cj.funnel_id = mf.id
WHERE cj.started_at > now() - interval '30 days'
GROUP BY funnel_id, mf.name, user_id;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on user_preferences_enhanced
CREATE TRIGGER update_user_preferences_enhanced_updated_at
BEFORE UPDATE ON user_preferences_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user preferences securely
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_theme text DEFAULT NULL,
  p_color_scheme jsonb DEFAULT NULL,
  p_notifications jsonb DEFAULT NULL,
  p_ai_preferences jsonb DEFAULT NULL,
  p_heritage_preferences jsonb DEFAULT NULL,
  p_business_preferences jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get the user ID from the JWT
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert or update user preferences
  INSERT INTO public.user_preferences_enhanced (
    user_id,
    theme,
    color_scheme,
    notifications,
    ai_preferences,
    heritage_preferences,
    business_preferences,
    updated_at
  )
  VALUES (
    v_user_id,
    COALESCE(p_theme, 'light'),
    COALESCE(p_color_scheme, '{
      "primary": "#ffffff",
      "secondary": "#f1f5f9",
      "accent": "#3b82f6",
      "background": "#f8fafc",
      "text": "#1e293b",
      "border": "#e2e8f0"
    }'::jsonb),
    COALESCE(p_notifications, '{
      "email": true,
      "push": true,
      "marketing": false,
      "system": true
    }'::jsonb),
    COALESCE(p_ai_preferences, '{
      "preferred_model": "auto",
      "response_length": "balanced",
      "creativity": "balanced",
      "save_history": true
    }'::jsonb),
    COALESCE(p_heritage_preferences, '{
      "ancestry": [],
      "cultural_interests": [],
      "family_history_privacy": "private"
    }'::jsonb),
    COALESCE(p_business_preferences, '{
      "industry": null,
      "company_size": null,
      "automation_goals": []
    }'::jsonb),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    theme = COALESCE(p_theme, user_preferences_enhanced.theme),
    color_scheme = COALESCE(p_color_scheme, user_preferences_enhanced.color_scheme),
    notifications = COALESCE(p_notifications, user_preferences_enhanced.notifications),
    ai_preferences = COALESCE(p_ai_preferences, user_preferences_enhanced.ai_preferences),
    heritage_preferences = COALESCE(p_heritage_preferences, user_preferences_enhanced.heritage_preferences),
    business_preferences = COALESCE(p_business_preferences, user_preferences_enhanced.business_preferences),
    updated_at = now()
  RETURNING jsonb_build_object(
    'theme', theme,
    'color_scheme', color_scheme,
    'notifications', notifications,
    'ai_preferences', ai_preferences,
    'heritage_preferences', heritage_preferences,
    'business_preferences', business_preferences,
    'updated_at', updated_at
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to refresh AI provider performance view
CREATE OR REPLACE FUNCTION refresh_ai_provider_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ai_provider_performance;
END;
$$;

-- Create function to refresh analytics views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ai_system_insights;
  REFRESH MATERIALIZED VIEW system_health_hourly;
  REFRESH MATERIALIZED VIEW model_performance_summary;
  REFRESH MATERIALIZED VIEW funnel_performance_summary;
END;
$$;

-- Create function for database performance optimization
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS TABLE (
  avg_query_time numeric,
  cache_hit_ratio numeric,
  active_connections integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(avg(total_time), 0)::numeric as avg_query_time,
    CASE 
      WHEN sum(blks_hit + blks_read) > 0 THEN
        (sum(blks_hit)::numeric / sum(blks_hit + blks_read)::numeric) * 100
      ELSE 100
    END as cache_hit_ratio,
    (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'active') as active_connections
  FROM pg_stat_statements pss
  JOIN pg_stat_database psd ON psd.datname = current_database();
END;
$$;

-- Create function to process automation rules
CREATE OR REPLACE FUNCTION process_automation_rules()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed integer := 0;
  v_rule record;
  v_trigger_met boolean;
BEGIN
  FOR v_rule IN 
    SELECT * FROM automation_workflows 
    WHERE is_active = true
    ORDER BY created_at
  LOOP
    -- Check if trigger conditions are met
    v_trigger_met := false;
    
    -- Simple implementation - in production this would be more complex
    IF v_rule.trigger_conditions->>'type' = 'schedule' THEN
      -- Check if it's time to run based on schedule
      IF (v_rule.trigger_conditions->>'last_run')::timestamptz IS NULL OR
         (v_rule.trigger_conditions->>'last_run')::timestamptz < (now() - (v_rule.trigger_conditions->>'interval')::interval) THEN
        v_trigger_met := true;
      END IF;
    ELSIF v_rule.trigger_conditions->>'type' = 'event' THEN
      -- Check if the event has occurred
      IF EXISTS (
        SELECT 1 FROM user_activity_log
        WHERE activity_type = v_rule.trigger_conditions->>'event_type'
        AND created_at > COALESCE((v_rule.trigger_conditions->>'last_checked')::timestamptz, '1970-01-01'::timestamptz)
      ) THEN
        v_trigger_met := true;
      END IF;
    END IF;
    
    -- If trigger conditions are met, execute actions
    IF v_trigger_met THEN
      -- Update the workflow with execution information
      UPDATE automation_workflows
      SET 
        metrics = jsonb_set(
          COALESCE(metrics, '{}'::jsonb),
          '{triggered}',
          to_jsonb(COALESCE((metrics->>'triggered')::integer, 0)::integer + 1)
        ),
        updated_at = now()
      WHERE id = v_rule.id;
      
      -- In a real implementation, we would execute the actions here
      -- For now, we just count it as processed
      v_processed := v_processed + 1;
    END IF;
  END LOOP;
  
  RETURN v_processed;
END;
$$;

-- Create function to optimize database performance
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Analyze tables to update statistics
  ANALYZE ai_request_logs;
  ANALYZE user_activity_log;
  ANALYZE system_health_metrics;
  ANALYZE cultural_artifacts;
  ANALYZE automation_workflows;
  
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW ai_provider_performance;
  REFRESH MATERIALIZED VIEW system_health_hourly;
  REFRESH MATERIALIZED VIEW model_performance_summary;
  REFRESH MATERIALIZED VIEW funnel_performance_summary;
  
  -- Log optimization
  INSERT INTO system_health_metrics (metric_name, metric_value, metadata)
  VALUES ('database_optimized', 1, jsonb_build_object('timestamp', now()));
END;
$$;

-- Create function to update journey stage
CREATE OR REPLACE FUNCTION update_journey_stage(
  p_journey_id uuid,
  p_new_stage text,
  p_journey_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_journeys
  SET 
    current_stage = p_new_stage,
    journey_data = COALESCE(p_journey_data, journey_data),
    updated_at = now()
  WHERE id = p_journey_id;
END;
$$;

-- Create function to log AI requests
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text,
  p_prompt_length integer,
  p_response_length integer,
  p_tokens_used integer,
  p_cost numeric,
  p_response_time_ms integer,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_request_logs (
    user_id,
    provider_id,
    request_type,
    prompt_length,
    response_length,
    tokens_used,
    cost,
    response_time_ms,
    success,
    error_message,
    created_at
  ) VALUES (
    p_user_id,
    p_provider_id,
    p_request_type,
    p_prompt_length,
    p_response_length,
    p_tokens_used,
    p_cost,
    p_response_time_ms,
    p_success,
    p_error_message,
    now()
  );
END;
$$;

-- Create function to get AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH provider_metrics AS (
    SELECT
      provider_id,
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE success = true) as successful_requests,
      COUNT(*) FILTER (WHERE success = false) as failed_requests,
      COALESCE(AVG(response_time_ms), 0) as avg_response_time_ms,
      COALESCE(AVG(tokens_used), 0) as avg_tokens_used,
      COALESCE(SUM(cost), 0) as total_cost
    FROM
      ai_request_logs
    WHERE
      provider_id = p_provider_id
      AND created_at >= (CURRENT_DATE - (p_days || ' days')::interval)
    GROUP BY
      provider_id
  )
  SELECT
    jsonb_build_object(
      'provider_id', pm.provider_id,
      'total_requests', pm.total_requests,
      'successful_requests', pm.successful_requests,
      'failed_requests', pm.failed_requests,
      'success_rate', CASE WHEN pm.total_requests > 0 THEN pm.successful_requests::numeric / pm.total_requests ELSE 0 END,
      'avg_response_time_ms', pm.avg_response_time_ms,
      'avg_tokens_used', pm.avg_tokens_used,
      'total_cost', pm.total_cost,
      'time_period', p_days || ' days'
    )
  INTO v_result
  FROM provider_metrics pm;

  RETURN COALESCE(v_result, jsonb_build_object(
    'provider_id', p_provider_id,
    'total_requests', 0,
    'successful_requests', 0,
    'failed_requests', 0,
    'success_rate', 0,
    'avg_response_time_ms', 0,
    'avg_tokens_used', 0,
    'total_cost', 0,
    'time_period', p_days || ' days'
  ));
END;
$$;

-- Create function to update session
CREATE OR REPLACE FUNCTION update_session()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle user login
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_data
  INSERT INTO public.user_data (
    user_id,
    last_login,
    login_count,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    now(),
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_login = now(),
    login_count = user_data.login_count + 1,
    updated_at = now();
  
  -- Create user session
  INSERT INTO public.user_sessions (
    user_id,
    device_info,
    ip_address,
    last_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    '{}'::jsonb,
    NULL,
    now(),
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create analytics optimization function
CREATE OR REPLACE FUNCTION create_analytics_optimizations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert sample analytics data
  INSERT INTO system_health_metrics (metric_name, metric_value, metadata)
  VALUES 
    ('cpu_usage', random() * 100, '{"unit": "percent"}'),
    ('memory_usage', random() * 100, '{"unit": "percent"}'),
    ('disk_usage', random() * 100, '{"unit": "percent"}'),
    ('active_users', floor(random() * 1000), '{"unit": "count"}');
END;
$$;

-- Create trigger for user login if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_login();
  END IF;
END
$$;

-- Create trigger for session update if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_session_update'
  ) THEN
    CREATE TRIGGER on_session_update
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session();
  END IF;
END
$$;

-- Create trigger for user_preferences_enhanced if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_enhanced_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_enhanced_updated_at
    BEFORE UPDATE ON user_preferences_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Attempt to convert system_health_metrics to hypertable if TimescaleDB is available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
  ) THEN
    PERFORM create_hypertable('system_health_metrics', 'ts', 
      if_not_exists => TRUE,
      migrate_data => TRUE
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not convert system_health_metrics to hypertable: %', SQLERRM;
END
$$;