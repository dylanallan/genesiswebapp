/*
  # AI Router System Tables

  1. New Tables
    - `ai_service_config` - Configuration for AI service providers
    - `ai_request_logs` - Logs of AI requests and responses
    - `ai_router_metrics` - Performance metrics for the AI router
    - `ai_fallback_responses` - Fallback responses for when AI services are unavailable
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
  
  3. Functions
    - Add function to get AI provider metrics
*/

-- AI Service Configuration
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage AI configuration
CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- AI Request Logs
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
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

-- Admins can view all AI request logs
CREATE POLICY "Admins can view all AI request logs"
  ON ai_request_logs
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- Users can view their own AI request logs
CREATE POLICY "Users can view their own AI request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Router Metrics
CREATE TABLE IF NOT EXISTS ai_router_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  success_rate numeric,
  avg_response_time numeric,
  cost_per_1k_tokens numeric,
  reliability_score numeric,
  total_requests integer,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_router_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can view all AI router metrics
CREATE POLICY "Admins can view all AI router metrics"
  ON ai_router_metrics
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- AI Fallback Responses
CREATE TABLE IF NOT EXISTS ai_fallback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_fallback_responses ENABLE ROW LEVEL SECURITY;

-- Admins can manage fallback responses
CREATE POLICY "Admins can manage fallback responses"
  ON ai_fallback_responses
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_router_metrics_provider_id ON ai_router_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_router_metrics_timestamp ON ai_router_metrics(timestamp);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_fallback_responses_updated_at
  BEFORE UPDATE ON ai_fallback_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log AI request
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text,
  p_prompt_length integer,
  p_response_length integer,
  p_tokens_used integer,
  p_cost numeric,
  p_response_time_ms integer,
  p_success boolean,
  p_error_message text DEFAULT NULL
) RETURNS void
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
    error_message,
    created_at
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
    p_error_message,
    now()
  );
END;
$$;

-- Function to get AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  WITH metrics AS (
    SELECT
      provider_id,
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE success) AS successful_requests,
      AVG(response_time_ms) AS avg_response_time,
      SUM(tokens_used) AS total_tokens,
      SUM(cost) AS total_cost
    FROM ai_request_logs
    WHERE 
      provider_id = p_provider_id
      AND created_at >= (now() - (p_days || ' days')::interval)
    GROUP BY provider_id
  )
  SELECT 
    json_build_object(
      'provider_id', provider_id,
      'total_requests', total_requests,
      'success_rate', CASE WHEN total_requests > 0 THEN successful_requests::float / total_requests ELSE 1 END,
      'avg_response_time', avg_response_time,
      'total_tokens', total_tokens,
      'total_cost', total_cost,
      'time_period', p_days || ' days'
    ) INTO v_result
  FROM metrics;
  
  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- Insert default AI service configurations
INSERT INTO ai_service_config (service_name, is_active, config)
VALUES 
  ('openai', true, '{"default_model": "gpt-4-turbo-preview", "temperature": 0.7, "max_tokens": 2000}'),
  ('anthropic', true, '{"default_model": "claude-3-opus-20240229", "temperature": 0.7, "max_tokens": 2000}'),
  ('google', true, '{"default_model": "gemini-pro", "temperature": 0.7, "max_tokens": 2000}')
ON CONFLICT (service_name) DO NOTHING;

-- Insert default fallback responses
INSERT INTO ai_fallback_responses (response_type, content)
VALUES 
  ('default', 'I''m currently experiencing connectivity issues with our AI providers, but I can still help you with basic guidance. Please try your request again in a moment, or refresh the page if issues persist.'),
  ('business', 'I understand you''re looking for business optimization guidance. While I''m experiencing connectivity issues, I can suggest starting with documenting your current workflows and identifying repetitive tasks that could be automated. Please try again in a moment for more detailed assistance.'),
  ('cultural', 'I understand you''re interested in cultural heritage exploration. While I''m experiencing connectivity issues, I can suggest starting with documenting family stories and traditions. Please try again in a moment for more detailed assistance.')
ON CONFLICT DO NOTHING;