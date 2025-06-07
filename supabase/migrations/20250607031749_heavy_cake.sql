/*
  # Complete AI System Setup

  1. Core Tables
    - ai_service_config: AI provider configurations
    - ai_request_logs: Request logging and metrics
    - model_performance_metrics: Performance tracking
    - system_health_metrics: System monitoring

  2. Functions
    - AI request logging
    - Provider health checks
    - Performance analytics

  3. Security
    - RLS policies for all tables
    - Admin-only access controls
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

ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- AI Request Logs
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

ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI request logs"
  ON ai_request_logs
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role') = 'admin');

-- Model Performance Metrics
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to model metrics"
  ON model_performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to system health"
  ON system_health_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_id ON model_performance_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON model_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_ts ON system_health_metrics(ts);
CREATE INDEX IF NOT EXISTS idx_system_health_name_ts ON system_health_metrics(metric_name, ts);

-- Function to log AI requests
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

-- Function to get AI provider metrics
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
    'successful_requests', COUNT(*) FILTER (WHERE success = true),
    'failed_requests', COUNT(*) FILTER (WHERE success = false),
    'success_rate', COALESCE(COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*), 0), 0),
    'avg_response_time_ms', COALESCE(AVG(response_time_ms) FILTER (WHERE success = true), 0),
    'total_tokens_used', COALESCE(SUM(tokens_used), 0),
    'total_cost', COALESCE(SUM(cost), 0)
  ) INTO result
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
    AND created_at >= now() - (p_days || ' days')::interval;
  
  RETURN result;
END;
$$;

-- Insert default AI service configurations
INSERT INTO ai_service_config (service_name, is_active, config) VALUES
  ('openai-gpt4', true, '{"model": "gpt-4-turbo-preview", "max_tokens": 4000}'),
  ('openai-gpt35-turbo', true, '{"model": "gpt-3.5-turbo", "max_tokens": 4000}'),
  ('anthropic-claude-3-opus', true, '{"model": "claude-3-opus-20240229", "max_tokens": 4000}'),
  ('anthropic-claude-3-sonnet', true, '{"model": "claude-3-sonnet-20240229", "max_tokens": 4000}'),
  ('anthropic-claude-3-haiku', true, '{"model": "claude-3-haiku-20240307", "max_tokens": 4000}'),
  ('google-gemini-pro', true, '{"model": "gemini-pro", "max_tokens": 2000}'),
  ('google-gemini-15-pro', true, '{"model": "gemini-1.5-pro", "max_tokens": 8000}'),
  ('dylanallan-business', true, '{"endpoint": "https://dylanallan.io/api/chat", "timeout": 15000}'),
  ('deepseek-coder', true, '{"model": "deepseek-coder", "max_tokens": 4000}'),
  ('perplexity-sonar', true, '{"model": "sonar-large-32k-chat", "max_tokens": 4000}'),
  ('cohere-command', true, '{"model": "command-r-plus", "max_tokens": 4000}'),
  ('ollama-local', false, '{"endpoint": "http://localhost:11434/api/generate", "timeout": 30000}')
ON CONFLICT (service_name) DO NOTHING;

-- Create materialized view for model performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS model_performance_summary AS
SELECT 
  model_id,
  metric_type,
  avg(value) as avg_value,
  count(*) as sample_count,
  max(timestamp) as last_updated
FROM model_performance_metrics
WHERE timestamp > now() - interval '30 days'
GROUP BY model_id, metric_type;

-- Create materialized view for system health hourly
CREATE MATERIALIZED VIEW IF NOT EXISTS system_health_hourly AS
SELECT 
  date_trunc('hour', ts) as bucket,
  metric_name,
  avg(metric_value) as avg_value,
  min(metric_value) as min_value,
  max(metric_value) as max_value,
  count(*) as sample_count
FROM system_health_metrics
WHERE ts > now() - interval '7 days'
GROUP BY date_trunc('hour', ts), metric_name;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_ai_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW model_performance_summary;
  REFRESH MATERIALIZED VIEW system_health_hourly;
END;
$$;

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_model_performance_summary_model ON model_performance_summary(model_id);
CREATE INDEX IF NOT EXISTS idx_system_health_hourly_bucket ON system_health_hourly(bucket);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();