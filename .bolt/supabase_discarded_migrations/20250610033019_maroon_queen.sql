/*
  # AI Request Logging Function

  1. Functions
    - `log_ai_request`: Function to log AI requests with detailed metrics
  
  2. Security
    - Function is security definer to ensure proper logging regardless of user permissions
*/

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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
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
  )
  RETURNING id INTO v_id;
  
  -- Update provider metrics
  PERFORM update_model_metrics(
    (SELECT id FROM ai_models WHERE name = p_provider_id LIMIT 1),
    CASE 
      WHEN p_success THEN 'success_rate' 
      ELSE 'error_rate' 
    END,
    CASE 
      WHEN p_success THEN 1 
      ELSE 0 
    END
  );
  
  -- Log response time
  IF p_response_time_ms IS NOT NULL THEN
    PERFORM update_model_metrics(
      (SELECT id FROM ai_models WHERE name = p_provider_id LIMIT 1),
      'response_time',
      p_response_time_ms
    );
  END IF;
  
  RETURN v_id;
END;
$$;

-- Create function to get AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  provider_id text,
  total_requests bigint,
  success_rate numeric,
  avg_response_time_ms numeric,
  total_tokens bigint,
  total_cost numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    provider_id,
    count(*) as total_requests,
    (count(*) FILTER (WHERE success = true))::numeric / 
      NULLIF(count(*), 0) as success_rate,
    avg(response_time_ms) as avg_response_time_ms,
    sum(tokens_used) as total_tokens,
    sum(cost) as total_cost
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
  AND created_at > now() - (p_days * interval '1 day')
  GROUP BY provider_id;
END;
$$;