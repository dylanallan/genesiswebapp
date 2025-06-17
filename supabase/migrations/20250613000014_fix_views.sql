-- Simple fix for views
BEGIN;

-- Drop any existing views with this name
DROP VIEW IF EXISTS ai_system_insights CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ai_system_insights CASCADE;

-- Create a simple regular view
CREATE OR REPLACE VIEW ai_system_insights AS
SELECT 
    'system_status' as status,
    now() as last_updated,
    (SELECT count(*) FROM knowledge_base) as knowledge_base_count,
    (SELECT count(*) FROM ai_conversation_history) as conversation_count;

-- Grant access
GRANT SELECT ON ai_system_insights TO authenticated;

COMMIT; 