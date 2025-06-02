/*
  # Enhanced System Capabilities

  1. Extensions
    - Enable pg_trgm for text search
    - Enable pg_stat_statements for query analysis
    - Enable TimescaleDB for time-series data

  2. Indexing & Performance
    - Add trigram indexes for text search
    - Create materialized views for analytics
    - Add monitoring capabilities

  3. Functions
    - Add predictive analytics
    - Add semantic search
    - Add client LTV calculation
*/

-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for time-series data
SELECT create_hypertable('model_performance_metrics', 'timestamp', 
  if_not_exists => TRUE,
  migrate_data => TRUE
);

SELECT create_hypertable('client_journeys', 'started_at',
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

-- Create advanced monitoring views with non-unique time-based index
CREATE MATERIALIZED VIEW system_health_metrics AS
SELECT 
  date_trunc('hour', current_timestamp) as metric_time,
  pg_database_size(current_database()) as db_size,
  (SELECT count(*) FROM pg_stat_activity) as active_connections,
  (SELECT count(*) FROM ai_models) as active_models,
  (SELECT avg(value) FROM model_performance_metrics WHERE timestamp > now() - interval '1 hour') as avg_model_performance,
  -- Add a unique identifier for the index
  gen_random_uuid() as metric_id
WITH DATA;

-- Create a unique index on the metric_id instead of timestamp
CREATE UNIQUE INDEX idx_system_health_metrics_id
ON system_health_metrics (metric_id);

-- Create a non-unique index on the timestamp for time-based queries
CREATE INDEX idx_system_health_metrics_time
ON system_health_metrics (metric_time);

-- Add function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  REFRESH MATERIALIZED VIEW CONCURRENTLY system_health_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
END;
$$;