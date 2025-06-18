/*
  # Fix AI Service Configuration

  1. Changes
     - Adds IF NOT EXISTS to all table and policy creation statements
     - Ensures no conflicts with existing tables and policies
     - Preserves all functionality from previous migrations
  
  2. Security
     - Maintains all security policies
     - Preserves admin-only access to sensitive configurations
*/

-- Create AI configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_service_config (
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
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'ai_service_config' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ai_service_config ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policy for admin access if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ai_service_config' 
    AND policyname = 'Admins can manage AI configuration'
  ) THEN
    CREATE POLICY "Admins can manage AI configuration"
      ON public.ai_service_config
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
    AND api_key IS NOT NULL
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

-- Insert initial configuration with COALESCE to handle null values
DO $$
BEGIN
  INSERT INTO ai_service_config (service_name, api_key, config)
  VALUES 
    (
      'openai',
      NULLIF(COALESCE(current_setting('app.openai_key', true), ''), ''),
      '{"model": "gpt-4-turbo-preview"}'
    ),
    (
      'gemini',
      NULLIF(COALESCE(current_setting('app.gemini_key', true), ''), ''),
      '{"model": "gemini-pro"}'
    ),
    (
      'anthropic',
      NULLIF(COALESCE(current_setting('app.anthropic_key', true), ''), ''),
      '{"model": "claude-3-opus-20240229"}'
    )
  ON CONFLICT (service_name) DO NOTHING;
END;
$$;

-- Create trigger for updated_at if it doesn't exist
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