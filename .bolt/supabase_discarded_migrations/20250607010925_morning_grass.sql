-- Complete AI service configuration setup
-- This migration ensures all AI providers are properly configured

-- Update existing AI service configurations with comprehensive settings
INSERT INTO ai_service_config (service_name, config, is_active) VALUES
  ('openai-gpt4', jsonb_build_object(
    'type', 'openai',
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'models', ARRAY['gpt-4', 'gpt-4-turbo-preview', 'gpt-4-1106-preview'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'coding', 'business'],
    'costPerToken', 0.00003,
    'maxTokens', 8192,
    'priority', 1,
    'temperature', 0.7,
    'topP', 1,
    'frequencyPenalty', 0,
    'presencePenalty', 0
  ), true),
  ('openai-gpt35', jsonb_build_object(
    'type', 'openai',
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'models', ARRAY['gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    'capabilities', ARRAY['chat', 'analysis', 'generation'],
    'costPerToken', 0.000002,
    'maxTokens', 4096,
    'priority', 5,
    'temperature', 0.7,
    'topP', 1
  ), true),
  ('anthropic-claude', jsonb_build_object(
    'type', 'anthropic',
    'endpoint', 'https://api.anthropic.com/v1/messages',
    'models', ARRAY['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business', 'cultural'],
    'costPerToken', 0.000015,
    'maxTokens', 4096,
    'priority', 2,
    'temperature', 0.7
  ), true),
  ('google-gemini', jsonb_build_object(
    'type', 'google',
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'models', ARRAY['gemini-pro', 'gemini-pro-vision'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'cultural'],
    'costPerToken', 0.0000005,
    'maxTokens', 2048,
    'priority', 3,
    'temperature', 0.7,
    'topK', 40,
    'topP', 0.95
  ), true),
  ('google-gemini-15', jsonb_build_object(
    'type', 'google',
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    'models', ARRAY['gemini-1.5-pro'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'coding', 'business'],
    'costPerToken', 0.000001,
    'maxTokens', 8192,
    'priority', 2,
    'temperature', 0.7,
    'topK', 40,
    'topP', 0.95
  ), true),
  ('dylanallan-assistant', jsonb_build_object(
    'type', 'dylanallan',
    'endpoint', 'https://dylanallan.io/api/chat',
    'models', ARRAY['dylanallan-v1', 'dylanallan-business'],
    'capabilities', ARRAY['business', 'automation', 'consulting', 'strategy'],
    'costPerToken', 0.00001,
    'maxTokens', 4096,
    'priority', 1,
    'context', 'business_automation',
    'expertise', 'consulting'
  ), true),
  ('ollama-local', jsonb_build_object(
    'type', 'ollama',
    'endpoint', 'http://localhost:11434/api/generate',
    'models', ARRAY['llama2', 'codellama', 'mistral', 'neural-chat'],
    'capabilities', ARRAY['chat', 'coding', 'analysis'],
    'costPerToken', 0,
    'maxTokens', 4096,
    'priority', 6,
    'stream', true,
    'temperature', 0.7
  ), false),
  ('deepseek-coder', jsonb_build_object(
    'type', 'deepseek',
    'endpoint', 'https://api.deepseek.com/v1/chat/completions',
    'models', ARRAY['deepseek-coder', 'deepseek-chat'],
    'capabilities', ARRAY['coding', 'analysis', 'generation'],
    'costPerToken', 0.000001,
    'maxTokens', 4096,
    'priority', 2,
    'temperature', 0.3,
    'topP', 0.95
  ), true)
ON CONFLICT (service_name) DO UPDATE SET
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create function to get active AI providers
CREATE OR REPLACE FUNCTION get_active_ai_providers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', service_name,
      'name', config->>'name',
      'type', config->>'type',
      'capabilities', config->'capabilities',
      'priority', (config->>'priority')::integer,
      'isActive', is_active,
      'hasApiKey', (api_key IS NOT NULL)
    )
  ) INTO result
  FROM ai_service_config
  WHERE is_active = true
  ORDER BY (config->>'priority')::integer;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Create function to update provider status
CREATE OR REPLACE FUNCTION update_ai_provider_status(
  p_service_name text,
  p_is_active boolean,
  p_api_key text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT (SELECT exists(SELECT 1 FROM admin_roles WHERE user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can update AI provider status';
  END IF;

  UPDATE ai_service_config
  SET 
    is_active = p_is_active,
    api_key = COALESCE(p_api_key, api_key),
    updated_at = now()
  WHERE service_name = p_service_name;
END;
$$;

-- Create function to get provider performance metrics
CREATE OR REPLACE FUNCTION get_provider_performance_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(
    provider_id,
    jsonb_build_object(
      'total_requests', total_requests,
      'success_rate', success_rate,
      'avg_response_time', avg_response_time,
      'total_cost', total_cost
    )
  ) INTO result
  FROM (
    SELECT 
      provider_id,
      COUNT(*) as total_requests,
      ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END), 3) as success_rate,
      ROUND(AVG(response_time_ms)) as avg_response_time,
      ROUND(SUM(cost), 4) as total_cost
    FROM ai_request_logs
    WHERE created_at > now() - interval '7 days'
    GROUP BY provider_id
  ) metrics;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_active_ai_providers() TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_provider_status(text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_performance_summary() TO authenticated;