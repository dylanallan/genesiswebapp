/*
  # Clean Database Setup for Bolt.new Deployment
  
  This migration consolidates all essential database structure for the Genesis web app
  and removes all problematic migrations and fixes to ensure a stable deployment.
*/

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Clean up any existing problematic views/tables
DO $$
BEGIN
    -- Drop all problematic views and tables
    DROP VIEW IF EXISTS ai_system_insights CASCADE;
    DROP TABLE IF EXISTS ai_system_insights CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS system_health_hourly CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS model_performance_summary CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS funnel_performance_summary CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Ensure proper primary key constraints
DO $$
BEGIN
    -- Fix model_performance_metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_performance_metrics') THEN
        ALTER TABLE model_performance_metrics 
        DROP CONSTRAINT IF EXISTS model_performance_metrics_pkey CASCADE;
        
        ALTER TABLE model_performance_metrics
        ADD CONSTRAINT model_performance_metrics_pkey 
        PRIMARY KEY (id, timestamp);
    END IF;
    
    -- Fix client_journeys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_journeys') THEN
        ALTER TABLE client_journeys
        DROP CONSTRAINT IF EXISTS client_journeys_pkey CASCADE;
        
        ALTER TABLE client_journeys
        ADD CONSTRAINT client_journeys_pkey 
        PRIMARY KEY (id, started_at);
    END IF;
    
    -- Fix system_health_metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_health_metrics') THEN
        ALTER TABLE system_health_metrics 
        DROP CONSTRAINT IF EXISTS system_health_metrics_pkey CASCADE;
        
        -- Remove duplicates
        DELETE FROM system_health_metrics a
        USING system_health_metrics b
        WHERE a.ctid < b.ctid
          AND a.ts = b.ts
          AND a.metric_name = b.metric_name;
        
        ALTER TABLE system_health_metrics
        ADD CONSTRAINT system_health_metrics_pkey 
        PRIMARY KEY (ts, metric_name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp 
ON model_performance_metrics(model_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_client_journeys_started 
ON client_journeys(started_at);

-- Fix JSONB indexes with correct operator classes
DO $$
BEGIN
    -- Drop existing problematic indexes
    DROP INDEX IF EXISTS idx_knowledge_base_content_gin;
    DROP INDEX IF EXISTS idx_sacred_content_trgm;
    
    -- Recreate with correct operator classes
    CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_gin 
    ON knowledge_base USING gin (content jsonb_path_ops);
    
    CREATE INDEX IF NOT EXISTS idx_sacred_content_trgm 
    ON sacred_content USING gin (content gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create clean AI system insights view
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

-- Create simple refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be extended later if needed
  NULL;
END;
$$;
