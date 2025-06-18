-- Fixed Chat RPC Functions for Genesis Web App

-- Drop existing functions
DROP FUNCTION IF EXISTS process_chat_message(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_chat_history(UUID, UUID);
DROP FUNCTION IF EXISTS get_conversation_list(UUID);

-- Fixed process_chat_message function
CREATE OR REPLACE FUNCTION process_chat_message(
    user_uuid UUID,
    message TEXT,
    context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    response TEXT;
    conversation_id UUID;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role 
    FROM user_metadata 
    WHERE user_id = user_uuid;
    
    -- Generate conversation ID if not provided
    conversation_id := COALESCE(context->>'conversation_id', uuid_generate_v4()::TEXT)::UUID;
    
    -- Log the user message
    INSERT INTO ai_conversation_history (user_id, conversation_id, message, role, metadata)
    VALUES (user_uuid, conversation_id, message, 'user', context);
    
    -- Simple response logic
    IF message ILIKE '%hello%' OR message ILIKE '%hi%' THEN
        response := 'Hello! Welcome to Genesis Heritage. I can help you explore your family history, analyze DNA results, and discover your roots. What would you like to start with?';
    ELSIF message ILIKE '%dna%' OR message ILIKE '%genealogy%' OR message ILIKE '%family%' THEN
        response := 'Great! I can help you with DNA analysis and genealogy research. Would you like to: 1) Analyze DNA results, 2) Research family documents, 3) Create a family tree, or 4) Learn about your heritage?';
    ELSIF message ILIKE '%help%' OR message ILIKE '%what can you do%' THEN
        response := 'I can help you with: • DNA analysis and interpretation • Document analysis and transcription • Family history research • Voice story generation • Record matching and verification • Cultural heritage exploration. What interests you most?';
    ELSIF message ILIKE '%voice%' OR message ILIKE '%story%' THEN
        response := 'I can help you generate voice stories from your family history! This feature can turn your genealogical discoveries into narrated stories. Would you like to create a voice story from your family research?';
    ELSIF message ILIKE '%document%' OR message ILIKE '%record%' THEN
        response := 'I can analyze historical documents and records for you. This includes: • Transcribing old handwriting • Extracting key information • Identifying family connections • Verifying historical accuracy. Do you have documents to analyze?';
    ELSIF message ILIKE '%thank%' THEN
        response := 'You''re welcome! I''m here to help you discover and preserve your family heritage. Is there anything else you''d like to explore?';
    ELSE
        response := 'I understand you''re interested in family history and genealogy. I can help you with DNA analysis, document research, voice story generation, and more. What specific aspect of your heritage would you like to explore?';
    END IF;
    
    -- Log the AI response
    INSERT INTO ai_conversation_history (user_id, conversation_id, message, role, metadata)
    VALUES (user_uuid, conversation_id, response, 'assistant', jsonb_build_object('generated', true));
    
    -- Track AI usage (simplified)
    INSERT INTO ai_usage_quotas (user_id, tokens_used, period_start, period_end)
    VALUES (user_uuid, 50, NOW(), NOW() + INTERVAL '1 month')
    ON CONFLICT (user_id) 
    DO UPDATE SET tokens_used = ai_usage_quotas.tokens_used + 50;
    
    -- Return the response
    RETURN jsonb_build_object(
        'response', response,
        'conversation_id', conversation_id,
        'timestamp', NOW(),
        'user_role', user_role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO error_recovery_logs (error_type, details)
        VALUES ('chat_processing_error', jsonb_build_object(
            'user_id', user_uuid,
            'message', message,
            'error', SQLERRM
        ));
        
        -- Return error response
        RETURN jsonb_build_object(
            'response', 'I apologize, but I encountered an error processing your message. Please try again.',
            'error', true,
            'timestamp', NOW()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fixed get_chat_history function
CREATE OR REPLACE FUNCTION get_chat_history(
    user_uuid UUID,
    conversation_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ach.id,
                'message', ach.message,
                'role', ach.role,
                'created_at', ach.created_at,
                'metadata', ach.metadata
            )
        )
        FROM ai_conversation_history ach
        WHERE ach.user_id = user_uuid
        AND (conversation_id IS NULL OR ach.conversation_id = conversation_id)
        ORDER BY ach.created_at ASC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fixed get_conversation_list function
CREATE OR REPLACE FUNCTION get_conversation_list(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'conversation_id', latest.conversation_id,
                'last_message', latest.message,
                'last_updated', latest.created_at,
                'message_count', latest.message_count
            )
        )
        FROM (
            SELECT 
                ach.conversation_id,
                ach.message,
                ach.created_at,
                COUNT(*) OVER (PARTITION BY ach.conversation_id) as message_count
            FROM ai_conversation_history ach
            WHERE ach.user_id = user_uuid
            AND ach.created_at = (
                SELECT MAX(created_at) 
                FROM ai_conversation_history ach2 
                WHERE ach2.conversation_id = ach.conversation_id
            )
        ) latest
        ORDER BY latest.created_at DESC
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_chat_message(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_history(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_list(UUID) TO authenticated; 