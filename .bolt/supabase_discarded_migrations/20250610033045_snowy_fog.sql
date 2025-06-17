/*
  # Session Management Functions

  1. Functions
    - `update_session`: Function to update user session data
  
  2. Triggers
    - `on_session_update`: Trigger to automatically update session timestamps
*/

-- Create function to update session data
CREATE OR REPLACE FUNCTION update_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_active = now();
  RETURN NEW;
END;
$$;

-- Create function to handle user login
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user data
  INSERT INTO user_data (user_id, last_login, login_count)
  VALUES (NEW.id, now(), 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_login = now(),
    login_count = user_data.login_count + 1;
  
  -- Create user session
  INSERT INTO user_sessions (
    user_id, 
    device_info, 
    ip_address
  )
  VALUES (
    NEW.id,
    jsonb_build_object(
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'platform', current_setting('request.headers', true)::jsonb->>'sec-ch-ua-platform'
    ),
    current_setting('request.ip', true)
  );
  
  -- Log user activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  )
  VALUES (
    NEW.id,
    'login',
    jsonb_build_object(
      'method', 'password',
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;