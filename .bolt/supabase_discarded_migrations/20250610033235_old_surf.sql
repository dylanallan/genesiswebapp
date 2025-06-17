/*
  # Analytics Functions

  1. Functions
    - `get_user_analytics`: Function to get user analytics
    - `get_system_analytics`: Function to get system analytics
    - `create_analytics_optimizations`: Function to create analytics optimizations
  
  2. Security
    - Functions use appropriate security to ensure data privacy
*/

-- Create function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics(
  p_user_id uuid DEFAULT auth.uid(),
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own analytics';
  END IF;

  SELECT jsonb_build_object(
    'activity', (
      SELECT jsonb_build_object(
        'total_logins', count(*) FILTER (WHERE activity_type = 'login'),
        'total_actions', count(*),
        'activity_by_type', jsonb_object_agg(
          activity_type, count(*)
        ),
        'activity_by_day', jsonb_object_agg(
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
          count(*)
        )
      )
      FROM user_activity_log
      WHERE user_id = p_user_id
      AND created_at > now() - (p_days * interval '1 day')
      GROUP BY user_id
    ),
    'content', (
      SELECT jsonb_build_object(
        'artifacts', (SELECT count(*) FROM cultural_artifacts WHERE user_id = p_user_id),
        'traditions', (SELECT count(*) FROM traditions WHERE user_id = p_user_id),
        'stories', (SELECT count(*) FROM cultural_stories WHERE user_id = p_user_id),
        'celebrations', (SELECT count(*) FROM celebrations WHERE user_id = p_user_id),
        'recipes', (SELECT count(*) FROM recipes WHERE user_id = p_user_id),
        'family_contacts', (SELECT count(*) FROM family_contacts WHERE user_id = p_user_id)
      )
    ),
    'ai_usage', (
      SELECT jsonb_build_object(
        'total_requests', count(*),
        'successful_requests', count(*) FILTER (WHERE success = true),
        'average_response_time', avg(response_time_ms),
        'requests_by_provider', jsonb_object_agg(
          provider_id, count(*)
        )
      )
      FROM ai_request_logs
      WHERE user_id = p_user_id
      AND created_at > now() - (p_days * interval '1 day')
      GROUP BY user_id
    )
  ) INTO v_result;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Create function to get system analytics
CREATE OR REPLACE FUNCTION get_system_analytics(
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can access system analytics';
  END IF;

  SELECT jsonb_build_object(
    'users', (
      SELECT jsonb_build_object(
        'total_users', count(DISTINCT user_id),
        'active_users', count(DISTINCT user_id) FILTER (
          WHERE created_at > now() - (p_days * interval '1 day')
        ),
        'new_users', count(DISTINCT user_id) FILTER (
          WHERE created_at > now() - (p_days * interval '1 day')
        ),
        'users_by_day', jsonb_object_agg(
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
          count(DISTINCT user_id)
        )
      )
      FROM user_activity_log
      WHERE created_at > now() - (p_days * interval '1 day')
    ),
    'ai_service', (
      SELECT jsonb_build_object(
        'total_requests', count(*),
        'successful_requests', count(*) FILTER (WHERE success = true),
        'average_response_time', avg(response_time_ms),
        'requests_by_provider', jsonb_object_agg(
          provider_id, count(*)
        ),
        'success_rate_by_provider', jsonb_object_agg(
          provider_id, 
          (count(*) FILTER (WHERE success = true))::numeric / 
            NULLIF(count(*), 0)
        )
      )
      FROM ai_request_logs
      WHERE created_at > now() - (p_days * interval '1 day')
    ),
    'system_health', (
      SELECT jsonb_build_object(
        'average_health', avg(metric_value) FILTER (
          WHERE metric_name = 'system_health'
        ),
        'health_by_day', jsonb_object_agg(
          to_char(date_trunc('day', ts), 'YYYY-MM-DD'),
          avg(metric_value) FILTER (WHERE metric_name = 'system_health')
        )
      )
      FROM system_health_metrics
      WHERE ts > now() - (p_days * interval '1 day')
      AND metric_name = 'system_health'
    ),
    'content', (
      SELECT jsonb_build_object(
        'artifacts', (SELECT count(*) FROM cultural_artifacts),
        'traditions', (SELECT count(*) FROM traditions),
        'stories', (SELECT count(*) FROM cultural_stories),
        'celebrations', (SELECT count(*) FROM celebrations),
        'recipes', (SELECT count(*) FROM recipes),
        'family_contacts', (SELECT count(*) FROM family_contacts)
      )
    )
  ) INTO v_result;
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Create function to create analytics optimizations
CREATE OR REPLACE FUNCTION create_analytics_optimizations()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result text;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can create analytics optimizations';
  END IF;

  -- Create or update indexes for analytics
  CREATE INDEX IF NOT EXISTS idx_user_activity_user_type_time
  ON user_activity_log(user_id, activity_type, created_at);
  
  CREATE INDEX IF NOT EXISTS idx_ai_logs_provider_success_time
  ON ai_request_logs(provider_id, success, created_at);
  
  CREATE INDEX IF NOT EXISTS idx_system_health_name_time
  ON system_health_metrics(metric_name, ts);
  
  -- Analyze tables for query optimization
  ANALYZE user_activity_log;
  ANALYZE ai_request_logs;
  ANALYZE system_health_metrics;
  
  RETURN 'Analytics optimizations created successfully';
END;
$$;