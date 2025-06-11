-- Create AI system optimization tables and functions

-- Create AI model performance metrics table
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create index on model_id and timestamp
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp ON model_performance_metrics(model_id, timestamp);

-- Create AI response feedback table with more detailed metrics
CREATE TABLE IF NOT EXISTS ai_response_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  response_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  was_helpful boolean,
  categories text[],
  created_at timestamptz DEFAULT now()
);

-- Create index on response_id
CREATE INDEX IF NOT EXISTS idx_ai_response_feedback_response ON ai_response_feedback(response_id);

-- Create AI conversation analytics table
CREATE TABLE IF NOT EXISTS ai_conversation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_count integer NOT NULL,
  user_message_count integer NOT NULL,
  assistant_message_count integer NOT NULL,
  average_user_message_length integer,
  average_assistant_message_length integer,
  conversation_duration_seconds integer,
  topics jsonb,
  sentiment_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id and created_at
CREATE INDEX IF NOT EXISTS idx_ai_conversation_analytics_user_time ON ai_conversation_analytics(user_id, created_at);

-- Create AI usage quotas table
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  monthly_token_limit integer NOT NULL,
  tokens_used integer DEFAULT 0,
  reset_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_quotas_user ON ai_usage_quotas(user_id);

-- Create AI usage tracking function
CREATE OR REPLACE FUNCTION track_ai_usage(
  p_user_id uuid,
  p_tokens_used integer,
  p_model text
)
RETURNS boolean AS $$
DECLARE
  v_quota_exists boolean;
  v_tokens_remaining integer;
  v_plan_type text;
BEGIN
  -- Check if user has a quota
  SELECT EXISTS(
    SELECT 1 FROM ai_usage_quotas
    WHERE user_id = p_user_id
  ) INTO v_quota_exists;
  
  -- If no quota exists, create a default one
  IF NOT v_quota_exists THEN
    INSERT INTO ai_usage_quotas (
      user_id,
      plan_type,
      monthly_token_limit,
      tokens_used,
      reset_date
    ) VALUES (
      p_user_id,
      'free',
      100000, -- 100k tokens for free tier
      0,
      (date_trunc('month', now()) + interval '1 month')::date
    );
  END IF;
  
  -- Get user's plan and remaining tokens
  SELECT 
    plan_type,
    monthly_token_limit - tokens_used
  INTO
    v_plan_type,
    v_tokens_remaining
  FROM ai_usage_quotas
  WHERE user_id = p_user_id;
  
  -- Check if user has enough tokens
  IF v_tokens_remaining < p_tokens_used THEN
    -- Not enough tokens
    RETURN false;
  END IF;
  
  -- Update token usage
  UPDATE ai_usage_quotas
  SET tokens_used = tokens_used + p_tokens_used,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log usage
  INSERT INTO ai_request_logs (
    user_id,
    provider_id,
    tokens_used,
    cost,
    success
  ) VALUES (
    p_user_id,
    p_model,
    p_tokens_used,
    CASE
      WHEN p_model LIKE 'gpt-4%' THEN p_tokens_used * 0.00003
      WHEN p_model LIKE 'claude%' THEN p_tokens_used * 0.000075
      WHEN p_model LIKE 'gemini%' THEN p_tokens_used * 0.0000005
      ELSE p_tokens_used * 0.00001
    END,
    true
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly quotas
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE ai_usage_quotas
  SET tokens_used = 0,
      reset_date = (date_trunc('month', now()) + interval '1 month')::date,
      updated_at = now()
  WHERE reset_date <= current_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to analyze conversation
CREATE OR REPLACE FUNCTION analyze_conversation(
  p_session_id text,
  p_user_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_message_count integer;
  v_user_message_count integer;
  v_assistant_message_count integer;
  v_avg_user_length integer;
  v_avg_assistant_length integer;
  v_first_message timestamptz;
  v_last_message timestamptz;
  v_duration integer;
BEGIN
  -- Get message counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE role = 'user'),
    COUNT(*) FILTER (WHERE role = 'assistant'),
    COALESCE(AVG(LENGTH(content)) FILTER (WHERE role = 'user'), 0)::integer,
    COALESCE(AVG(LENGTH(content)) FILTER (WHERE role = 'assistant'), 0)::integer,
    MIN(created_at),
    MAX(created_at)
  INTO
    v_message_count,
    v_user_message_count,
    v_assistant_message_count,
    v_avg_user_length,
    v_avg_assistant_length,
    v_first_message,
    v_last_message
  FROM ai_conversation_history
  WHERE session_id = p_session_id
  AND user_id = p_user_id;
  
  -- Calculate duration in seconds
  v_duration := EXTRACT(EPOCH FROM (v_last_message - v_first_message))::integer;
  
  -- Insert analytics
  INSERT INTO ai_conversation_analytics (
    user_id,
    session_id,
    message_count,
    user_message_count,
    assistant_message_count,
    average_user_message_length,
    average_assistant_message_length,
    conversation_duration_seconds,
    topics,
    sentiment_score
  ) VALUES (
    p_user_id,
    p_session_id,
    v_message_count,
    v_user_message_count,
    v_assistant_message_count,
    v_avg_user_length,
    v_avg_assistant_length,
    v_duration,
    '[]'::jsonb, -- Topics would be determined by AI in a real implementation
    0.5 -- Neutral sentiment by default
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for AI system insights
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_system_insights AS
SELECT
  m.model_id,
  AVG(m.value) FILTER (WHERE m.metric_type = 'accuracy') AS avg_performance,
  STDDEV(m.value) FILTER (WHERE m.metric_type = 'accuracy') AS performance_stability,
  COUNT(*) FILTER (WHERE m.metric_type = 'accuracy') AS sample_count,
  COUNT(*) AS total_entries,
  AVG(LENGTH(ch.content)) AS avg_content_length,
  MAX(m.timestamp) AS last_updated
FROM model_performance_metrics m
LEFT JOIN ai_models am ON m.model_id = am.id
LEFT JOIN ai_conversation_history ch ON ch.model_used = am.name
GROUP BY m.model_id;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_ai_system_insights_model ON ai_system_insights(model_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_ai_system_insights()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW ai_system_insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage model metrics"
  ON model_performance_metrics
  FOR ALL
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Users can view their own feedback"
  ON ai_response_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback"
  ON ai_response_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own conversation analytics"
  ON ai_conversation_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversation analytics"
  ON ai_conversation_analytics
  FOR SELECT
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Users can view their own usage quotas"
  ON ai_usage_quotas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage usage quotas"
  ON ai_usage_quotas
  FOR ALL
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');