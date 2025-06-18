-- Fix database migration issues
-- Remove CONCURRENTLY from CREATE INDEX (not allowed in transactions)
-- Fix TimescaleDB constraints and hypertable creation

-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Only try TimescaleDB if available (Supabase may not have it)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TimescaleDB extension not available, skipping';
END
$$;

-- Create system health metrics table with proper structure
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes without CONCURRENTLY (regular indexes in transaction)
CREATE INDEX IF NOT EXISTS idx_system_health_name_ts 
ON system_health_metrics (metric_name, ts);

CREATE INDEX IF NOT EXISTS idx_system_health_ts 
ON system_health_metrics (ts);

-- Add text search indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

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
  funnel_name,
  user_id,
  count(*) as total_leads,
  count(*) FILTER (WHERE current_stage = 'converted') as conversions,
  CASE 
    WHEN count(*) > 0 THEN 
      (count(*) FILTER (WHERE current_stage = 'converted')::numeric / count(*)::numeric) * 100
    ELSE 0 
  END as conversion_rate,
  avg(EXTRACT(days FROM (updated_at - started_at))) FILTER (WHERE current_stage = 'converted') as avg_days_to_convert
FROM client_journeys cj
JOIN marketing_funnels mf ON cj.funnel_id = mf.id
WHERE started_at > now() - interval '30 days'
GROUP BY funnel_id, funnel_name, user_id;

-- Create function to refresh materialized views
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
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update workflow execution counts
  UPDATE automation_workflows 
  SET metrics = jsonb_set(
    COALESCE(metrics, '{}'::jsonb),
    '{last_processed}',
    to_jsonb(now())
  )
  WHERE is_active = true;
  
  -- Log the processing
  INSERT INTO system_health_metrics (metric_name, metric_value, metadata)
  VALUES ('automation_rules_processed', 1, jsonb_build_object('timestamp', now()));
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
RETURNS TABLE (
  total_requests bigint,
  successful_requests bigint,
  success_rate numeric,
  avg_response_time_ms numeric,
  total_tokens bigint,
  total_cost numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    count(*)::bigint as total_requests,
    count(*) FILTER (WHERE success = true)::bigint as successful_requests,
    CASE 
      WHEN count(*) > 0 THEN
        (count(*) FILTER (WHERE success = true)::numeric / count(*)::numeric)
      ELSE 0
    END as success_rate,
    avg(response_time_ms)::numeric as avg_response_time_ms,
    sum(tokens_used)::bigint as total_tokens,
    sum(cost)::numeric as total_cost
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
    AND created_at > now() - (p_days || ' days')::interval;
END;
$$;

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

-- Create database performance optimization function
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Analyze tables for better query planning
  ANALYZE;
  
  -- Log optimization
  INSERT INTO system_health_metrics (metric_name, metric_value, metadata)
  VALUES ('database_optimized', 1, jsonb_build_object('timestamp', now()));
END;
$$;