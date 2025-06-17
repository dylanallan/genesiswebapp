-- Create AI service configuration table with enhanced features
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

-- Create policy for admin access
CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Insert AI service configurations
INSERT INTO ai_service_config (service_name, config) VALUES
  ('openai-gpt4', jsonb_build_object(
    'type', 'openai',
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'models', ARRAY['gpt-4', 'gpt-4-turbo-preview'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'coding', 'business'],
    'costPerToken', 0.00003,
    'maxTokens', 8192,
    'priority', 1
  )),
  ('anthropic-claude', jsonb_build_object(
    'type', 'anthropic',
    'endpoint', 'https://api.anthropic.com/v1/messages',
    'models', ARRAY['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business', 'cultural'],
    'costPerToken', 0.000015,
    'maxTokens', 4096,
    'priority', 2
  )),
  ('google-gemini', jsonb_build_object(
    'type', 'google',
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'models', ARRAY['gemini-pro', 'gemini-pro-vision'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'cultural'],
    'costPerToken', 0.0000005,
    'maxTokens', 2048,
    'priority', 3
  )),
  ('dylanallan-assistant', jsonb_build_object(
    'type', 'dylanallan',
    'endpoint', 'https://dylanallan.io/api/chat',
    'models', ARRAY['dylanallan-v1'],
    'capabilities', ARRAY['business', 'automation', 'consulting', 'strategy'],
    'costPerToken', 0.00001,
    'maxTokens', 4096,
    'priority', 4
  ))
ON CONFLICT (service_name) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = now();

-- Create AI request logs table
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id text NOT NULL,
  request_type text,
  prompt_length integer,
  response_length integer,
  tokens_used integer,
  cost numeric,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for user access to their own logs
CREATE POLICY "Users can view their own AI request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for admin access to all logs
CREATE POLICY "Admins can view all AI request logs"
  ON ai_request_logs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create indexes for performance
CREATE INDEX idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX idx_ai_request_logs_created_at ON ai_request_logs(created_at);

-- Create function to log AI requests
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text,
  p_prompt_length integer,
  p_response_length integer,
  p_tokens_used integer,
  p_cost numeric,
  p_response_time_ms integer,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_request_logs (
    user_id,
    provider_id,
    request_type,
    prompt_length,
    response_length,
    tokens_used,
    cost,
    response_time_ms,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_provider_id,
    p_request_type,
    p_prompt_length,
    p_response_length,
    p_tokens_used,
    p_cost,
    p_response_time_ms,
    p_success,
    p_error_message
  );
END;
$$;

-- Create function to get AI provider performance metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'success_rate', ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END), 3),
    'avg_response_time_ms', ROUND(AVG(response_time_ms)),
    'total_tokens_used', SUM(tokens_used),
    'total_cost', ROUND(SUM(cost), 4),
    'avg_cost_per_request', ROUND(AVG(cost), 6)
  ) INTO result
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
  AND created_at > now() - (p_days || ' days')::interval;

  RETURN result;
END;
$$;

-- Create updated_at trigger
CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();