-- Setup AI Services Configuration

-- Insert initial AI service configurations
INSERT INTO ai_service_config (
  service_name,
  api_key,
  is_active,
  config
) VALUES
  (
    'openai',
    NULL, -- API key will be set via environment
    true,
    '{
      "default_model": "gpt-4-turbo",
      "max_tokens": 4096,
      "temperature": 0.7,
      "available_models": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
    }'::jsonb
  ),
  (
    'anthropic',
    NULL, -- API key will be set via environment
    true,
    '{
      "default_model": "claude-3-opus",
      "max_tokens": 4096,
      "temperature": 0.7,
      "available_models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
    }'::jsonb
  ),
  (
    'google',
    NULL, -- API key will be set via environment
    true,
    '{
      "default_model": "gemini-pro",
      "max_tokens": 4096,
      "temperature": 0.7,
      "available_models": ["gemini-pro", "gemini-pro-vision"]
    }'::jsonb
  )
ON CONFLICT (service_name) 
DO UPDATE SET
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create function to validate AI service configuration
CREATE OR REPLACE FUNCTION validate_ai_service_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate service name
  IF NEW.service_name NOT IN ('openai', 'anthropic', 'google') THEN
    RAISE EXCEPTION 'Invalid service name: %', NEW.service_name;
  END IF;

  -- Validate config structure
  IF NEW.config ? 'default_model' = false THEN
    RAISE EXCEPTION 'Missing default_model in config';
  END IF;

  IF NEW.config ? 'available_models' = false THEN
    RAISE EXCEPTION 'Missing available_models in config';
  END IF;

  -- Validate model is in available_models
  IF NOT (NEW.config->>'default_model') = ANY(
    ARRAY(SELECT jsonb_array_elements_text(NEW.config->'available_models'))
  ) THEN
    RAISE EXCEPTION 'Default model must be in available_models list';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AI service config validation
DROP TRIGGER IF EXISTS validate_ai_service_config_trigger ON ai_service_config;
CREATE TRIGGER validate_ai_service_config_trigger
  BEFORE INSERT OR UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION validate_ai_service_config();

-- Create function to get active AI services
CREATE OR REPLACE FUNCTION get_active_ai_services()
RETURNS TABLE (
  service_name text,
  default_model text,
  available_models text[],
  config jsonb
) LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    asc.service_name,
    asc.config->>'default_model' as default_model,
    ARRAY(
      SELECT jsonb_array_elements_text(asc.config->'available_models')
    ) as available_models,
    asc.config
  FROM ai_service_config asc
  WHERE asc.is_active = true
  AND asc.api_key IS NOT NULL;
END;
$$;

-- Create function to log AI service usage
CREATE OR REPLACE FUNCTION log_ai_service_usage(
  p_service_name text,
  p_model text,
  p_tokens_used integer,
  p_processing_time interval,
  p_success boolean,
  p_error_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_request_logs (
    service_name,
    model,
    tokens_used,
    processing_time,
    success,
    error_details
  ) VALUES (
    p_service_name,
    p_model,
    p_tokens_used,
    p_processing_time,
    p_success,
    p_error_details
  );
END;
$$; 