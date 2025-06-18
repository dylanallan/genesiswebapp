-- Create tables for shared utilities

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Request logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id TEXT NOT NULL,
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_function_id ON request_logs(function_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Create functions for managing shared utilities

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE reset_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Function to update API key last used timestamp
CREATE OR REPLACE FUNCTION update_api_key_last_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers

-- Trigger to update API key last used timestamp
CREATE TRIGGER update_api_key_last_used_trigger
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_last_used();

-- Create RLS policies

-- Rate limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Request logs table
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own request logs"
  ON request_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage request logs"
  ON request_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User permissions table
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user permissions"
  ON user_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- API keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all API keys"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create scheduled job to clean up expired rate limits
SELECT cron.schedule(
  'cleanup-expired-rate-limits',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT cleanup_expired_rate_limits()$$
);

-- Insert default permissions for admin role
INSERT INTO user_permissions (user_id, permissions)
SELECT id, ARRAY[
  'manage_users',
  'manage_api_keys',
  'manage_permissions',
  'view_logs',
  'manage_settings'
]
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ON CONFLICT (user_id) DO UPDATE
SET permissions = EXCLUDED.permissions;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_permissions
    WHERE user_id = $1
    AND permission = ANY(permissions)
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$; 