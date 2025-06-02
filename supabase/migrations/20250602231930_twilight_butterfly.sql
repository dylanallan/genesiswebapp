/*
  # TimescaleDB Integration and Performance Optimizations

  1. Extensions
    - Enable pg_trgm for text search
    - Enable pg_stat_statements for query analysis
    - Enable timescaledb for time-series data

  2. Table Modifications
    - Update primary keys to include timestamp columns
    - Convert relevant tables to hypertables
    - Add performance indexes

  3. Analytics
    - Create materialized views for insights
    - Set up system health monitoring
    - Add data retention policies
*/

-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Ensure proper unique constraints for TimescaleDB
ALTER TABLE model_performance_metrics 
DROP CONSTRAINT IF EXISTS model_performance_metrics_pkey CASCADE;

ALTER TABLE model_performance_metrics
ADD CONSTRAINT model_performance_metrics_pkey 
PRIMARY KEY (id, timestamp);

-- Update client_journeys constraints
ALTER TABLE client_journeys
DROP CONSTRAINT IF EXISTS client_journeys_pkey CASCADE;

ALTER TABLE client_journeys
ADD CONSTRAINT client_journeys_pkey 
PRIMARY KEY (id, started_at);

-- Create indexes before converting to hypertable
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics(model_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_client_journeys_started 
ON client_journeys(started_at);

-- Convert tables to hypertables
SELECT create_hypertable('model_performance_metrics', 'timestamp',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

SELECT create_hypertable('client_journeys', 'started_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Add advanced indexing for text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_base_trgm 
ON knowledge_base USING gin (content gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

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

-- Create system health monitoring table with proper composite key
CREATE TABLE IF NOT EXISTS system_health_metrics (
  ts timestamptz NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add primary key including timestamp
ALTER TABLE system_health_metrics
ADD CONSTRAINT system_health_metrics_pkey 
PRIMARY KEY (ts, metric_name);

-- Convert to hypertable
SELECT create_hypertable('system_health_metrics', 'ts',
  chunk_time_interval => interval '1 hour',
  if_not_exists => TRUE
);

-- Create continuous aggregate for system health
CREATE MATERIALIZED VIEW system_health_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', ts) AS bucket,
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
  interval '30 days',
  if_not_exists => TRUE
);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
  REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
END;
$$;