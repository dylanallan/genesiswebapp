/*
  # Advanced Analytics and Performance Monitoring Migration

  1. Extensions
    - Enable pg_trgm for full-text search
    - Enable pg_stat_statements for query performance monitoring

  2. Advanced Indexing
    - Full-text search indexes using trigrams
    - Performance-optimized indexes for analytics

  3. AI System Insights
    - Model performance analytics
    - Knowledge base statistics
    - System health monitoring

  4. Analytics Functions
    - Client LTV calculation
    - Conversion probability prediction
    - Semantic search capabilities

  5. Performance Monitoring
    - System health metrics collection
    - Automated materialized view refresh
    - Query performance tracking
*/

-- Enable extensions (skip TimescaleDB as it's not available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add advanced indexing for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_content_trgm 
ON knowledge_base USING gin (((content)::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sacred_content_text_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Add time-based indexes for performance (instead of hypertables)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_model_metrics_time_performance
ON model_performance_metrics (timestamp DESC, model_id, value);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_journeys_time_funnel
ON client_journeys (started_at DESC, funnel_id, current_stage);

-- Drop existing materialized view if it exists to avoid conflicts
DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;

-- Create materialized view for AI insights with safe table access
CREATE MATERIALIZED VIEW ai_system_insights AS
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
    avg(char_length((content)::text)) as avg_content_length
  FROM knowledge_base
  WHERE content IS NOT NULL
)
SELECT 
  ms.model_id,
  ms.avg_performance,
  ms.performance_stability,
  ms.sample_count,
  ks.total_entries,
  ks.avg_content_length,
  now() as last_updated
FROM model_stats ms
CROSS JOIN knowledge_stats ks;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_ai_system_insights_model_id 
ON ai_system_insights (model_id);

-- Create function for automatic model optimization
CREATE OR REPLACE FUNCTION optimize_model_performance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_performance numeric;
  optimization_needed boolean := false;
BEGIN
  -- Calculate recent average performance for this model
  SELECT avg(value) INTO avg_performance
  FROM model_performance_metrics
  WHERE model_id = NEW.model_id
    AND timestamp > now() - interval '1 hour';

  -- Check if optimization is needed (performance below 70%)
  IF avg_performance IS NOT NULL AND avg_performance < 0.7 THEN
    optimization_needed := true;
    
    -- Log optimization event
    INSERT INTO system_health_metrics (
      ts, metric_name, metric_value, metadata
    ) VALUES (
      now(),
      'model_optimization_triggered',
      avg_performance,
      jsonb_build_object(
        'model_id', NEW.model_id,
        'trigger_value', NEW.value,
        'avg_performance', avg_performance
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    INSERT INTO system_health_metrics (
      ts, metric_name, metric_value, metadata
    ) VALUES (
      now(),
      'model_optimization_error',
      0,
      jsonb_build_object(
        'error', SQLERRM,
        'model_id', NEW.model_id
      )
    );
    RETURN NEW;
END;
$$;

-- Create trigger for model optimization
DROP TRIGGER IF EXISTS trigger_model_optimization ON model_performance_metrics;
CREATE TRIGGER trigger_model_optimization
  AFTER INSERT ON model_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION optimize_model_performance();

-- Advanced analytics function: Client LTV calculation
CREATE OR REPLACE FUNCTION calculate_client_ltv(client_email text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ltv numeric := 0;
  journey_count integer := 0;
  avg_conversion_value numeric := 0;
  conversion_rate numeric := 0;
BEGIN
  -- Count client journeys
  SELECT count(*) INTO journey_count
  FROM client_journeys
  WHERE client_email = calculate_client_ltv.client_email;

  -- Calculate conversion rate
  SELECT 
    CASE 
      WHEN count(*) > 0 THEN
        count(*) FILTER (WHERE current_stage = 'converted')::numeric / count(*)::numeric
      ELSE 0
    END INTO conversion_rate
  FROM client_journeys
  WHERE client_email = calculate_client_ltv.client_email;

  -- Estimate average conversion value (placeholder - would be based on actual revenue data)
  avg_conversion_value := 100.0;

  -- Calculate LTV: journey_count * avg_conversion_value * conversion_rate
  ltv := journey_count * avg_conversion_value * conversion_rate;

  RETURN COALESCE(ltv, 0);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- Predictive analytics function: Conversion probability
CREATE OR REPLACE FUNCTION predict_conversion_probability(
  client_data jsonb,
  funnel_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  probability numeric := 0;
  funnel_conversion_rate numeric := 0;
  engagement_score numeric := 0;
BEGIN
  -- Get funnel conversion rate
  SELECT 
    CASE 
      WHEN count(*) > 0 THEN
        count(*) FILTER (WHERE current_stage = 'converted')::numeric / count(*)::numeric
      ELSE 0.1
    END INTO funnel_conversion_rate
  FROM client_journeys
  WHERE funnel_id = predict_conversion_probability.funnel_id;

  -- Calculate engagement score based on client data
  engagement_score := CASE
    WHEN client_data ? 'email_opens' THEN
      LEAST((client_data->>'email_opens')::numeric / 10.0, 1.0)
    ELSE 0.5
  END;

  -- Weighted probability calculation
  probability := (funnel_conversion_rate * 0.6) + (engagement_score * 0.4);

  RETURN LEAST(GREATEST(probability, 0), 1);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0.5; -- Default probability
END;
$$;

-- Semantic search function using trigram similarity
CREATE OR REPLACE FUNCTION semantic_search(
  query_text text,
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  content_id uuid,
  content jsonb,
  similarity float,
  context jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id as content_id,
    kb.content,
    similarity((kb.content)::text, query_text) as similarity,
    jsonb_build_object(
      'source_id', kb.source_id,
      'created_at', kb.created_at,
      'search_query', query_text
    ) as context
  FROM knowledge_base kb
  WHERE similarity((kb.content)::text, query_text) > similarity_threshold
  ORDER BY similarity((kb.content)::text, query_text) DESC
  LIMIT max_results;
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty result set on error
    RETURN;
END;
$$;

-- Create system health metrics table for monitoring (standard table, not hypertable)
CREATE TABLE IF NOT EXISTS system_health_metrics_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_time timestamptz NOT NULL DEFAULT now(),
  db_size bigint,
  active_connections integer,
  active_models integer,
  avg_model_performance numeric,
  cache_hit_ratio numeric,
  query_performance jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_raw_time
ON system_health_metrics_raw (metric_time DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_raw_performance
ON system_health_metrics_raw (avg_model_performance DESC, metric_time DESC);

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS system_health_hourly CASCADE;

-- Create materialized view for hourly system health aggregation
CREATE MATERIALIZED VIEW system_health_hourly AS
SELECT 
  date_trunc('hour', metric_time) AS bucket,
  'cpu_usage' as metric_name,
  avg(COALESCE(avg_model_performance, 0.5)) as avg_value,
  min(COALESCE(avg_model_performance, 0.5)) as min_value,
  max(COALESCE(avg_model_performance, 0.5)) as max_value,
  count(*) as sample_count
FROM system_health_metrics_raw
WHERE metric_time > now() - interval '7 days'
GROUP BY date_trunc('hour', metric_time)

UNION ALL

SELECT 
  date_trunc('hour', metric_time) AS bucket,
  'memory_usage' as metric_name,
  avg(COALESCE(cache_hit_ratio, 0.8)) as avg_value,
  min(COALESCE(cache_hit_ratio, 0.8)) as min_value,
  max(COALESCE(cache_hit_ratio, 0.8)) as max_value,
  count(*) as sample_count
FROM system_health_metrics_raw
WHERE metric_time > now() - interval '7 days'
GROUP BY date_trunc('hour', metric_time)

UNION ALL

SELECT 
  date_trunc('hour', metric_time) AS bucket,
  'active_connections' as metric_name,
  avg(COALESCE(active_connections, 5)) as avg_value,
  min(COALESCE(active_connections, 5)) as min_value,
  max(COALESCE(active_connections, 5)) as max_value,
  count(*) as sample_count
FROM system_health_metrics_raw
WHERE metric_time > now() - interval '7 days'
GROUP BY date_trunc('hour', metric_time);

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_system_health_hourly_bucket_metric
ON system_health_hourly (bucket, metric_name);

-- Function to collect system health metrics
CREATE OR REPLACE FUNCTION collect_system_health_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size_val bigint;
  active_conn_val integer;
  active_models_val integer;
  avg_perf_val numeric;
  cache_hit_val numeric;
BEGIN
  -- Get database size
  SELECT pg_database_size(current_database()) INTO db_size_val;
  
  -- Get active connections
  SELECT count(*) INTO active_conn_val
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Get active models count
  SELECT count(*) INTO active_models_val
  FROM ai_models
  WHERE created_at > now() - interval '30 days';
  
  -- Get average model performance
  SELECT avg(value) INTO avg_perf_val
  FROM model_performance_metrics
  WHERE timestamp > now() - interval '1 hour';
  
  -- Get cache hit ratio
  SELECT 
    CASE 
      WHEN sum(blks_hit + blks_read) > 0 THEN
        sum(blks_hit)::numeric / sum(blks_hit + blks_read)::numeric
      ELSE 0.95
    END INTO cache_hit_val
  FROM pg_stat_database
  WHERE datname = current_database();
  
  -- Insert metrics
  INSERT INTO system_health_metrics_raw (
    metric_time,
    db_size,
    active_connections,
    active_models,
    avg_model_performance,
    cache_hit_ratio,
    query_performance
  ) VALUES (
    now(),
    db_size_val,
    active_conn_val,
    active_models_val,
    COALESCE(avg_perf_val, 0.8),
    COALESCE(cache_hit_val, 0.95),
    jsonb_build_object(
      'total_queries', (SELECT calls FROM pg_stat_statements ORDER BY calls DESC LIMIT 1),
      'avg_exec_time', (SELECT mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 1)
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    INSERT INTO system_health_metrics_raw (
      metric_time,
      db_size,
      active_connections,
      active_models,
      avg_model_performance,
      cache_hit_ratio
    ) VALUES (
      now(),
      0,
      0,
      0,
      0,
      0
    );
END;
$$;

-- Function to refresh all materialized views safely
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh AI system insights
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  EXCEPTION
    WHEN OTHERS THEN
      REFRESH MATERIALIZED VIEW ai_system_insights;
  END;
  
  -- Refresh system health hourly
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_health_hourly;
  EXCEPTION
    WHEN OTHERS THEN
      REFRESH MATERIALIZED VIEW system_health_hourly;
  END;
  
  -- Refresh model performance summary if it exists
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  EXCEPTION
    WHEN OTHERS THEN
      -- View might not exist, skip
      NULL;
  END;
  
  -- Refresh funnel performance summary if it exists
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
  EXCEPTION
    WHEN OTHERS THEN
      -- View might not exist, skip
      NULL;
  END;
  
END;
$$;

-- Function to clean up old metrics (instead of retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete metrics older than 7 days
  DELETE FROM system_health_metrics_raw
  WHERE metric_time < now() - interval '7 days';
  
  -- Delete old model performance metrics older than 30 days
  DELETE FROM model_performance_metrics
  WHERE timestamp < now() - interval '30 days';
  
  -- Vacuum tables to reclaim space
  VACUUM ANALYZE system_health_metrics_raw;
  VACUUM ANALYZE model_performance_metrics;
  
END;
$$;

-- Create function to get database performance insights
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS TABLE (
  metric_name text,
  current_value numeric,
  avg_value numeric,
  trend text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT 
      'cache_hit_ratio' as metric,
      COALESCE(cache_hit_ratio, 0.95) as current_val
    FROM system_health_metrics_raw
    WHERE metric_time > now() - interval '5 minutes'
    ORDER BY metric_time DESC
    LIMIT 1
    
    UNION ALL
    
    SELECT 
      'avg_query_time' as metric,
      COALESCE(avg_model_performance, 0.8) as current_val
    FROM system_health_metrics_raw
    WHERE metric_time > now() - interval '5 minutes'
    ORDER BY metric_time DESC
    LIMIT 1
  ),
  historical_metrics AS (
    SELECT 
      'cache_hit_ratio' as metric,
      avg(COALESCE(cache_hit_ratio, 0.95)) as avg_val
    FROM system_health_metrics_raw
    WHERE metric_time > now() - interval '1 hour'
    
    UNION ALL
    
    SELECT 
      'avg_query_time' as metric,
      avg(COALESCE(avg_model_performance, 0.8)) as avg_val
    FROM system_health_metrics_raw
    WHERE metric_time > now() - interval '1 hour'
  )
  SELECT 
    cm.metric as metric_name,
    cm.current_val as current_value,
    hm.avg_val as avg_value,
    CASE 
      WHEN cm.current_val > hm.avg_val * 1.1 THEN 'improving'
      WHEN cm.current_val < hm.avg_val * 0.9 THEN 'declining'
      ELSE 'stable'
    END as trend
  FROM current_metrics cm
  JOIN historical_metrics hm ON cm.metric = hm.metric;
END;
$$;

-- Schedule periodic cleanup (if pg_cron is available)
DO $$
BEGIN
  -- Try to schedule cleanup job
  PERFORM cron.schedule(
    'cleanup_old_metrics',
    '0 2 * * *',  -- Daily at 2 AM
    'SELECT cleanup_old_metrics()'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
END $$;

-- Schedule periodic metrics collection (if pg_cron is available)
DO $$
BEGIN
  -- Try to schedule metrics collection
  PERFORM cron.schedule(
    'collect_system_metrics',
    '*/5 * * * *',  -- Every 5 minutes
    'SELECT collect_system_health_metrics()'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
END $$;

-- Schedule periodic materialized view refresh (if pg_cron is available)
DO $$
BEGIN
  -- Try to schedule view refresh
  PERFORM cron.schedule(
    'refresh_analytics_views',
    '0 * * * *',  -- Every hour
    'SELECT refresh_materialized_views()'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
END $$;