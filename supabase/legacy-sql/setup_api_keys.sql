-- WARNING: These are temporary keys that should be rotated immediately after setup
-- In production, use environment variables or a secure secret management system
-- DO NOT commit this file with real API keys to version control

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- First, verify and drop any existing objects
DO $$
BEGIN
    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS get_api_key(text) CASCADE;
    DROP FUNCTION IF EXISTS rotate_api_key(text, text) CASCADE;
    DROP FUNCTION IF EXISTS update_api_key_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS encrypt_api_key(text) CASCADE;
    DROP FUNCTION IF EXISTS decrypt_api_key(text) CASCADE;
    
    -- Drop the table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_key_management') THEN
        DROP TABLE api_key_management CASCADE;
    END IF;
END $$;

-- Create a custom configuration parameter for the encryption key
DO $$
BEGIN
    -- Check if the parameter exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_settings WHERE name = 'app.settings.encryption_key'
    ) THEN
        -- Create the parameter
        PERFORM set_config('app.settings.encryption_key', encode(gen_random_bytes(32), 'hex'), false);
    END IF;
END $$;

-- Create function to encrypt API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    encryption_key text;
BEGIN
    -- Get the encryption key from the custom parameter
    encryption_key := current_setting('app.settings.encryption_key');
    
    -- Encrypt the API key using AES-256-GCM
    RETURN encode(
        encrypt_iv(
            api_key::bytea,
            encryption_key::bytea,
            gen_random_bytes(12),  -- IV for GCM mode
            'aes-256-gcm'
        ),
        'hex'
    );
END;
$$;

-- Create function to decrypt API keys
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    encryption_key text;
BEGIN
    -- Get the encryption key from the custom parameter
    encryption_key := current_setting('app.settings.encryption_key');
    
    -- Decrypt the API key
    RETURN convert_from(
        decrypt_iv(
            decode(encrypted_key, 'hex'),
            encryption_key::bytea,
            substring(decode(encrypted_key, 'hex') from 1 for 12),  -- Extract IV
            'aes-256-gcm'
        ),
        'utf8'
    );
END;
$$;

-- Create API key management table
CREATE TABLE api_key_management (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name text NOT NULL UNIQUE,
    encrypted_key text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_used_at timestamptz,
    usage_count bigint DEFAULT 0,
    rate_limit integer,
    rate_limit_period interval,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT valid_provider CHECK (provider IN ('openai', 'anthropic', 'google'))
);

-- Verify table creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'api_key_management' 
        AND column_name = 'provider'
    ) THEN
        RAISE EXCEPTION 'Table api_key_management was not created properly';
    END IF;
END $$;

-- Insert API keys with proper rate limits
INSERT INTO api_key_management (
    key_name, 
    encrypted_key, 
    provider, 
    rate_limit, 
    rate_limit_period,
    metadata
) VALUES 
    (
        'openai_api_key',
        encrypt_api_key('OPENAI_API_KEY_HERE'),
        'openai',
        100,  -- Rate limit
        interval '1 minute',  -- Rate limit period
        jsonb_build_object(
            'model', 'gpt-4-turbo-preview',
            'organization', 'default'
        )
    ),
    (
        'anthropic_api_key',
        encrypt_api_key('ANTHROPIC_API_KEY_HERE'),
        'anthropic',
        100,  -- Rate limit
        interval '1 minute',  -- Rate limit period
        jsonb_build_object(
            'model', 'claude-3-opus-20240229',
            'version', '2023-06-01'
        )
    ),
    (
        'google_api_key',
        encrypt_api_key('GOOGLE_API_KEY_HERE'),
        'google',
        100,  -- Rate limit
        interval '1 minute',  -- Rate limit period
        jsonb_build_object(
            'model', 'gemini-pro',
            'client_id', '1097107540373-3c2pnab29djjn7fqnf36gk8sh3n8rdoi.apps.googleusercontent.com',
            'client_secret', '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'
        )
    );

-- Enable Row Level Security
ALTER TABLE api_key_management ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY admin_api_key_access ON api_key_management
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles
            WHERE user_id = auth.uid()
            AND role_name = 'admin'
        )
    );

-- Create function to get API key (for use in edge functions)
CREATE OR REPLACE FUNCTION get_api_key(key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    decrypted_key text;
    v_rate_limit integer;
    v_rate_limit_period interval;
    v_usage_count bigint;
BEGIN
    -- Check rate limits
    SELECT 
        rate_limit,
        rate_limit_period,
        usage_count
    INTO 
        v_rate_limit,
        v_rate_limit_period,
        v_usage_count
    FROM api_key_management
    WHERE key_name = get_api_key.key_name
    AND is_active = true;

    -- Verify rate limit
    IF v_usage_count >= v_rate_limit THEN
        -- Check if we're within the rate limit period
        IF EXISTS (
            SELECT 1 
            FROM api_key_management 
            WHERE key_name = get_api_key.key_name
            AND last_used_at > now() - v_rate_limit_period
        ) THEN
            RAISE EXCEPTION 'Rate limit exceeded for key %', key_name;
        END IF;
        
        -- Reset usage count if we're past the rate limit period
        UPDATE api_key_management
        SET usage_count = 0
        WHERE key_name = get_api_key.key_name;
    END IF;

    -- Get and decrypt the API key
    SELECT decrypt_api_key(encrypted_key)
    INTO decrypted_key
    FROM api_key_management
    WHERE key_name = get_api_key.key_name
    AND is_active = true;
    
    -- Update usage metrics
    UPDATE api_key_management
    SET 
        last_used_at = now(),
        usage_count = usage_count + 1
    WHERE key_name = get_api_key.key_name;
    
    RETURN decrypted_key;
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_api_key_management_key_name 
ON api_key_management(key_name);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_api_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_key_updated_at
    BEFORE UPDATE ON api_key_management
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_updated_at();

-- Create function to rotate API keys
CREATE OR REPLACE FUNCTION rotate_api_key(
    p_key_name text,
    p_new_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admins to rotate keys
    IF NOT EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role_name = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can rotate API keys';
    END IF;

    -- Update the key
    UPDATE api_key_management
    SET 
        encrypted_key = encrypt_api_key(p_new_key),
        updated_at = now(),
        usage_count = 0  -- Reset usage count
    WHERE key_name = p_key_name;
END;
$$;

-- Verify the setup
SELECT 
    key_name,
    provider,
    is_active,
    rate_limit,
    rate_limit_period,
    created_at,
    updated_at,
    jsonb_pretty(metadata) as metadata
FROM api_key_management
ORDER BY provider;

COMMIT; 