-- Verify and fix existing Bolt components
BEGIN;

-- Function to check and fix existing components
CREATE OR REPLACE FUNCTION verify_and_fix_bolt_components()
RETURNS TABLE (
    component text,
    status text,
    action_taken text
) AS $$
DECLARE
    v_component record;
    v_status text;
    v_action text;
BEGIN
    -- Check knowledge_base table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'knowledge_base') THEN
        -- Verify and fix indexes
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'knowledge_base' AND indexname = 'idx_knowledge_base_content') THEN
            CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base (content);
            v_action := 'Created missing content index';
        ELSE
            v_action := 'Content index exists';
        END IF;
        
        -- Verify RLS
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'knowledge_base' AND rowsecurity = true) THEN
            ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
            v_action := v_action || ', Enabled RLS';
        END IF;
        
        v_status := 'OK';
    ELSE
        v_status := 'Missing';
        v_action := 'Table not found';
    END IF;
    
    RETURN QUERY SELECT 'knowledge_base'::text, v_status, v_action;

    -- Check ai_conversation_history table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_conversation_history') THEN
        -- Verify and fix indexes
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ai_conversation_history' AND indexname = 'idx_conversation_user_session') THEN
            CREATE INDEX IF NOT EXISTS idx_conversation_user_session ON ai_conversation_history(user_id, session_id);
            v_action := 'Created missing user_session index';
        ELSE
            v_action := 'User session index exists';
        END IF;
        
        -- Verify RLS
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_conversation_history' AND rowsecurity = true) THEN
            ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;
            v_action := v_action || ', Enabled RLS';
        END IF;
        
        v_status := 'OK';
    ELSE
        v_status := 'Missing';
        v_action := 'Table not found';
    END IF;
    
    RETURN QUERY SELECT 'ai_conversation_history'::text, v_status, v_action;

    -- Check essential functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_conversation_context') THEN
        v_status := 'OK';
        v_action := 'Function exists';
    ELSE
        v_status := 'Missing';
        v_action := 'Function not found';
    END IF;
    
    RETURN QUERY SELECT 'get_conversation_context'::text, v_status, v_action;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_similar_messages') THEN
        v_status := 'OK';
        v_action := 'Function exists';
    ELSE
        v_status := 'Missing';
        v_action := 'Function not found';
    END IF;
    
    RETURN QUERY SELECT 'find_similar_messages'::text, v_status, v_action;

    -- Check extensions
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        v_status := 'OK';
        v_action := 'Extension exists';
    ELSE
        CREATE EXTENSION IF NOT EXISTS vector;
        v_status := 'Fixed';
        v_action := 'Created extension';
    END IF;
    
    RETURN QUERY SELECT 'vector extension'::text, v_status, v_action;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        v_status := 'OK';
        v_action := 'Extension exists';
    ELSE
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        v_status := 'Fixed';
        v_action := 'Created extension';
    END IF;
    
    RETURN QUERY SELECT 'pg_trgm extension'::text, v_status, v_action;
END;
$$ LANGUAGE plpgsql;

-- Run verification and fixes
SELECT * FROM verify_and_fix_bolt_components();

-- Clean up
DROP FUNCTION IF EXISTS verify_and_fix_bolt_components();

COMMIT; 