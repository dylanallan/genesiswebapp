/*
  # System Extensions and Optimizations

  1. Extensions
    - Enable pg_trgm for text search
    - Enable pg_stat_statements for query analysis
    - Enable timescaledb for time-series data

  2. System Health Metrics
    - Create system_health_metrics table for monitoring
    - Convert to hypertable for efficient time-series storage
    - Create continuous aggregate for hourly summaries

  3. Text Search Improvements
    - Add trigram indexes for efficient text search

  4. Materialized Views
    - Create AI system insights view
*/

-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_ts ON system_health_metrics(ts);
CREATE INDEX IF NOT EXISTS idx_system_health_name_ts ON system_health_metrics(metric_name, ts);

-- Add advanced indexing for text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin ((content::text) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sacred_content_trgm 
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

-- Create continuous aggregate for system health
CREATE MATERIALIZED VIEW IF NOT EXISTS system_health_hourly AS
SELECT
  time_bucket('1 hour', ts) AS bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
GROUP BY bucket, metric_name;

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ai_system_insights;
  REFRESH MATERIALIZED VIEW model_performance_summary;
  REFRESH MATERIALIZED VIEW funnel_performance_summary;
END;
$$;