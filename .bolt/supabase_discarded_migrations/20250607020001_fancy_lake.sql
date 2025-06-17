/*
  # Enhanced AI Routing System Migration

  1. New Tables
    - Enhanced ai_service_config with performance tracking
    - ai_request_logs with detailed metrics
    - ai_provider_metrics for performance analysis
    
  2. Functions
    - log_ai_request for request tracking
    - get_ai_provider_metrics for performance analysis
    - update_provider_performance for real-time metrics
    
  3. Security
    - RLS policies for admin and user access
    - Performance monitoring and circuit breaker support
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage AI configuration" ON ai_service_config;
DROP POLICY IF EXISTS "Users can view their own AI request logs" ON ai_request_logs;
DROP POLICY IF EXISTS "Admins can view all AI request logs" ON ai_request_logs;

-- Enhanced AI service configuration table
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  performance_score numeric DEFAULT 0.7 CHECK (performance_score >= 0 AND performance_score <= 1),
  reliability_score numeric DEFAULT 0.8 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  circuit_breaker_failures integer DEFAULT 0,
  circuit_breaker_open boolean DEFAULT false,
  last_health_check timestamptz DEFAULT now(),
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

-- Enhanced AI request logs table
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
  quality_score numeric CHECK (quality_score >= 0 AND quality_score <= 1),
  urgency text CHECK (urgency IN ('low', 'medium', 'high')),
  model_used text,
  circuit_breaker_triggered boolean DEFAULT false,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for request logs
CREATE POLICY "Users can view their own AI request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI request logs"
  ON ai_request_logs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_success ON ai_request_logs(success, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_service_config_active ON ai_service_config(is_active, performance_score);

-- Insert enhanced AI service configurations
INSERT INTO ai_service_config (service_name, config, performance_score, reliability_score) VALUES
  ('openai-gpt4', jsonb_build_object(
    'type', 'openai',
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'models', ARRAY['gpt-4-turbo-preview', 'gpt-4-1106-preview', 'gpt-4'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'coding', 'business', 'creative', 'technical'],
    'costPerToken', 0.00003,
    'maxTokens', 128000,
    'priority', 1,
    'streamingSupported', true
  ), 0.95, 0.98),
  
  ('openai-gpt35-turbo', jsonb_build_object(
    'type', 'openai',
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'models', ARRAY['gpt-3.5-turbo-0125', 'gpt-3.5-turbo-16k'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business'],
    'costPerToken', 0.000002,
    'maxTokens', 16384,
    'priority', 5,
    'streamingSupported', true
  ), 0.88, 0.96),
  
  ('anthropic-claude-3-opus', jsonb_build_object(
    'type', 'anthropic',
    'endpoint', 'https://api.anthropic.com/v1/messages',
    'models', ARRAY['claude-3-opus-20240229'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business', 'cultural', 'creative', 'research'],
    'costPerToken', 0.000075,
    'maxTokens', 200000,
    'priority', 1,
    'streamingSupported', true
  ), 0.97, 0.95),
  
  ('anthropic-claude-3-sonnet', jsonb_build_object(
    'type', 'anthropic',
    'endpoint', 'https://api.anthropic.com/v1/messages',
    'models', ARRAY['claude-3-sonnet-20240229'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business', 'cultural'],
    'costPerToken', 0.000015,
    'maxTokens', 200000,
    'priority', 2,
    'streamingSupported', true
  ), 0.92, 0.97),
  
  ('anthropic-claude-3-haiku', jsonb_build_object(
    'type', 'anthropic',
    'endpoint', 'https://api.anthropic.com/v1/messages',
    'models', ARRAY['claude-3-haiku-20240307'],
    'capabilities', ARRAY['chat', 'generation', 'business'],
    'costPerToken', 0.00000125,
    'maxTokens', 200000,
    'priority', 4,
    'streamingSupported', true
  ), 0.85, 0.98),
  
  ('google-gemini-pro', jsonb_build_object(
    'type', 'google',
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'models', ARRAY['gemini-pro'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'cultural', 'research'],
    'costPerToken', 0.0000005,
    'maxTokens', 30720,
    'priority', 3,
    'streamingSupported', false
  ), 0.89, 0.94),
  
  ('google-gemini-15-pro', jsonb_build_object(
    'type', 'google',
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    'models', ARRAY['gemini-1.5-pro'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'coding', 'business', 'research'],
    'costPerToken', 0.000007,
    'maxTokens', 1048576,
    'priority', 2,
    'streamingSupported', true
  ), 0.93, 0.96),
  
  ('dylanallan-business', jsonb_build_object(
    'type', 'dylanallan',
    'endpoint', 'https://dylanallan.io/api/chat',
    'models', ARRAY['dylanallan-business-v2', 'dylanallan-automation'],
    'capabilities', ARRAY['business', 'automation', 'consulting', 'strategy', 'workflow'],
    'costPerToken', 0.00001,
    'maxTokens', 8192,
    'priority', 1,
    'streamingSupported', true,
    'timeout', 15000
  ), 0.91, 0.88),
  
  ('deepseek-coder', jsonb_build_object(
    'type', 'deepseek',
    'endpoint', 'https://api.deepseek.com/v1/chat/completions',
    'models', ARRAY['deepseek-coder', 'deepseek-chat'],
    'capabilities', ARRAY['coding', 'analysis', 'generation', 'technical'],
    'costPerToken', 0.000001,
    'maxTokens', 16384,
    'priority', 1,
    'streamingSupported', true
  ), 0.94, 0.92),
  
  ('perplexity-sonar', jsonb_build_object(
    'type', 'perplexity',
    'endpoint', 'https://api.perplexity.ai/chat/completions',
    'models', ARRAY['sonar-large-32k-chat', 'sonar-medium-chat'],
    'capabilities', ARRAY['research', 'analysis', 'chat', 'business'],
    'costPerToken', 0.000006,
    'maxTokens', 32768,
    'priority', 2,
    'streamingSupported', true,
    'searchEnabled', true
  ), 0.90, 0.93),
  
  ('cohere-command', jsonb_build_object(
    'type', 'cohere',
    'endpoint', 'https://api.cohere.ai/v1/chat',
    'models', ARRAY['command-r-plus', 'command-r'],
    'capabilities', ARRAY['chat', 'analysis', 'generation', 'business'],
    'costPerToken', 0.000003,
    'maxTokens', 128000,
    'priority', 3,
    'streamingSupported', true
  ), 0.87, 0.91),
  
  ('ollama-local', jsonb_build_object(
    'type', 'ollama',
    'endpoint', 'http://localhost:11434/api/generate',
    'models', ARRAY['llama3:70b', 'mixtral:8x7b', 'codellama:34b', 'neural-chat'],
    'capabilities', ARRAY['chat', 'coding', 'analysis'],
    'costPerToken', 0,
    'maxTokens', 8192,
    'priority', 6,
    'streamingSupported', true,
    'timeout', 30000
  ), 0.75, 0.85)
ON CONFLICT (service_name) DO UPDATE SET
  config = EXCLUDED.config,
  performance_score = EXCLUDED.performance_score,
  reliability_score = EXCLUDED.reliability_score,
  updated_at = now();

-- Enhanced function to log AI requests
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text DEFAULT NULL,
  p_prompt_length integer DEFAULT NULL,
  p_response_length integer DEFAULT NULL,
  p_tokens_used integer DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_response_time_ms integer DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_quality_score numeric DEFAULT NULL,
  p_urgency text DEFAULT 'medium',
  p_model_used text DEFAULT NULL,
  p_circuit_breaker_triggered boolean DEFAULT false,
  p_retry_count integer DEFAULT 0
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
    error_message,
    quality_score,
    urgency,
    model_used,
    circuit_breaker_triggered,
    retry_count
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
    p_quality_score,
    p_urgency,
    p_model_used,
    p_circuit_breaker_triggered,
    p_retry_count
  );
END;
$$;

-- Enhanced function to get AI provider performance metrics
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
    'avg_cost_per_request', ROUND(AVG(cost), 6),
    'circuit_breaker_triggers', SUM(CASE WHEN circuit_breaker_triggered THEN 1 ELSE 0 END),
    'avg_retry_count', ROUND(AVG(retry_count), 2),
    'quality_score', ROUND(AVG(quality_score), 3)
  ) INTO result
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
  AND created_at > now() - (p_days || ' days')::interval;

  RETURN result;
END;
$$;

-- Function to update provider performance
CREATE OR REPLACE FUNCTION update_provider_performance(
  p_provider_id text,
  p_performance_score numeric,
  p_reliability_score numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_service_config
  SET 
    performance_score = p_performance_score,
    reliability_score = COALESCE(p_reliability_score, reliability_score),
    last_health_check = now(),
    updated_at = now()
  WHERE service_name = p_provider_id;
END;
$$;

-- Function to handle circuit breaker
CREATE OR REPLACE FUNCTION update_circuit_breaker(
  p_provider_id text,
  p_failure boolean DEFAULT false,
  p_reset boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_reset THEN
    UPDATE ai_service_config
    SET 
      circuit_breaker_failures = 0,
      circuit_breaker_open = false,
      updated_at = now()
    WHERE service_name = p_provider_id;
  ELSIF p_failure THEN
    UPDATE ai_service_config
    SET 
      circuit_breaker_failures = circuit_breaker_failures + 1,
      circuit_breaker_open = CASE 
        WHEN circuit_breaker_failures + 1 >= 3 THEN true 
        ELSE circuit_breaker_open 
      END,
      updated_at = now()
    WHERE service_name = p_provider_id;
  END IF;
END;
$$;

-- Create updated_at trigger for ai_service_config
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to ai_service_config
DROP TRIGGER IF EXISTS update_ai_service_config_updated_at ON ai_service_config;
CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for AI system insights
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_system_insights AS
SELECT 
  asc.service_name as provider_id,
  asc.performance_score,
  asc.reliability_score,
  COUNT(arl.id) as total_requests,
  AVG(CASE WHEN arl.success THEN 1.0 ELSE 0.0 END) as success_rate,
  AVG(arl.response_time_ms) as avg_response_time,
  SUM(arl.tokens_used) as total_tokens,
  SUM(arl.cost) as total_cost,
  MAX(arl.created_at) as last_request
FROM ai_service_config asc
LEFT JOIN ai_request_logs arl ON asc.service_name = arl.provider_id
  AND arl.created_at > now() - interval '7 days'
WHERE asc.is_active = true
GROUP BY asc.service_name, asc.performance_score, asc.reliability_score;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_system_insights_provider 
ON ai_system_insights(provider_id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_ai_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_system_insights;
END;
$$;