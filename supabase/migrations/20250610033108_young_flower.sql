/*
  # AI Service Configuration Functions

  1. Functions
    - `get_ai_service_config`: Function to retrieve AI service configuration
    - `update_ai_service_config`: Function to update AI service configuration
  
  2. Security
    - Functions are security definer to ensure proper access to sensitive configuration
*/

-- Create function to get AI service configuration
CREATE OR REPLACE FUNCTION get_ai_service_config(
  p_service_name text
)
RETURNS TABLE (
  service_name text,
  is_active boolean,
  config jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    asc.service_name,
    asc.is_active,
    asc.config
  FROM ai_service_config asc
  WHERE asc.service_name = p_service_name;
END;
$$;

-- Create function to update AI service configuration
CREATE OR REPLACE FUNCTION update_ai_service_config(
  p_service_name text,
  p_is_active boolean,
  p_config jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_service_config (
    service_name,
    is_active,
    config,
    updated_at
  )
  VALUES (
    p_service_name,
    p_is_active,
    p_config,
    now()
  )
  ON CONFLICT (service_name)
  DO UPDATE SET
    is_active = p_is_active,
    config = p_config,
    updated_at = now();
    
  -- Log the configuration change
  INSERT INTO system_health_metrics (
    metric_name,
    metric_value,
    metadata
  ) VALUES (
    'ai_config_update',
    1,
    jsonb_build_object(
      'service_name', p_service_name,
      'is_active', p_is_active,
      'timestamp', now()
    )
  );
END;
$$;

-- Create function to get available AI models
CREATE OR REPLACE FUNCTION get_available_ai_models()
RETURNS TABLE (
  id uuid,
  name text,
  version text,
  capabilities text[],
  context_window integer,
  api_endpoint text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.version,
    m.capabilities,
    m.context_window,
    m.api_endpoint
  FROM ai_models m
  JOIN ai_service_config asc ON m.name = asc.service_name
  WHERE asc.is_active = true;
END;
$$;