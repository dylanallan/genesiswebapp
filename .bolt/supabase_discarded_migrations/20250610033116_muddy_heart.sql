/*
  # User Data Management Functions

  1. Functions
    - `get_user_preferences`: Function to retrieve user preferences
    - `update_user_preferences`: Function to update user preferences
    - `get_user_security_score`: Function to calculate user security score
  
  2. Security
    - Functions use RLS to ensure users can only access their own data
*/

-- Create function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences jsonb;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own preferences';
  END IF;

  SELECT preferences INTO v_preferences
  FROM user_data
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_preferences, '{}'::jsonb);
END;
$$;

-- Create function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_preferences jsonb,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is updating their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only update their own preferences';
  END IF;

  INSERT INTO user_data (
    user_id,
    preferences,
    updated_at
  )
  VALUES (
    p_user_id,
    p_preferences,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    preferences = p_preferences,
    updated_at = now();
    
  -- Log user activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  )
  VALUES (
    p_user_id,
    'update_preferences',
    jsonb_build_object(
      'timestamp', now()
    )
  );
END;
$$;

-- Create function to calculate user security score
CREATE OR REPLACE FUNCTION get_user_security_score(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score numeric := 0.5; -- Default score
  v_has_2fa boolean;
  v_password_strength numeric;
  v_recent_logins integer;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own security score';
  END IF;

  -- Get security metadata
  SELECT 
    security_score INTO v_score
  FROM user_security_metadata
  WHERE user_id = p_user_id;
  
  -- If no score exists, calculate a basic one
  IF v_score IS NULL THEN
    -- Count recent logins as a basic security indicator
    SELECT count(*) INTO v_recent_logins
    FROM user_activity_log
    WHERE user_id = p_user_id
    AND activity_type = 'login'
    AND created_at > now() - interval '30 days';
    
    -- Basic score based on login activity
    v_score := LEAST(0.7, 0.5 + (v_recent_logins * 0.02));
    
    -- Store the calculated score
    INSERT INTO user_security_metadata (
      user_id,
      security_score,
      last_security_check
    )
    VALUES (
      p_user_id,
      v_score,
      now()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      security_score = v_score,
      last_security_check = now();
  END IF;
  
  RETURN v_score;
END;
$$;