/*
  # AI Service Configuration Migration

  1. New Tables
    - `ai_service_config`
      - `id` (uuid, primary key)
      - `service_name` (text, unique)
      - `api_key` (text)
      - `is_active` (boolean)
      - `config` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_service_config` table
    - Add admin-only policy for AI configuration management

  3. Functions
    - `get_ai_api_key()` - Securely retrieve API keys
    - `update_ai_service_config()` - Admin function to update configuration

  4. Initial Data
    - Default AI service configurations for OpenAI, Gemini, and Anthropic
*/

-- Create AI configuration table
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'ai_service_config' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all possible policy variations
  DROP POLICY IF EXISTS "Admins can manage AI configuration" ON ai_service_config;
  DROP POLICY IF EXISTS "Admin can manage AI configuration" ON ai_service_config;
  DROP POLICY IF EXISTS "Admins can access AI configuration" ON ai_service_config;
  DROP POLICY IF EXISTS "Admin access to AI configuration" ON ai_service_config;
  DROP POLICY IF EXISTS "ai_service_config_admin_policy" ON ai_service_config;
EXCEPTION
  WHEN undefined_object THEN
    -- Policy doesn't exist, continue
    NULL;
END $$;

-- Create admin-only policy
CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to securely get API key
CREATE OR REPLACE FUNCTION get_ai_api_key(service text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_value text;
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT api_key INTO key_value
  FROM ai_service_config
  WHERE service_name = service
  AND is_active = true;

  RETURN key_value;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL;
  WHEN OTHERS THEN
    -- Log error but don't expose details
    RAISE NOTICE 'Error retrieving API key for service: %', service;
    RETURN NULL;
END;
$$;

-- Create function to update AI service config
CREATE OR REPLACE FUNCTION update_ai_service_config(
  p_service_name text,
  p_api_key text DEFAULT NULL,
  p_config jsonb DEFAULT '{}'::jsonb,
  p_is_active boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin (check both admin_roles table and JWT)
  IF NOT (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    EXISTS(SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only administrators can update AI configuration';
  END IF;

  -- Validate service name
  IF p_service_name IS NULL OR trim(p_service_name) = '' THEN
    RAISE EXCEPTION 'Service name cannot be empty';
  END IF;

  -- Insert or update configuration
  INSERT INTO ai_service_config (
    service_name,
    api_key,
    config,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    trim(p_service_name),
    p_api_key,
    COALESCE(p_config, '{}'::jsonb),
    p_is_active,
    now(),
    now()
  )
  ON CONFLICT (service_name) 
  DO UPDATE SET
    api_key = CASE 
      WHEN p_api_key IS NOT NULL THEN p_api_key 
      ELSE ai_service_config.api_key 
    END,
    config = COALESCE(p_config, ai_service_config.config),
    is_active = p_is_active,
    updated_at = now();

  -- Log the configuration update
  RAISE NOTICE 'AI service configuration updated for: %', p_service_name;
END;
$$;

-- Create function to list available AI services
CREATE OR REPLACE FUNCTION get_ai_services()
RETURNS TABLE(
  service_name text,
  is_active boolean,
  has_api_key boolean,
  config jsonb,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    EXISTS(SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only administrators can view AI service configuration';
  END IF;

  RETURN QUERY
  SELECT 
    ais.service_name,
    ais.is_active,
    (ais.api_key IS NOT NULL AND trim(ais.api_key) != '') as has_api_key,
    ais.config,
    ais.updated_at
  FROM ai_service_config ais
  ORDER BY ais.service_name;
END;
$$;

-- Create function to toggle AI service status
CREATE OR REPLACE FUNCTION toggle_ai_service(
  p_service_name text,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    EXISTS(SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only administrators can toggle AI services';
  END IF;

  UPDATE ai_service_config
  SET 
    is_active = p_is_active,
    updated_at = now()
  WHERE service_name = p_service_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI service not found: %', p_service_name;
  END IF;

  RAISE NOTICE 'AI service % %', p_service_name, 
    CASE WHEN p_is_active THEN 'enabled' ELSE 'disabled' END;
END;
$$;

-- Insert initial AI service configurations
DO $$
BEGIN
  -- OpenAI Configuration
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'openai-gpt4',
    NULL, -- API key will be set via admin interface
    jsonb_build_object(
      'model', 'gpt-4-turbo-preview',
      'max_tokens', 4000,
      'temperature', 0.7,
      'capabilities', ARRAY['chat', 'analysis', 'coding', 'creative'],
      'cost_per_token', 0.00003,
      'priority', 1
    ),
    false -- Disabled by default until API key is configured
  )
  ON CONFLICT (service_name) DO NOTHING;

  -- Google Gemini Configuration
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'google-gemini',
    NULL,
    jsonb_build_object(
      'model', 'gemini-pro',
      'max_tokens', 2000,
      'temperature', 0.7,
      'capabilities', ARRAY['chat', 'analysis', 'research'],
      'cost_per_token', 0.0000005,
      'priority', 3
    ),
    false
  )
  ON CONFLICT (service_name) DO NOTHING;

  -- Anthropic Claude Configuration
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'anthropic-claude',
    NULL,
    jsonb_build_object(
      'model', 'claude-3-opus-20240229',
      'max_tokens', 4000,
      'temperature', 0.7,
      'capabilities', ARRAY['chat', 'analysis', 'cultural', 'creative'],
      'cost_per_token', 0.000075,
      'priority', 1
    ),
    false
  )
  ON CONFLICT (service_name) DO NOTHING;

  -- DylanAllan.io Business Consultant
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'dylanallan-business',
    NULL,
    jsonb_build_object(
      'endpoint', 'https://dylanallan.io/api/chat',
      'capabilities', ARRAY['business', 'automation', 'consulting'],
      'cost_per_token', 0.00001,
      'priority', 1,
      'timeout', 15000
    ),
    true -- Can be active without API key (uses public endpoint)
  )
  ON CONFLICT (service_name) DO NOTHING;

  -- DeepSeek Coder Configuration
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'deepseek-coder',
    NULL,
    jsonb_build_object(
      'model', 'deepseek-coder',
      'max_tokens', 4000,
      'temperature', 0.1,
      'capabilities', ARRAY['coding', 'technical', 'debugging'],
      'cost_per_token', 0.000001,
      'priority', 1
    ),
    false
  )
  ON CONFLICT (service_name) DO NOTHING;

  -- Perplexity Research Configuration
  INSERT INTO ai_service_config (service_name, api_key, config, is_active)
  VALUES (
    'perplexity-sonar',
    NULL,
    jsonb_build_object(
      'model', 'sonar-large-32k-chat',
      'max_tokens', 4000,
      'temperature', 0.7,
      'capabilities', ARRAY['research', 'analysis', 'current-info'],
      'cost_per_token', 0.000006,
      'priority', 2,
      'search_enabled', true
    ),
    false
  )
  ON CONFLICT (service_name) DO NOTHING;

  RAISE NOTICE 'AI service configurations initialized successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error initializing AI configurations: %', SQLERRM;
END $$;