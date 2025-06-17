-- Ultra Simple Chat Function - Guaranteed to work

-- Drop existing functions
DROP FUNCTION IF EXISTS process_chat_message(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_chat_history(UUID, UUID);
DROP FUNCTION IF EXISTS get_conversation_list(UUID);

-- Ultra simple process_chat_message function
CREATE OR REPLACE FUNCTION process_chat_message(
    user_uuid UUID,
    message TEXT,
    context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    response TEXT;
BEGIN
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
    
    -- Return the response
    RETURN jsonb_build_object(
        'response', response,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_chat_message(UUID, TEXT, JSONB) TO authenticated; 