-- Create user_sessions table to track active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_data table to store user-specific data
CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz DEFAULT now(),
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data"
  ON user_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at);

-- Create function to update session
CREATE OR REPLACE FUNCTION update_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_active timestamp
  NEW.updated_at = now();
  NEW.last_active = now();
  
  -- Log session update
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  ) VALUES (
    NEW.user_id,
    'session_update',
    jsonb_build_object(
      'session_id', NEW.id,
      'device_info', NEW.device_info
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create function to handle user login
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or create user data
  INSERT INTO user_data (
    user_id,
    last_login,
    login_count
  )
  VALUES (
    NEW.id,
    now(),
    1
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    last_login = now(),
    login_count = user_data.login_count + 1,
    updated_at = now();

  -- Log login activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  ) VALUES (
    NEW.id,
    'user_login',
    jsonb_build_object(
      'login_count', (SELECT login_count FROM user_data WHERE user_id = NEW.id)
    )
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_session_update
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_login();

-- Create function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE last_active < now() - interval '30 days';
END;
$$;

-- Create function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'login_count', ud.login_count,
    'last_login', ud.last_login,
    'active_sessions', (
      SELECT count(*)
      FROM user_sessions us
      WHERE us.user_id = $1
      AND us.last_active > now() - interval '24 hours'
    ),
    'recent_activities', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', activity_type,
          'timestamp', created_at,
          'metadata', metadata
        )
      )
      FROM (
        SELECT activity_type, created_at, metadata
        FROM user_activity_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    )
  ) INTO result
  FROM user_data ud
  WHERE ud.user_id = $1;

  RETURN result;
END;
$$;