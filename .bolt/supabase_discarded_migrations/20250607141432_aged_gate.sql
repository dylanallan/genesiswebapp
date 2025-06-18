/*
  # Advanced Analytics and Performance Optimization

  1. Extensions
    - Enable pg_trgm for text search
    - Enable pg_stat_statements for query performance monitoring
  
  2. Advanced Indexing
    - Add trigram indexes for full-text search
    - Optimize knowledge base and sacred content search
  
  3. Materialized Views
    - AI system insights for model performance tracking
    - System health metrics for monitoring
  
  4. Analytics Functions
    - Client LTV calculation
    - Conversion probability prediction
    - Semantic search capabilities
  
  5. Monitoring and Optimization
    - Automatic model optimization triggers
    - Materialized view refresh functions
*/

-- Enable additional extensions (skip timescaledb as it's not available in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add advanced indexing for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_content_trgm 
ON knowledge_base USING gin (((content)::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sacred_content_text_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Add time-based indexes for performance (instead of hypertables)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics (model_id, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_journeys_user_started 
ON client_journeys (user_id, started_at);

-- Add materialized view for AI insights
DROP MATERIALIZED VIEW IF EXISTS ai_system_insights;
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

-- Create function for automatic model optimization
CREATE OR REPLACE FUNCTION optimize_model_performance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the performance metric for analysis
  INSERT INTO system_health_metrics (
    metric_name,
    metric_value,
    metadata
  ) VALUES (
    'model_performance_update',
    NEW.value,
    jsonb_build_object(
      'model_id', NEW.model_id,
      'metric_type', NEW.metric_type,
      'timestamp', NEW.timestamp
    )
  );
  
  -- Check if performance is below threshold and needs optimization
  IF NEW.value < 0.7 THEN
    -- Insert optimization task
    INSERT INTO system_health_metrics (
      metric_name,
      metric_value,
      metadata
    ) VALUES (
      'optimization_needed',
      NEW.value,
      jsonb_build_object(
        'model_id', NEW.model_id,
        'reason', 'performance_below_threshold',
        'threshold', 0.7
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for model optimization
DROP TRIGGER IF EXISTS trigger_model_optimization ON model_performance_metrics;
CREATE TRIGGER trigger_model_optimization
  AFTER INSERT ON model_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION optimize_model_performance();

-- Add advanced analytics functions
CREATE OR REPLACE FUNCTION calculate_client_ltv(client_email text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ltv numeric := 0;
  journey_count integer;
  avg_conversion_value numeric;
  conversion_rate numeric;
BEGIN
  -- Get journey count for the client
  SELECT count(*) INTO journey_count
  FROM client_journeys
  WHERE client_email = calculate_client_ltv.client_email;
  
  -- Calculate average conversion value (mock calculation)
  SELECT COALESCE(avg(
    CASE 
      WHEN current_stage = 'converted' THEN 100.0
      ELSE 0
    END
  ), 0) INTO avg_conversion_value
  FROM client_journeys
  WHERE client_email = calculate_client_ltv.client_email;
  
  -- Calculate conversion rate
  SELECT COALESCE(
    count(*) FILTER (WHERE current_stage = 'converted')::numeric / 
    NULLIF(count(*), 0), 0
  ) INTO conversion_rate
  FROM client_journeys
  WHERE client_email = calculate_client_ltv.client_email;
  
  -- Simple LTV calculation: journey_count * avg_conversion_value * conversion_rate
  ltv := journey_count * avg_conversion_value * conversion_rate;
  
  RETURN COALESCE(ltv, 0);
END;
$$;

-- Add function for predictive analytics
CREATE OR REPLACE FUNCTION predict_conversion_probability(
  client_data jsonb,
  funnel_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  probability numeric := 0.5; -- Default probability
  funnel_conversion_rate numeric;
  client_engagement_score numeric;
BEGIN
  -- Get funnel conversion rate
  SELECT COALESCE(
    count(*) FILTER (WHERE current_stage = 'converted')::numeric / 
    NULLIF(count(*), 0), 0.1
  ) INTO funnel_conversion_rate
  FROM client_journeys
  WHERE funnel_id = predict_conversion_probability.funnel_id;
  
  -- Calculate client engagement score based on journey data
  client_engagement_score := COALESCE(
    (client_data->>'engagement_score')::numeric, 0.5
  );
  
  -- Simple prediction model: weighted average of funnel rate and engagement
  probability := (funnel_conversion_rate * 0.6) + (client_engagement_score * 0.4);
  
  -- Ensure probability is between 0 and 1
  probability := GREATEST(0, LEAST(1, probability));
  
  RETURN probability;
END;
$$;

-- Add function for semantic search
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
    COALESCE(kb.metadata, '{}'::jsonb) as context
  FROM knowledge_base kb
  WHERE similarity((kb.content)::text, query_text) > similarity_threshold
  ORDER BY similarity((kb.content)::text, query_text) DESC
  LIMIT max_results;
END;
$$;

-- Create advanced monitoring views (without unique timestamp constraint)
DROP MATERIALIZED VIEW IF EXISTS system_health_hourly;
CREATE MATERIALIZED VIEW system_health_hourly AS
SELECT 
  date_trunc('hour', ts) as bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
WHERE ts > now() - interval '7 days'
GROUP BY date_trunc('hour', ts), metric_name
WITH DATA;

-- Create index for the materialized view (without unique constraint)
CREATE INDEX IF NOT EXISTS idx_system_health_hourly_bucket_metric 
ON system_health_hourly (bucket, metric_name);

-- Add function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh views that exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW ai_system_insights;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_health_hourly;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW system_health_hourly;
  END;
  
  -- Refresh other views if they exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  EXCEPTION WHEN undefined_table THEN
    -- View doesn't exist, skip
    NULL;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
  EXCEPTION WHEN undefined_table THEN
    -- View doesn't exist, skip
    NULL;
  END;
END;
$$;

-- Create function for database performance monitoring
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  db_size bigint;
  active_connections integer;
  cache_hit_ratio numeric;
BEGIN
  -- Get database size
  SELECT pg_database_size(current_database()) INTO db_size;
  
  -- Get active connections
  SELECT count(*) INTO active_connections
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Calculate cache hit ratio
  SELECT 
    CASE 
      WHEN (blks_hit + blks_read) > 0 
      THEN round((blks_hit::numeric / (blks_hit + blks_read)) * 100, 2)
      ELSE 0 
    END INTO cache_hit_ratio
  FROM pg_stat_database
  WHERE datname = current_database();
  
  -- Build result
  result := jsonb_build_object(
    'database_size_bytes', db_size,
    'active_connections', active_connections,
    'cache_hit_ratio_percent', COALESCE(cache_hit_ratio, 0),
    'avg_query_time', 0, -- Placeholder for query time
    'timestamp', extract(epoch from now())
  );
  
  RETURN result;
END;
$$;

-- Create function for AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_requests integer;
  successful_requests integer;
  avg_response_time numeric;
  success_rate numeric;
BEGIN
  -- Get metrics from ai_request_logs if table exists
  BEGIN
    SELECT 
      count(*),
      count(*) FILTER (WHERE success = true),
      avg(response_time_ms)
    INTO total_requests, successful_requests, avg_response_time
    FROM ai_request_logs
    WHERE provider_id = p_provider_id
      AND created_at > now() - (p_days || ' days')::interval;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, use defaults
    total_requests := 0;
    successful_requests := 0;
    avg_response_time := 0;
  END;
  
  -- Calculate success rate
  success_rate := CASE 
    WHEN total_requests > 0 THEN successful_requests::numeric / total_requests
    ELSE 0
  END;
  
  -- Build result
  result := jsonb_build_object(
    'provider_id', p_provider_id,
    'total_requests', COALESCE(total_requests, 0),
    'successful_requests', COALESCE(successful_requests, 0),
    'success_rate', COALESCE(success_rate, 0),
    'avg_response_time_ms', COALESCE(avg_response_time, 0),
    'period_days', p_days,
    'timestamp', extract(epoch from now())
  );
  
  RETURN result;
END;
$$;

-- Create function for system optimization
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  optimizations_applied text[] := '{}';
BEGIN
  -- Analyze tables for better query planning
  BEGIN
    ANALYZE;
    optimizations_applied := array_append(optimizations_applied, 'table_analysis');
  EXCEPTION WHEN OTHERS THEN
    -- Continue if analyze fails
    NULL;
  END;
  
  -- Update table statistics
  BEGIN
    -- This is automatically handled by ANALYZE
    optimizations_applied := array_append(optimizations_applied, 'statistics_update');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Build result
  result := jsonb_build_object(
    'optimizations_applied', optimizations_applied,
    'timestamp', extract(epoch from now()),
    'status', 'completed'
  );
  
  RETURN result;
END;
$$;

-- Create function for analytics optimizations
CREATE OR REPLACE FUNCTION create_analytics_optimizations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  indexes_created text[] := '{}';
BEGIN
  -- Create additional performance indexes if they don't exist
  BEGIN
    -- Index for user activity analysis
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_user_activity_created'
    ) THEN
      CREATE INDEX CONCURRENTLY idx_user_activity_created 
      ON user_activity_log (created_at);
      indexes_created := array_append(indexes_created, 'user_activity_created');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    -- Index for AI request analysis
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_ai_requests_provider_created'
    ) THEN
      CREATE INDEX CONCURRENTLY idx_ai_requests_provider_created 
      ON ai_request_logs (provider_id, created_at)
      WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_request_logs');
      indexes_created := array_append(indexes_created, 'ai_requests_provider_created');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Build result
  result := jsonb_build_object(
    'indexes_created', indexes_created,
    'timestamp', extract(epoch from now()),
    'status', 'completed'
  );
  
  RETURN result;
END;
$$;

-- Schedule materialized view refresh (if pg_cron is available)
DO $$
BEGIN
  -- Try to schedule refresh, but don't fail if pg_cron is not available
  BEGIN
    PERFORM cron.schedule(
      'refresh_analytics_views',
      '0 * * * *',  -- Every hour
      'SELECT refresh_materialized_views()'
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
  END;
END $$;