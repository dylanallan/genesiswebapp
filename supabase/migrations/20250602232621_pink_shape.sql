/*
  # Database Performance Optimization

  1. Extensions
    - Enable pg_trgm for text search
    - Enable pg_stat_statements for query analysis
  
  2. Indexes
    - Add optimized indexes for metrics and journeys
    - Create GIN indexes for JSON and text search
  
  3. Analytics Views
    - Create materialized view for AI system insights
    - Add system health monitoring
    
  4. Maintenance
    - Add view refresh function
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add timestamp-based indexes for metrics
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp 
ON model_performance_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics(model_id, timestamp);

-- Add indexes for client journeys
CREATE INDEX IF NOT EXISTS idx_client_journeys_started 
ON client_journeys(started_at);

CREATE INDEX IF NOT EXISTS idx_client_journeys_user_started 
ON client_journeys(user_id, started_at);

-- Add advanced indexing for text and jsonb search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content 
ON knowledge_base USING gin ((content::text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_jsonb
ON knowledge_base USING gin (content jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_text
ON sacred_content USING gin ((content::text) gin_trgm_ops);

-- Create materialized view for AI system insights
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
    avg(array_length(regexp_split_to_array(content::text, '\s+'), 1)) as avg_content_length
  FROM knowledge_base
)
SELECT 
  ms.*,
  ks.*,
  now() as last_updated
FROM model_stats ms
CROSS JOIN knowledge_stats ks;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_system_insights_model
ON ai_system_insights(model_id);

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_ts 
ON system_health_metrics(ts);

CREATE INDEX IF NOT EXISTS idx_system_health_name_ts 
ON system_health_metrics(metric_name, ts);

-- Create materialized view for hourly health metrics
CREATE MATERIALIZED VIEW system_health_hourly AS
SELECT
  date_trunc('hour', ts) AS bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
WHERE ts > now() - interval '30 days'
GROUP BY date_trunc('hour', ts), metric_name;

-- Create index on hourly view
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_health_hourly_bucket
ON system_health_hourly(bucket, metric_name);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  REFRESH MATERIALIZED VIEW CONCURRENTLY system_health_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
END;
$$;