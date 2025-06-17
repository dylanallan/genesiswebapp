-- Fix ai_system_insights view issue
BEGIN;

-- First, drop both regular and materialized views if they exist
DROP VIEW IF EXISTS ai_system_insights CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;

-- Create a regular view instead of a materialized view
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

-- Grant access to authenticated users
GRANT SELECT ON ai_system_insights TO authenticated;

-- Add helpful comment
COMMENT ON VIEW ai_system_insights IS 'View for AI system performance and knowledge base statistics';

COMMIT; 