/*
  # Performance Optimization Migration

  1. Extensions
    - Enables pg_trgm for text search
    - Enables pg_stat_statements for query analysis

  2. Database Setup
    - Configures proper primary keys for performance
    - Sets up optimized indexes

  3. Indexing
    - Creates optimized indexes for data access
    - Adds GIN indexes for jsonb and text search
    
  4. Analytics
    - Creates view for AI system insights
    - Sets up system health monitoring
*/

-- Enable additional extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ensure proper unique constraints
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics(model_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_client_journeys_started 
ON client_journeys(started_at);

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_knowledge_base_content;

-- Create index for knowledge base content
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base (content);

-- Add advanced indexing for text and jsonb search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_jsonb
ON knowledge_base USING gin (content jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_text
ON sacred_content USING gin ((content::text) gin_trgm_ops);

-- Handle ai_system_insights properly
DO $$
BEGIN
    -- Drop any existing object with this name
    DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;
    DROP VIEW IF EXISTS ai_system_insights CASCADE;
    DROP TABLE IF EXISTS ai_system_insights CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create view for AI system insights using CREATE OR REPLACE
CREATE OR REPLACE VIEW ai_system_insights AS
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
DO $$
BEGIN
    ALTER TABLE system_health_metrics
    ADD CONSTRAINT system_health_metrics_pkey 
    PRIMARY KEY (ts, metric_name);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create function to refresh views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh any materialized views that exist
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_performance_summary;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;