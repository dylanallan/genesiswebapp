/*
  # AI Service Configuration

  1. New Features
    - Create AI service configuration table if it doesn't exist
    - Add secure functions for managing API keys
    - Insert initial configuration with environment variables
  
  2. Security
    - Enable RLS on the table
    - Create admin-only access policy if it doesn't exist
    - Add secure function to get API keys
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

-- Enable RLS
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (only if it doesn't exist)
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

-- Create trigger for updating timestamps
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
EXCEPTION
  WHEN undefined_function THEN
    -- Create the function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Then create the trigger
    CREATE TRIGGER update_ai_service_config_updated_at
      BEFORE UPDATE ON ai_service_config
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
END
$$;

-- Insert initial configuration (safely)
DO $$
DECLARE
  openai_key text;
  gemini_key text;
  anthropic_key text;
BEGIN
  -- Try to get keys from environment, use empty string if not available
  BEGIN
    openai_key := current_setting('app.openai_key', true);
  EXCEPTION WHEN OTHERS THEN
    openai_key := '';
  END;
  
  BEGIN
    gemini_key := current_setting('app.gemini_key', true);
  EXCEPTION WHEN OTHERS THEN
    gemini_key := '';
  END;
  
  BEGIN
    anthropic_key := current_setting('app.anthropic_key', true);
  EXCEPTION WHEN OTHERS THEN
    anthropic_key := '';
  END;

  -- Insert configurations if they don't exist
  INSERT INTO ai_service_config (service_name, api_key, config)
  VALUES 
    ('openai', openai_key, '{"model": "gpt-4-turbo-preview"}')
  ON CONFLICT (service_name) DO NOTHING;
  
  INSERT INTO ai_service_config (service_name, api_key, config)
  VALUES 
    ('gemini', gemini_key, '{"model": "gemini-pro"}')
  ON CONFLICT (service_name) DO NOTHING;
  
  INSERT INTO ai_service_config (service_name, api_key, config)
  VALUES 
    ('anthropic', anthropic_key, '{"model": "claude-3-opus-20240229"}')
  ON CONFLICT (service_name) DO NOTHING;
END
$$;