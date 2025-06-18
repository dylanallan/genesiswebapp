/*
  # AI Service Configuration and Monitoring

  1. New Tables
    - `ai_service_config` - Configuration for AI service providers
    - `ai_request_logs` - Logs of AI requests and responses
    - `model_performance_metrics` - Performance metrics for AI models
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    
  3. Functions
    - Add function to log AI requests
    - Add function to get AI provider metrics
*/

-- AI Service Configuration Table
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Request Logs Table
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

-- Model Performance Metrics Table
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_id ON model_performance_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON model_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp ON model_performance_metrics(model_id, timestamp);

-- Enable Row Level Security
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Admins can manage AI configuration"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Admins can view all AI request logs"
  ON ai_request_logs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Users can view their own AI request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow read access to model metrics"
  ON model_performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);

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
  p_success boolean,
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

-- Create function to get AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'provider_id', p_provider_id,
    'total_requests', COUNT(*),
    'success_rate', COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0), 0),
    'avg_response_time_ms', COALESCE(AVG(response_time_ms), 0),
    'total_tokens', COALESCE(SUM(tokens_used), 0),
    'total_cost', COALESCE(SUM(cost), 0),
    'time_period', p_days || ' days'
  ) INTO result
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
  AND created_at >= (CURRENT_TIMESTAMP - (p_days || ' days')::interval);
  
  RETURN result;
END;
$$;

-- Create materialized view for model performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS model_performance_summary AS
SELECT 
  model_id,
  metric_type,
  AVG(value) as avg_value,
  COUNT(*) as sample_count,
  MAX(timestamp) as last_updated
FROM model_performance_metrics
GROUP BY model_id, metric_type;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_model_performance_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW model_performance_summary;
END;
$$;

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_ai_service_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_service_config_updated_at
BEFORE UPDATE ON ai_service_config
FOR EACH ROW
EXECUTE FUNCTION update_ai_service_config_updated_at();