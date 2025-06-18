-- Verify and fix LLM setup
DO $$
BEGIN
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;

    -- Drop any problematic indexes first
    DO $$
    BEGIN
        -- Drop indexes if they exist
        DROP INDEX IF EXISTS idx_llm_conversations_context;
        DROP INDEX IF EXISTS idx_llm_conversations_metadata;
        DROP INDEX IF EXISTS idx_llm_messages_content;
        DROP INDEX IF EXISTS idx_llm_messages_metadata;
    EXCEPTION
        WHEN undefined_table THEN
            NULL; -- Ignore if table doesn't exist
    END $$;

    -- 1. Verify API keys are properly set up
    DO $$
    DECLARE
        v_count integer;
    BEGIN
        SELECT COUNT(*) INTO v_count
        FROM api_key_management
        WHERE provider IN ('openai', 'anthropic', 'google')
        AND is_active = true;

        IF v_count < 3 THEN
            RAISE EXCEPTION 'Missing or inactive API keys. Please ensure all API keys are set up.';
        END IF;
    END $$;

    -- 2. Verify model configurations
    DO $$
    DECLARE
        v_count integer;
    BEGIN
        SELECT COUNT(*) INTO v_count
        FROM llm_model_configs
        WHERE provider IN ('openai', 'anthropic', 'google')
        AND is_active = true;

        IF v_count < 3 THEN
            -- Insert missing model configurations
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
            )
            SELECT 
                provider,
                CASE 
                    WHEN provider = 'openai' THEN 'gpt-4-turbo-preview'
                    WHEN provider = 'anthropic' THEN 'claude-3-opus-20240229'
                    WHEN provider = 'google' THEN 'gemini-pro'
                END as model_name,
                id as api_key_id,
                CASE 
                    WHEN provider = 'openai' THEN jsonb_build_object(
                        'max_tokens', 4096,
                        'temperature', 0.7,
                        'top_p', 1,
                        'frequency_penalty', 0,
                        'presence_penalty', 0
                    )
                    WHEN provider = 'anthropic' THEN jsonb_build_object(
                        'max_tokens', 4096,
                        'temperature', 0.7,
                        'top_p', 1,
                        'anthropic_version', '2023-06-01'
                    )
                    WHEN provider = 'google' THEN jsonb_build_object(
                        'max_tokens', 2048,
                        'temperature', 0.7,
                        'top_p', 1,
                        'top_k', 40
                    )
                END as configuration,
                CASE 
                    WHEN provider = 'openai' THEN ARRAY['chat', 'completion', 'analysis', 'summarization', 'code']
                    WHEN provider = 'anthropic' THEN ARRAY['chat', 'completion', 'analysis', 'summarization']
                    WHEN provider = 'google' THEN ARRAY['chat', 'completion', 'analysis']
                END as capabilities,
                CASE 
                    WHEN provider = 'openai' THEN 128000
                    WHEN provider = 'anthropic' THEN 200000
                    WHEN provider = 'google' THEN 32768
                END as context_window,
                CASE 
                    WHEN provider = 'openai' THEN 4096
                    WHEN provider = 'anthropic' THEN 4096
                    WHEN provider = 'google' THEN 2048
                END as max_tokens,
                0.7 as temperature,
                true as is_active
            FROM api_key_management
            WHERE provider IN ('openai', 'anthropic', 'google')
            AND is_active = true
            AND NOT EXISTS (
                SELECT 1 
                FROM llm_model_configs 
                WHERE llm_model_configs.provider = api_key_management.provider
                AND llm_model_configs.is_active = true
            );
        END IF;
    END $$;

    -- 3. Verify conversation tables
    DO $$
    BEGIN
        -- Create or modify llm_conversations
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'llm_conversations') THEN
            CREATE TABLE llm_conversations (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
                model_config_id uuid REFERENCES llm_model_configs(id) ON DELETE CASCADE,
                session_id text NOT NULL,
                context jsonb,
                status text DEFAULT 'active',
                metadata jsonb DEFAULT '{}'::jsonb,
                created_at timestamptz DEFAULT now(),
                updated_at timestamptz DEFAULT now()
            );
        END IF;

        -- Create or modify llm_messages
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'llm_messages') THEN
            CREATE TABLE llm_messages (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id uuid REFERENCES llm_conversations(id) ON DELETE CASCADE,
                role text NOT NULL,
                content text NOT NULL,
                tokens_used integer,
                processing_time interval,
                metadata jsonb DEFAULT '{}'::jsonb,
                created_at timestamptz DEFAULT now()
            );
        END IF;

        -- Create or replace indexes with appropriate operator classes
        -- For llm_conversations
        DROP INDEX IF EXISTS idx_llm_conversations_user;
        CREATE INDEX IF NOT EXISTS idx_llm_conversations_user ON llm_conversations(user_id);
        
        DROP INDEX IF EXISTS idx_llm_conversations_session;
        CREATE INDEX IF NOT EXISTS idx_llm_conversations_session ON llm_conversations(session_id);
        
        DROP INDEX IF EXISTS idx_llm_conversations_context;
        CREATE INDEX IF NOT EXISTS idx_llm_conversations_context ON llm_conversations USING gin (context jsonb_path_ops);
        
        DROP INDEX IF EXISTS idx_llm_conversations_metadata;
        CREATE INDEX IF NOT EXISTS idx_llm_conversations_metadata ON llm_conversations USING gin (metadata jsonb_path_ops);
        
        -- For llm_messages
        DROP INDEX IF EXISTS idx_llm_messages_conversation;
        CREATE INDEX IF NOT EXISTS idx_llm_messages_conversation ON llm_messages(conversation_id);
        
        DROP INDEX IF EXISTS idx_llm_messages_created;
        CREATE INDEX IF NOT EXISTS idx_llm_messages_created ON llm_messages(created_at);
        
        DROP INDEX IF EXISTS idx_llm_messages_content;
        CREATE INDEX IF NOT EXISTS idx_llm_messages_content ON llm_messages USING gin (to_tsvector('english', content));
        
        DROP INDEX IF EXISTS idx_llm_messages_metadata;
        CREATE INDEX IF NOT EXISTS idx_llm_messages_metadata ON llm_messages USING gin (metadata jsonb_path_ops);
        
        -- Enable RLS if not already enabled
        ALTER TABLE llm_conversations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE llm_messages ENABLE ROW LEVEL SECURITY;
        
        -- Create or replace policies
        DROP POLICY IF EXISTS "Users can manage their own conversations" ON llm_conversations;
        CREATE POLICY "Users can manage their own conversations"
            ON llm_conversations
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can view messages in their conversations" ON llm_messages;
        CREATE POLICY "Users can view messages in their conversations"
            ON llm_messages
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM llm_conversations
                    WHERE llm_conversations.id = llm_messages.conversation_id
                    AND llm_conversations.user_id = auth.uid()
                )
            );
    END $$;

    -- 4. Verify edge functions
    DO $$
    BEGIN
        -- Create or replace process_chat_message function
        CREATE OR REPLACE FUNCTION process_chat_message(
            p_conversation_id uuid,
            p_content text,
            p_role text DEFAULT 'user'
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            v_conversation llm_conversations;
            v_model_config llm_model_configs;
            v_api_key text;
            v_response jsonb;
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
            WHERE id = v_conversation.model_config_id
            AND is_active = true;

            IF v_model_config IS NULL THEN
                RAISE EXCEPTION 'Model configuration not found or inactive';
            END IF;

            -- Get API key
            v_api_key := get_api_key(
                CASE v_model_config.provider
                    WHEN 'openai' THEN 'openai_api_key'
                    WHEN 'anthropic' THEN 'anthropic_api_key'
                    WHEN 'google' THEN 'google_api_key'
                END
            );

            -- Record start time
            v_start_time := now();

            -- Process message based on provider
            CASE v_model_config.provider
                WHEN 'openai' THEN
                    -- Process OpenAI request
                    v_response := process_openai_request(
                        v_api_key,
                        p_content,
                        v_model_config.configuration
                    );
                WHEN 'anthropic' THEN
                    -- Process Anthropic request
                    v_response := process_anthropic_request(
                        v_api_key,
                        p_content,
                        v_model_config.configuration
                    );
                WHEN 'google' THEN
                    -- Process Google request
                    v_response := process_google_request(
                        v_api_key,
                        p_content,
                        v_model_config.configuration
                    );
                ELSE
                    RAISE EXCEPTION 'Unsupported provider: %', v_model_config.provider;
            END CASE;

            -- Insert user message
            INSERT INTO llm_messages (
                conversation_id,
                role,
                content,
                metadata
            ) VALUES (
                p_conversation_id,
                p_role,
                p_content,
                jsonb_build_object(
                    'provider', v_model_config.provider,
                    'model', v_model_config.model_name
                )
            );

            -- Insert assistant response
            INSERT INTO llm_messages (
                conversation_id,
                role,
                content,
                tokens_used,
                processing_time,
                metadata
            ) VALUES (
                p_conversation_id,
                'assistant',
                v_response->>'content',
                (v_response->>'tokens_used')::integer,
                now() - v_start_time,
                jsonb_build_object(
                    'provider', v_model_config.provider,
                    'model', v_model_config.model_name,
                    'response_metadata', v_response->'metadata'
                )
            );

            -- Update conversation
            UPDATE llm_conversations
            SET 
                updated_at = now(),
                context = COALESCE(context, '{}'::jsonb) || jsonb_build_object(
                    'last_message_at', now(),
                    'message_count', COALESCE((context->>'message_count')::integer, 0) + 2
                )
            WHERE id = p_conversation_id;

            RETURN v_response;
        END;
        $$;

        -- Create or replace process_openai_request function
        CREATE OR REPLACE FUNCTION process_openai_request(
            p_api_key text,
            p_content text,
            p_config jsonb
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            v_response jsonb;
        BEGIN
            -- This is a placeholder. In a real implementation, you would make an HTTP request to OpenAI's API
            -- For now, we'll return a mock response
            v_response := jsonb_build_object(
                'content', 'This is a mock response from OpenAI. Please implement the actual API call.',
                'tokens_used', 10,
                'metadata', jsonb_build_object(
                    'model', p_config->>'model',
                    'finish_reason', 'stop'
                )
            );
            
            RETURN v_response;
        END;
        $$;

        -- Create or replace process_anthropic_request function
        CREATE OR REPLACE FUNCTION process_anthropic_request(
            p_api_key text,
            p_content text,
            p_config jsonb
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            v_response jsonb;
        BEGIN
            -- This is a placeholder. In a real implementation, you would make an HTTP request to Anthropic's API
            -- For now, we'll return a mock response
            v_response := jsonb_build_object(
                'content', 'This is a mock response from Anthropic. Please implement the actual API call.',
                'tokens_used', 10,
                'metadata', jsonb_build_object(
                    'model', p_config->>'model',
                    'finish_reason', 'end_turn'
                )
            );
            
            RETURN v_response;
        END;
        $$;

        -- Create or replace process_google_request function
        CREATE OR REPLACE FUNCTION process_google_request(
            p_api_key text,
            p_content text,
            p_config jsonb
        )
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            v_response jsonb;
        BEGIN
            -- This is a placeholder. In a real implementation, you would make an HTTP request to Google's API
            -- For now, we'll return a mock response
            v_response := jsonb_build_object(
                'content', 'This is a mock response from Google. Please implement the actual API call.',
                'tokens_used', 10,
                'metadata', jsonb_build_object(
                    'model', p_config->>'model',
                    'finish_reason', 'STOP'
                )
            );
            
            RETURN v_response;
        END;
        $$;
    END $$;

    -- 5. Verify the setup
    RAISE NOTICE 'Verifying setup...';
    
    -- API Keys
    RAISE NOTICE 'API Keys: %', (
        SELECT string_agg(provider, ', ')
        FROM api_key_management
        WHERE provider IN ('openai', 'anthropic', 'google')
        AND is_active = true
    );
    
    -- Model Configurations
    RAISE NOTICE 'Model Configurations: %', (
        SELECT string_agg(provider || ' (' || model_name || ')', ', ')
        FROM llm_model_configs
        WHERE provider IN ('openai', 'anthropic', 'google')
        AND is_active = true
    );
    
    -- Tables
    RAISE NOTICE 'Tables: %', (
        SELECT string_agg(tablename, ', ')
        FROM pg_tables
        WHERE tablename IN ('llm_conversations', 'llm_messages')
    );
    
    -- Functions
    RAISE NOTICE 'Functions: %', (
        SELECT string_agg(proname, ', ')
        FROM pg_proc
        WHERE proname IN ('process_chat_message', 'process_openai_request', 'process_anthropic_request', 'process_google_request')
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during setup: %', SQLERRM;
END $$; 