-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the api_key_management table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_key_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT,
    environment TEXT NOT NULL DEFAULT 'production',
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limits JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(service_name, environment)
);

-- Create the system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a function to handle API key setup
CREATE OR REPLACE FUNCTION setup_api_keys()
RETURNS void AS $$
DECLARE
    encryption_key text := 'genesis-heritage-secure-key-2024';
BEGIN
    -- Insert or update API keys in api_key_management
    INSERT INTO api_key_management (
        service_name,
        service_type,
        api_key,
        api_secret,
        environment,
        is_active,
        rate_limits,
        metadata
    ) VALUES
    (
        'openai',
        'llm',
        encrypt('OPENAI_API_KEY_HERE', encryption_key),
        NULL,
        'production',
        true,
        '{
            "requests_per_minute": 60,
            "tokens_per_minute": 90000
        }'::jsonb,
        '{
            "model": "gpt-4-turbo",
            "version": "2024-02-15"
        }'::jsonb
    ),
    (
        'anthropic',
        'llm',
        encrypt('ANTHROPIC_API_KEY_HERE', encryption_key),
        NULL,
        'production',
        true,
        '{
            "requests_per_minute": 60,
            "tokens_per_minute": 100000
        }'::jsonb,
        '{
            "model": "claude-3-opus",
            "version": "2024-02-29"
        }'::jsonb
    ),
    (
        'google-ai',
        'llm',
        encrypt('GOOGLE_API_KEY_HERE', encryption_key),
        NULL,
        'production',
        true,
        '{
            "requests_per_minute": 60,
            "tokens_per_minute": 120000
        }'::jsonb,
        '{
            "model": "gemini-pro",
            "version": "1.5"
        }'::jsonb
    ),
    (
        'google-oauth',
        'auth',
        encrypt('1097107540373-3c2pnab29djjn7fqnf36gk8sh3n8rdoi.apps.googleusercontent.com', encryption_key),
        encrypt('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', encryption_key),
        'production',
        true,
        '{
            "requests_per_minute": 120
        }'::jsonb,
        '{
            "type": "oauth2",
            "scopes": ["openid", "email", "profile"]
        }'::jsonb
    )
    ON CONFLICT (service_name, environment) 
    DO UPDATE SET
        api_key = EXCLUDED.api_key,
        api_secret = EXCLUDED.api_secret,
        is_active = EXCLUDED.is_active,
        rate_limits = EXCLUDED.rate_limits,
        metadata = EXCLUDED.metadata,
        updated_at = now();

    -- Set environment variables in Supabase
    PERFORM set_config('app.settings.openai_api_key', 'OPENAI_API_KEY_HERE', false);
    PERFORM set_config('app.settings.anthropic_api_key', 'ANTHROPIC_API_KEY_HERE', false);
    PERFORM set_config('app.settings.gemini_api_key', 'GOOGLE_API_KEY_HERE', false);
    PERFORM set_config('app.settings.google_client_id', '1097107540373-3c2pnab29djjn7fqnf36gk8sh3n8rdoi.apps.googleusercontent.com', false);
    PERFORM set_config('app.settings.google_client_secret', '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', false);

    -- Log the configuration update
    INSERT INTO system_logs (
        action,
        details,
        created_at
    ) VALUES (
        'api_keys_updated',
        '{
            "services": ["openai", "anthropic", "google-ai", "google-oauth"],
            "environment": "production",
            "timestamp": "' || now() || '"
        }'::jsonb,
        now()
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT setup_api_keys();

-- Verify the configuration
SELECT 
    service_name,
    environment,
    is_active,
    rate_limits,
    metadata
FROM api_key_management
WHERE environment = 'production'
ORDER BY service_name;

-- Note: Remove generic index creation statements as they use placeholder table names
-- These should be created in specific migration files for actual tables 