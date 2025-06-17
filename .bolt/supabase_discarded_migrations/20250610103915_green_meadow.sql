/*
  # Fix AI Service Configuration

  1. New Tables
    - Ensures `ai_service_config` table exists
  2. Security
    - Adds RLS policy if not exists
  3. Functions
    - Creates secure functions for API key management
*/

-- Create AI configuration table if not exists
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
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and recreate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_service_config' 
    AND policyname = 'Admins can manage AI configuration'
  ) THEN
    CREATE POLICY "Admins can manage AI configuration"
      ON ai_service_config
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;
END
$$;

-- Create function to securely get API key
CREATE OR REPLACE FUNCTION get_ai_api_key(service text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT api_key
    FROM ai_service_config
    WHERE service_name = service
    AND is_active = true
  );
END;
$$;

-- Create function to update AI service config
CREATE OR REPLACE FUNCTION update_ai_service_config(
  p_service_name text,
  p_api_key text,
  p_config jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT exists(SELECT 1 FROM admin_roles WHERE user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can update AI configuration';
  END IF;

  INSERT INTO ai_service_config (
    service_name,
    api_key,
    config
  )
  VALUES (
    p_service_name,
    p_api_key,
    p_config
  )
  ON CONFLICT (service_name) 
  DO UPDATE SET
    api_key = EXCLUDED.api_key,
    config = EXCLUDED.config,
    updated_at = now();
END;
$$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_service_config_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_service_config_updated_at
      BEFORE UPDATE ON ai_service_config
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Insert initial configuration if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_service_config WHERE service_name = 'openai') THEN
    INSERT INTO ai_service_config (service_name, api_key, config)
    VALUES ('openai', NULL, '{"model": "gpt-4-turbo-preview"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM ai_service_config WHERE service_name = 'gemini') THEN
    INSERT INTO ai_service_config (service_name, api_key, config)
    VALUES ('gemini', NULL, '{"model": "gemini-pro"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM ai_service_config WHERE service_name = 'anthropic') THEN
    INSERT INTO ai_service_config (service_name, api_key, config)
    VALUES ('anthropic', NULL, '{"model": "claude-3-opus-20240229"}');
  END IF;
END
$$;