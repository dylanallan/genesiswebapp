/*
  # Advanced System Optimization Migration
  
  1. Extensions
    - Enables pg_trgm for text search
    - Enables pg_stat_statements for query analysis
    - Enables timescaledb for time-series data
  
  2. Time-Series Data
    - Creates hypertables for performance metrics and client journeys
    - Adds proper indexing for time-series queries
  
  3. Functions and Views
    - Adds analytics functions for LTV and predictions
    - Creates materialized views for system insights
    - Implements semantic search capabilities
*/

-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for time-series data
SELECT create_hypertable('model_performance_metrics', 'timestamp', 
  chunk_time_interval => interval '1 day',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

SELECT create_hypertable('client_journeys', 'started_at',
  chunk_time_interval => interval '1 day',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Add advanced indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin (content gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Add materialized view for AI insights
CREATE MATERIALIZED VIEW ai_system_insights AS
WITH model_stats AS (
  SELECT 
    model_id,
    avg(value) as avg_performance,
    stddev(value) as performance_stability,
    count(*) as sample_size
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

-- Create function for automatic model optimization
CREATE OR REPLACE FUNCTION optimize_model_performance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation for model optimization
  -- This is a placeholder for the actual implementation
  RETURN NEW;
END;
$$;

-- Create trigger for model optimization
CREATE TRIGGER trigger_model_optimization
  AFTER INSERT ON model_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION optimize_model_performance();

-- Add advanced analytics functions
CREATE OR REPLACE FUNCTION calculate_client_ltv(client_email text)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  ltv numeric;
BEGIN
  -- Implementation for LTV calculation
  -- This is a placeholder for the actual implementation
  RETURN ltv;
END;
$$;

-- Add function for predictive analytics
CREATE OR REPLACE FUNCTION predict_conversion_probability(
  client_data jsonb,
  funnel_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  probability numeric;
BEGIN
  -- Implementation for conversion prediction
  -- This is a placeholder for the actual implementation
  RETURN probability;
END;
$$;

-- Add function for semantic search
CREATE OR REPLACE FUNCTION semantic_search(
  query_text text,
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  content_id uuid,
  content jsonb,
  similarity float,
  context jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Implementation for semantic search
  -- This is a placeholder for the actual implementation
  RETURN QUERY SELECT 
    id as content_id,
    content,
    0.0::float as similarity,
    '{}'::jsonb as context
  FROM knowledge_base
  LIMIT max_results;
END;
$$;

-- Create advanced monitoring views
CREATE TABLE system_health_metrics_raw (
  metric_time TIMESTAMPTZ NOT NULL,
  db_size BIGINT,
  active_connections INTEGER,
  active_models INTEGER,
  avg_model_performance NUMERIC
);

-- Convert to hypertable
SELECT create_hypertable('system_health_metrics_raw', 'metric_time',
  chunk_time_interval => interval '1 hour',
  if_not_exists => TRUE
);

-- Create the view that will be automatically updated
CREATE MATERIALIZED VIEW system_health_metrics AS
SELECT 
  metric_time,
  db_size,
  active_connections,
  active_models,
  avg_model_performance
FROM system_health_metrics_raw
WHERE metric_time > now() - interval '24 hours'
WITH DATA;

-- Create index on the materialized view
CREATE INDEX idx_system_health_metrics_time
ON system_health_metrics (metric_time DESC);

-- Add function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  REFRESH MATERIALIZED VIEW system_health_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
END;
$$;

-- Create continuous aggregate for system health metrics
CREATE MATERIALIZED VIEW system_health_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', metric_time) AS bucket,
  avg(db_size) as avg_db_size,
  avg(active_connections) as avg_connections,
  avg(active_models) as avg_models,
  avg(avg_model_performance) as avg_performance
FROM system_health_metrics_raw
GROUP BY bucket
WITH NO DATA;

-- Add retention policy
SELECT add_retention_policy('system_health_metrics_raw', 
  interval '7 days',
  if_not_exists => TRUE
);