-- Essential setup for Bolt compatibility
BEGIN;

-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create or update ai_conversation_history table if needed
CREATE TABLE IF NOT EXISTS ai_conversation_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    message_index integer NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create essential indexes for conversation history
CREATE INDEX IF NOT EXISTS idx_conversation_user_session 
ON ai_conversation_history(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_session_index 
ON ai_conversation_history(session_id, message_index);

CREATE INDEX IF NOT EXISTS idx_conversation_embedding 
ON ai_conversation_history USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS on conversation history
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

-- Create essential policies
CREATE POLICY "Users can manage their own conversations"
ON ai_conversation_history
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create or update essential functions
CREATE OR REPLACE FUNCTION get_conversation_context(
    p_session_id text,
    p_user_id uuid,
    p_max_messages integer DEFAULT 10
)
RETURNS TABLE (
    role text,
    content text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT ch.role, ch.content, ch.created_at
    FROM ai_conversation_history ch
    WHERE ch.session_id = p_session_id
    AND ch.user_id = p_user_id
    ORDER BY ch.message_index ASC
    LIMIT p_max_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION find_similar_messages(
    p_embedding vector(1536),
    p_match_threshold float DEFAULT 0.7,
    p_match_count int DEFAULT 5,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    role text,
    content text,
    similarity float,
    session_id text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ch.id,
        ch.role,
        ch.content,
        1 - (ch.embedding <=> p_embedding) as similarity,
        ch.session_id,
        ch.created_at
    FROM ai_conversation_history ch
    WHERE ch.embedding IS NOT NULL
    AND (p_user_id IS NULL OR ch.user_id = p_user_id)
    AND 1 - (ch.embedding <=> p_embedding) > p_match_threshold
    ORDER BY ch.embedding <=> p_embedding
    LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify essential components
CREATE OR REPLACE FUNCTION verify_bolt_components()
RETURNS void AS $$
DECLARE
    missing_components text[];
BEGIN
    -- Check for required tables
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'knowledge_base') THEN
        missing_components := array_append(missing_components, 'knowledge_base table');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_conversation_history') THEN
        missing_components := array_append(missing_components, 'ai_conversation_history table');
    END IF;

    -- Check for required functions
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_conversation_context') THEN
        missing_components := array_append(missing_components, 'get_conversation_context function');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_similar_messages') THEN
        missing_components := array_append(missing_components, 'find_similar_messages function');
    END IF;

    -- Raise exception if any components are missing
    IF array_length(missing_components, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required components: %', array_to_string(missing_components, ', ');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT verify_bolt_components();

-- Clean up verification function
DROP FUNCTION IF EXISTS verify_bolt_components();

-- Add helpful comments
COMMENT ON TABLE knowledge_base IS 'Knowledge base table for Bolt AI system';
COMMENT ON TABLE ai_conversation_history IS 'Conversation history for Bolt AI chat system';
COMMENT ON FUNCTION get_conversation_context IS 'Get conversation context for Bolt AI chat';
COMMENT ON FUNCTION find_similar_messages IS 'Find similar messages for Bolt AI chat';

COMMIT; 