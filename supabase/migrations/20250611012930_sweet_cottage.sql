-- Add vector search capabilities to conversation history
CREATE OR REPLACE FUNCTION find_similar_messages(
  p_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  role text,
  content text,
  similarity float,
  session_id text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.role,
    ch.content,
    1 - (ch.embedding <=> p_embedding) as similarity,
    ch.session_id,
    ch.created_at
  FROM ai_conversation_history ch
  WHERE ch.embedding IS NOT NULL
  AND (p_user_id IS NULL OR ch.user_id = p_user_id)
  AND 1 - (ch.embedding <=> p_embedding) > p_match_threshold
  ORDER BY ch.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_session_id text,
  p_user_id uuid,
  p_max_messages integer DEFAULT 10
)
RETURNS TABLE (
  role text,
  content text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT ch.role, ch.content, ch.created_at
  FROM ai_conversation_history ch
  WHERE ch.session_id = p_session_id
  AND ch.user_id = p_user_id
  ORDER BY ch.message_index ASC
  LIMIT p_max_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to log AI requests with better metrics
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text DEFAULT 'chat',
  p_prompt_length integer DEFAULT NULL,
  p_response_length integer DEFAULT NULL,
  p_tokens_used integer DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_response_time_ms integer DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid AS $$
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
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get AI provider metrics
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS TABLE (
  provider_id text,
  total_requests bigint,
  success_rate numeric,
  avg_response_time numeric,
  total_tokens bigint,
  total_cost numeric,
  error_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    arl.provider_id,
    COUNT(*) as total_requests,
    ROUND(SUM(CASE WHEN arl.success THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric, 4) as success_rate,
    ROUND(AVG(arl.response_time_ms)::numeric, 2) as avg_response_time,
    SUM(arl.tokens_used) as total_tokens,
    SUM(arl.cost) as total_cost,
    ROUND(SUM(CASE WHEN NOT arl.success THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric, 4) as error_rate
  FROM ai_request_logs arl
  WHERE arl.provider_id = p_provider_id
  AND arl.created_at >= (CURRENT_DATE - (p_days || ' days')::interval)
  GROUP BY arl.provider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to update user profile in batch with history tracking
CREATE OR REPLACE FUNCTION update_user_profile_batch(
  p_updates jsonb,
  p_reason text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb AS $$
DECLARE
  v_field text;
  v_value text;
  v_old_value text;
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM user_data WHERE user_id = p_user_id) THEN
    -- Create user_data entry if it doesn't exist
    INSERT INTO user_data (user_id, preferences, settings)
    VALUES (p_user_id, '{}'::jsonb, '{}'::jsonb);
  END IF;

  -- Process each field in the updates
  FOR v_field, v_value IN SELECT * FROM jsonb_each_text(p_updates)
  LOOP
    -- Get current value
    SELECT preferences->>v_field INTO v_old_value
    FROM user_data
    WHERE user_id = p_user_id;
    
    -- Update the field
    UPDATE user_data
    SET preferences = jsonb_set(
      COALESCE(preferences, '{}'::jsonb),
      ARRAY[v_field],
      to_jsonb(v_value)
    )
    WHERE user_id = p_user_id;
    
    -- Log the change
    INSERT INTO profile_change_history (
      user_id,
      field_name,
      old_value,
      new_value,
      reason,
      ip_address
    ) VALUES (
      p_user_id,
      v_field,
      v_old_value,
      v_value,
      p_reason,
      inet_client_addr()
    );
    
    -- Add to result
    v_result := jsonb_set(
      v_result,
      ARRAY[v_field],
      to_jsonb(v_value)
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profile change history table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  reason text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id and created_at
CREATE INDEX IF NOT EXISTS idx_profile_change_history_user_time ON profile_change_history(user_id, created_at);

-- Enable RLS on profile change history
ALTER TABLE profile_change_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for profile change history
CREATE POLICY "Users can view their own profile changes"
  ON profile_change_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policy for admins
CREATE POLICY "Admins can view all profile changes"
  ON profile_change_history
  FOR SELECT
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');