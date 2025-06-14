-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for time-series data with proper indexes
CREATE TABLE IF NOT EXISTS model_performance_metrics_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id),
  metric_type text NOT NULL,
  value numeric NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

SELECT create_hypertable('model_performance_metrics_staging', 'timestamp',
  chunk_time_interval => interval '1 day',
  if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_mpm_model_ts ON model_performance_metrics_staging (model_id, timestamp DESC);

-- Create materialized view for AI insights
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_system_insights AS
WITH model_stats AS (
  SELECT 
    model_id,
    avg(value) as avg_performance,
    stddev(value) as performance_stability,
    count(*) as sample_count
  FROM model_performance_metrics_staging
  WHERE timestamp > now() - interval '30 days'
  GROUP BY model_id
),
knowledge_stats AS (
  SELECT 
    count(*) as total_entries,
    avg(length(content::text)) as avg_content_length
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

-- Create indexes for text search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin ((content::text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION semantic_search(
  query_text text,
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  content_id uuid,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id as content_id,
    kb.content,
    similarity(kb.content::text, query_text) as similarity
  FROM knowledge_base kb
  WHERE similarity(kb.content::text, query_text) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- Create system health monitoring
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

SELECT create_hypertable('system_health_metrics', 'ts',
  chunk_time_interval => interval '1 day',
  if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_name_ts 
ON system_health_metrics (metric_name, ts DESC);

-- Create continuous aggregates for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS system_health_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', ts) as bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
GROUP BY bucket, metric_name
WITH NO DATA;

-- Add retention policy
SELECT add_retention_policy('system_health_metrics',
  INTERVAL '30 days',
  if_not_exists => TRUE
);

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  REFRESH MATERIALIZED VIEW CONCURRENTLY system_health_hourly;
END;
$$;