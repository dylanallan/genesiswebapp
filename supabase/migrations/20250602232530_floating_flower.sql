/*
  # Essential Database Setup for Genesis Web App
  
  This migration sets up the core database structure for the Genesis web app
  without TimescaleDB dependencies to ensure compatibility with remote Supabase.
*/

-- Enable basic extensions
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

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics(model_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_client_journeys_started 
ON client_journeys(started_at);

-- Add text search indexing for sacred content
CREATE INDEX IF NOT EXISTS idx_sacred_content_trgm 
ON sacred_content USING gin (content gin_trgm_ops);

-- Drop any existing ai_system_insights object and create view
DO $$
BEGIN
    -- Drop any existing object with this name
    DROP VIEW IF EXISTS ai_system_insights CASCADE;
    DROP TABLE IF EXISTS ai_system_insights CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create view for AI system insights
CREATE VIEW ai_system_insights AS
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

-- Handle system_health_metrics table (simplified)
DO $$
BEGIN
  -- Drop existing primary key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'system_health_metrics'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE system_health_metrics DROP CONSTRAINT IF EXISTS system_health_metrics_pkey CASCADE;
  END IF;
  
  -- Remove duplicates
  DELETE FROM system_health_metrics a
  USING system_health_metrics b
  WHERE a.ctid < b.ctid
    AND a.ts = b.ts
    AND a.metric_name = b.metric_name;
    
  -- Add primary key
  ALTER TABLE system_health_metrics
  ADD CONSTRAINT system_health_metrics_pkey 
  PRIMARY KEY (ts, metric_name);
  
EXCEPTION WHEN OTHERS THEN
  -- If table doesn't exist or other issues, just continue
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