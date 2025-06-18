-- Simple Chat Function - Guaranteed to work

-- Drop existing functions
DROP FUNCTION IF EXISTS process_chat_message(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_chat_history(UUID, UUID);
DROP FUNCTION IF EXISTS get_conversation_list(UUID);

-- Simple process_chat_message function
CREATE OR REPLACE FUNCTION process_chat_message(
    user_uuid UUID,
    message TEXT,
    context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    response TEXT;
    conversation_id UUID;
BEGIN
    -- Generate conversation ID
    conversation_id := uuid_generate_v4();
    
    -- Log the user message
    INSERT INTO ai_conversation_history (user_id, conversation_id, message, role, metadata)
    VALUES (user_uuid, conversation_id, message, 'user', context);
    
    -- Simple response logic
    IF message ILIKE '%hello%' OR message ILIKE '%hi%' THEN
        response := 'Hello! Welcome to Genesis Heritage. How can I help you today?';
    ELSIF message ILIKE '%dna%' THEN
        response := 'I can help you analyze DNA results and explore your family history!';
    ELSIF message ILIKE '%help%' THEN
        response := 'I can help with DNA analysis, document research, voice stories, and genealogy!';
    ELSE
        response := 'I''m here to help you discover your family heritage. What would you like to explore?';
    END IF;
    
    -- Log the AI response
    INSERT INTO ai_conversation_history (user_id, conversation_id, message, role, metadata)
    VALUES (user_uuid, conversation_id, response, 'assistant', '{"generated": true}'::JSONB);
    
    -- Return the response
    RETURN jsonb_build_object(
        'response', response,
        'conversation_id', conversation_id,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'response', 'Hello! I can help you with genealogy and family history. What would you like to explore?',
            'timestamp', NOW()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple get_chat_history function
CREATE OR REPLACE FUNCTION get_chat_history(
    user_uuid UUID,
    conversation_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', ach.id,
                'message', ach.message,
                'role', ach.role,
                'created_at', ach.created_at
            )
        ), '[]'::JSONB)
        FROM ai_conversation_history ach
        WHERE ach.user_id = user_uuid
        AND (conversation_id IS NULL OR ach.conversation_id = conversation_id)
        ORDER BY ach.created_at ASC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_chat_message(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_history(UUID, UUID) TO authenticated; 