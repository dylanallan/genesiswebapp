/*
  # AI Service Configuration Setup

  1. New Tables
    - `ai_service_config`: Stores AI service configurations and API keys
      - `id` (uuid, primary key)
      - `service_name` (text, unique)
      - `api_key` (text, nullable)
      - `is_active` (boolean)
      - `config` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_service_config`
    - Add policy for admin access
    - Create secure functions for API key management

  3. Initial Data
    - Set up configurations for OpenAI, Gemini, and Anthropic
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

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage AI configuration" ON ai_service_config;

-- Create policy for admin access
CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

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