-- Update all API keys in the system
DO $$
DECLARE
    v_openai_key text := 'OPENAI_API_KEY_HERE';
    v_anthropic_key text := 'ANTHROPIC_API_KEY_HERE';
    v_google_key text := 'GOOGLE_API_KEY_HERE';
    v_google_client_id text := '1097107540373-3c2pnab29djjn7fqnf36gk8sh3n8rdoi.apps.googleusercontent.com';
    v_google_client_secret text := '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';
BEGIN
    -- Update api_key_management table
    UPDATE api_key_management 
    SET 
        encrypted_key = encrypt_api_key(v_openai_key),
        updated_at = now(),
        metadata = jsonb_build_object(
            'model', 'gpt-4-turbo-preview',
            'organization', 'default'
        )
    WHERE key_name = 'openai_api_key';

    UPDATE api_key_management 
    SET 
        encrypted_key = encrypt_api_key(v_anthropic_key),
        updated_at = now(),
        metadata = jsonb_build_object(
            'model', 'claude-3-opus-20240229',
            'version', '2023-06-01'
        )
    WHERE key_name = 'anthropic_api_key';

    UPDATE api_key_management 
    SET 
        encrypted_key = encrypt_api_key(v_google_key),
        updated_at = now(),
        metadata = jsonb_build_object(
            'model', 'gemini-pro',
            'client_id', v_google_client_id,
            'client_secret', v_google_client_secret
        )
    WHERE key_name = 'google_api_key';

    -- Update ai_service_config table
    UPDATE ai_service_config 
    SET 
        api_key = v_openai_key,
        config = jsonb_build_object(
            'model', 'gpt-4-turbo-preview',
            'temperature', 0.7,
            'streamingSupported', true
        ),
        updated_at = now()
    WHERE service_name = 'openai';

    UPDATE ai_service_config 
    SET 
        api_key = v_anthropic_key,
        config = jsonb_build_object(
            'model', 'claude-3-opus-20240229',
            'temperature', 0.7,
            'streamingSupported', true
        ),
        updated_at = now()
    WHERE service_name = 'anthropic';

    UPDATE ai_service_config 
    SET 
        api_key = v_google_key,
        config = jsonb_build_object(
            'model', 'gemini-pro',
            'temperature', 0.7,
            'streamingSupported', true
        ),
        updated_at = now()
    WHERE service_name = 'google-ai';

    -- Update environment variables
    PERFORM set_config('app.settings.openai_api_key', v_openai_key, false);
    PERFORM set_config('app.settings.anthropic_api_key', v_anthropic_key, false);
    PERFORM set_config('app.settings.gemini_api_key', v_google_key, false);
    PERFORM set_config('app.settings.google_client_id', v_google_client_id, false);
    PERFORM set_config('app.settings.google_client_secret', v_google_client_secret, false);

    -- Log the update
    INSERT INTO system_logs (
        action,
        details,
        created_at
    ) VALUES (
        'api_keys_updated',
        jsonb_build_object(
            'services', ARRAY['openai', 'anthropic', 'google-ai', 'google-oauth'],
            'environment', 'production',
            'timestamp', now()
        ),
        now()
    );

    -- Verify the updates
    RAISE NOTICE 'API keys have been updated. Please verify the following:';
    RAISE NOTICE '1. api_key_management table';
    RAISE NOTICE '2. ai_service_config table';
    RAISE NOTICE '3. Environment variables';
END $$;

-- Verify the updates
SELECT 
    'api_key_management' as table_name,
    key_name,
    provider,
    is_active,
    updated_at,
    jsonb_pretty(metadata) as metadata
FROM api_key_management
UNION ALL
SELECT 
    'ai_service_config' as table_name,
    service_name as key_name,
    'N/A' as provider,
    is_active,
    updated_at,
    jsonb_pretty(config) as metadata
FROM ai_service_config
ORDER BY table_name, key_name; 