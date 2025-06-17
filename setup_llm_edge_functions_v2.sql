-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Insert default model configurations
INSERT INTO llm_model_configs (
    provider,
    model_name,
    api_key_id,
    configuration,
    capabilities,
    context_window,
    max_tokens,
    temperature,
    is_active
) VALUES 
    (
        'anthropic',
        'claude-3-opus-20240229',
        (SELECT id FROM api_key_management WHERE key_name = 'anthropic_api_key' LIMIT 1),
        jsonb_build_object(
            'max_tokens', 4096,
            'temperature', 0.7,
            'top_p', 1,
            'anthropic_version', '2023-06-01'
        ),
        ARRAY['chat', 'completion', 'analysis', 'summarization'],
        200000,
        4096,
        0.7,
        true
    ),
    (
        'openai',
        'gpt-4-turbo-preview',
        (SELECT id FROM api_key_management WHERE key_name = 'openai_api_key' LIMIT 1),
        jsonb_build_object(
            'max_tokens', 4096,
            'temperature', 0.7,
            'top_p', 1,
            'frequency_penalty', 0,
            'presence_penalty', 0
        ),
        ARRAY['chat', 'completion', 'analysis', 'summarization', 'code'],
        128000,
        4096,
        0.7,
        true
    ),
    (
        'google',
        'gemini-pro',
        (SELECT id FROM api_key_management WHERE key_name = 'google_api_key' LIMIT 1),
        jsonb_build_object(
            'max_tokens', 2048,
            'temperature', 0.7,
            'top_p', 1,
            'top_k', 40
        ),
        ARRAY['chat', 'completion', 'analysis'],
        32768,
        2048,
        0.7,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    configuration = EXCLUDED.configuration,
    capabilities = EXCLUDED.capabilities,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Create function to select appropriate LLM model
CREATE OR REPLACE FUNCTION select_llm_model(
    p_task_type text,
    p_content_type text DEFAULT NULL,
    p_language text DEFAULT 'en',
    p_context_length integer DEFAULT 1000
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_model_id uuid;
BEGIN
    -- Select model based on task requirements and capabilities
    SELECT id INTO v_model_id
    FROM llm_model_configs
    WHERE is_active = true
    AND context_window >= p_context_length
    AND (
        CASE 
            WHEN p_task_type = 'code' THEN
                'code' = ANY(capabilities)
            WHEN p_task_type = 'analysis' THEN
                'analysis' = ANY(capabilities)
            WHEN p_task_type = 'summarization' THEN
                'summarization' = ANY(capabilities)
            ELSE
                'chat' = ANY(capabilities)
        END
    )
    ORDER BY 
        CASE provider
            WHEN 'anthropic' THEN 1
            WHEN 'openai' THEN 2
            WHEN 'google' THEN 3
            ELSE 4
        END,
        context_window DESC
    LIMIT 1;

    IF v_model_id IS NULL THEN
        RAISE EXCEPTION 'No suitable model found for the given requirements';
    END IF;

    RETURN v_model_id;
END;
$$;

-- Create function to process chat messages
CREATE OR REPLACE FUNCTION process_chat_message(
    p_conversation_id uuid,
    p_message text,
    p_role text DEFAULT 'user',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation llm_conversations;
    v_model_config llm_model_configs;
    v_api_key api_key_management;
    v_response jsonb;
    v_message_id uuid;
    v_tokens_used integer;
    v_processing_time interval;
    v_start_time timestamptz;
BEGIN
    -- Get conversation details
    SELECT * INTO v_conversation
    FROM llm_conversations
    WHERE id = p_conversation_id
    AND user_id = auth.uid();

    IF v_conversation IS NULL THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Get model configuration
    SELECT * INTO v_model_config
    FROM llm_model_configs
    WHERE id = v_conversation.model_config_id;

    IF v_model_config IS NULL THEN
        RAISE EXCEPTION 'Model configuration not found';
    END IF;

    -- Get API key
    SELECT * INTO v_api_key
    FROM api_key_management
    WHERE id = v_model_config.api_key_id
    AND is_active = true;

    IF v_api_key IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive API key';
    END IF;

    -- Insert user message
    INSERT INTO llm_messages (
        conversation_id,
        role,
        content,
        metadata
    ) VALUES (
        p_conversation_id,
        p_role,
        p_message,
        p_metadata
    ) RETURNING id INTO v_message_id;

    -- Start timing
    v_start_time := clock_timestamp();

    -- Process message based on provider
    CASE v_model_config.provider
        WHEN 'anthropic' THEN
            v_response := process_anthropic_request(
                v_api_key.encrypted_key,
                p_message,
                v_model_config.configuration,
                v_conversation.context
            );
        WHEN 'openai' THEN
            v_response := process_openai_request(
                v_api_key.encrypted_key,
                p_message,
                v_model_config.configuration,
                v_conversation.context
            );
        WHEN 'google' THEN
            v_response := process_google_request(
                v_api_key.encrypted_key,
                p_message,
                v_model_config.configuration,
                v_conversation.context
            );
        ELSE
            RAISE EXCEPTION 'Unsupported LLM provider: %', v_model_config.provider;
    END CASE;

    -- Calculate processing time
    v_processing_time := clock_timestamp() - v_start_time;

    -- Extract response details
    v_tokens_used := (v_response->>'tokens_used')::integer;

    -- Insert assistant response
    INSERT INTO llm_messages (
        conversation_id,
        role,
        content,
        tokens_used,
        processing_time,
        metadata,
        embedding
    ) VALUES (
        p_conversation_id,
        'assistant',
        v_response->>'content',
        v_tokens_used,
        v_processing_time,
        jsonb_build_object(
            'provider', v_model_config.provider,
            'model', v_model_config.model_name,
            'response_metadata', v_response->'metadata'
        ),
        (v_response->>'embedding')::vector
    );

    -- Update conversation context
    UPDATE llm_conversations
    SET 
        context = v_response->'context',
        updated_at = now()
    WHERE id = p_conversation_id;

    -- Log the request
    INSERT INTO ai_request_logs (
        user_id,
        provider_id,
        request_type,
        prompt_length,
        response_length,
        tokens_used,
        response_time_ms,
        success
    ) VALUES (
        auth.uid(),
        v_model_config.provider,
        'chat',
        length(p_message),
        length(v_response->>'content'),
        v_tokens_used,
        extract(epoch from v_processing_time) * 1000,
        true
    );

    -- Return response with metadata
    RETURN jsonb_build_object(
        'message_id', v_message_id,
        'response', v_response->>'content',
        'tokens_used', v_tokens_used,
        'processing_time', v_processing_time,
        'model', v_model_config.model_name,
        'provider', v_model_config.provider,
        'metadata', v_response->'metadata'
    );
END;
$$;

-- Create function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_conversation_id uuid,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation llm_conversations;
    v_messages jsonb;
BEGIN
    -- Get conversation details
    SELECT * INTO v_conversation
    FROM llm_conversations
    WHERE id = p_conversation_id
    AND user_id = auth.uid();

    IF v_conversation IS NULL THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Get messages with context
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'role', m.role,
            'content', m.content,
            'tokens_used', m.tokens_used,
            'processing_time', m.processing_time,
            'created_at', m.created_at,
            'metadata', m.metadata
        ) ORDER BY m.created_at
    ) INTO v_messages
    FROM llm_messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit;

    -- Return conversation with messages
    RETURN jsonb_build_object(
        'conversation_id', v_conversation.id,
        'model_config_id', v_conversation.model_config_id,
        'context', v_conversation.context,
        'status', v_conversation.status,
        'created_at', v_conversation.created_at,
        'updated_at', v_conversation.updated_at,
        'messages', COALESCE(v_messages, '[]'::jsonb)
    );
END;
$$;

-- Create function to find similar conversations
CREATE OR REPLACE FUNCTION find_similar_conversations(
    p_query text,
    p_limit integer DEFAULT 5
)
RETURNS TABLE (
    conversation_id uuid,
    similarity numeric,
    summary text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_query_embedding vector(1536);
BEGIN
    -- Get query embedding using OpenAI
    SELECT embedding INTO v_query_embedding
    FROM get_embedding(p_query);

    -- Find similar conversations using vector similarity
    RETURN QUERY
    WITH conversation_embeddings AS (
        SELECT 
            c.id,
            c.created_at,
            c.context->>'summary' as summary,
            m.embedding as last_message_embedding
        FROM llm_conversations c
        JOIN llm_messages m ON m.conversation_id = c.id
        WHERE c.user_id = auth.uid()
        AND m.embedding IS NOT NULL
        AND m.role = 'assistant'
        AND m.id = (
            SELECT id 
            FROM llm_messages 
            WHERE conversation_id = c.id 
            ORDER BY created_at DESC 
            LIMIT 1
        )
    )
    SELECT 
        id as conversation_id,
        1 - (last_message_embedding <=> v_query_embedding) as similarity,
        summary,
        created_at
    FROM conversation_embeddings
    ORDER BY similarity DESC
    LIMIT p_limit;
END;
$$;

-- Create function to manage conversation context
CREATE OR REPLACE FUNCTION manage_conversation_context(
    p_conversation_id uuid,
    p_action text,
    p_context_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conversation llm_conversations;
    v_result jsonb;
BEGIN
    -- Get conversation
    SELECT * INTO v_conversation
    FROM llm_conversations
    WHERE id = p_conversation_id
    AND user_id = auth.uid();

    IF v_conversation IS NULL THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Handle different context management actions
    CASE p_action
        WHEN 'get' THEN
            v_result := v_conversation.context;
        WHEN 'update' THEN
            IF p_context_data IS NULL THEN
                RAISE EXCEPTION 'Context data required for update action';
            END IF;
            
            UPDATE llm_conversations
            SET 
                context = context || p_context_data,
                updated_at = now()
            WHERE id = p_conversation_id
            RETURNING context INTO v_result;
            
        WHEN 'clear' THEN
            UPDATE llm_conversations
            SET 
                context = '{}'::jsonb,
                updated_at = now()
            WHERE id = p_conversation_id
            RETURNING context INTO v_result;
            
        ELSE
            RAISE EXCEPTION 'Invalid action: %', p_action;
    END CASE;

    RETURN v_result;
END;
$$;

-- Create function to handle conversation feedback
CREATE OR REPLACE FUNCTION submit_conversation_feedback(
    p_conversation_id uuid,
    p_rating integer,
    p_feedback_text text DEFAULT NULL,
    p_categories text[] DEFAULT NULL,
    p_was_helpful boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_feedback_id uuid;
    v_conversation llm_conversations;
BEGIN
    -- Validate conversation access
    SELECT * INTO v_conversation
    FROM llm_conversations
    WHERE id = p_conversation_id
    AND user_id = auth.uid();

    IF v_conversation IS NULL THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    -- Insert feedback
    INSERT INTO ai_conversation_feedback (
        conversation_id,
        user_id,
        rating,
        feedback_text,
        categories,
        was_helpful
    ) VALUES (
        p_conversation_id,
        auth.uid(),
        p_rating,
        p_feedback_text,
        p_categories,
        p_was_helpful
    ) RETURNING id INTO v_feedback_id;

    -- Update conversation analytics
    UPDATE ai_conversation_analytics
    SET 
        sentiment_score = (
            SELECT AVG(rating)::numeric
            FROM ai_conversation_feedback
            WHERE conversation_id = p_conversation_id
        )
    WHERE conversation_id = p_conversation_id;

    -- Log the feedback
    INSERT INTO user_activity_log (
        user_id,
        activity_type,
        metadata
    ) VALUES (
        auth.uid(),
        'conversation_feedback',
        jsonb_build_object(
            'conversation_id', p_conversation_id,
            'rating', p_rating,
            'categories', p_categories,
            'was_helpful', p_was_helpful
        )
    );

    RETURN jsonb_build_object(
        'feedback_id', v_feedback_id,
        'status', 'success',
        'message', 'Feedback submitted successfully'
    );
END;
$$;

-- Create function to refresh conversation insights
CREATE OR REPLACE FUNCTION refresh_conversation_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_insights;
END;
$$;

-- Create materialized view for conversation insights
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_insights AS
SELECT
    c.id as conversation_id,
    c.user_id,
    c.model_config_id,
    mc.provider,
    mc.model_name,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.role = 'user') as user_messages,
    COUNT(m.id) FILTER (WHERE m.role = 'assistant') as assistant_messages,
    AVG(f.rating) as average_rating,
    AVG(m.tokens_used) as average_tokens_per_message,
    AVG(EXTRACT(EPOCH FROM m.processing_time)) as average_processing_time,
    ca.topics,
    ca.sentiment_score,
    c.created_at,
    c.updated_at
FROM llm_conversations c
JOIN llm_model_configs mc ON mc.id = c.model_config_id
LEFT JOIN llm_messages m ON m.conversation_id = c.id
LEFT JOIN ai_conversation_feedback f ON f.conversation_id = c.id
LEFT JOIN ai_conversation_analytics ca ON ca.conversation_id = c.id
GROUP BY c.id, c.user_id, c.model_config_id, mc.provider, mc.model_name, ca.topics, ca.sentiment_score;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_insights_id 
ON conversation_insights(conversation_id);

-- Create a scheduled job to refresh the materialized view daily
SELECT cron.schedule(
    'refresh-conversation-insights',
    '0 0 * * *',  -- Run at midnight every day
    $$SELECT refresh_conversation_insights()$$
); 