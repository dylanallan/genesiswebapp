/*
# User Profile Update Functionality

1. New Tables
   - `user_profile_history` - Tracks changes to user profile information
   
2. Functions
   - `update_user_profile` - Allows users to update their profile information
   - `get_user_profile_history` - Retrieves history of profile changes
   
3. Security
   - Enable RLS on new tables
   - Add policies for user access control
   - Track profile update history for audit purposes
*/

-- Create table to track profile update history
CREATE TABLE IF NOT EXISTS user_profile_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  reason text,
  created_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on the history table
ALTER TABLE user_profile_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile history
CREATE POLICY "Users can view their own profile history"
  ON user_profile_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for admins to view all profile history
CREATE POLICY "Admins can view all profile history"
  ON user_profile_history
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_field_name text,
  p_new_value text,
  p_reason text DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_value text;
  v_user_exists boolean;
  v_field_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;
  
  -- Check if user is updating their own profile or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only update their own profile';
  END IF;
  
  -- Check if field exists in user_data table
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_data' 
    AND column_name = p_field_name
  ) INTO v_field_exists;
  
  -- If field exists in user_data table, update it directly
  IF v_field_exists THEN
    -- Get old value
    EXECUTE format('SELECT %I FROM user_data WHERE user_id = $1', p_field_name)
    INTO v_old_value
    USING p_user_id;
    
    -- Update the field
    EXECUTE format('
      UPDATE user_data 
      SET %I = $1, updated_at = now() 
      WHERE user_id = $2
    ', p_field_name)
    USING p_new_value, p_user_id;
  ELSE
    -- Field doesn't exist in user_data table, store in preferences JSON
    -- Get old value from preferences
    SELECT preferences->>p_field_name INTO v_old_value
    FROM user_data
    WHERE user_id = p_user_id;
    
    -- Update preferences JSON
    UPDATE user_data
    SET 
      preferences = jsonb_set(
        COALESCE(preferences, '{}'::jsonb),
        ARRAY[p_field_name],
        to_jsonb(p_new_value)
      ),
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Insert if not exists
    IF NOT FOUND THEN
      INSERT INTO user_data (
        user_id, 
        preferences,
        created_at,
        updated_at
      )
      VALUES (
        p_user_id,
        jsonb_build_object(p_field_name, p_new_value),
        now(),
        now()
      );
    END IF;
  END IF;
  
  -- Record the change in history
  INSERT INTO user_profile_history (
    user_id,
    field_name,
    old_value,
    new_value,
    reason,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_field_name,
    v_old_value,
    p_new_value,
    p_reason,
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  
  -- Log user activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  )
  VALUES (
    p_user_id,
    'profile_update',
    jsonb_build_object(
      'field', p_field_name,
      'reason', p_reason,
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;

-- Create function to get user profile history
CREATE OR REPLACE FUNCTION get_user_profile_history(
  p_user_id uuid DEFAULT auth.uid(),
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  field_name text,
  old_value text,
  new_value text,
  reason text,
  created_at timestamptz,
  ip_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own profile history';
  END IF;

  RETURN QUERY
  SELECT 
    uph.id,
    uph.field_name,
    uph.old_value,
    uph.new_value,
    uph.reason,
    uph.created_at,
    CASE
      -- Only show full IP to admins, mask for regular users
      WHEN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
      THEN uph.ip_address
      ELSE regexp_replace(COALESCE(uph.ip_address, ''), '(\d+\.\d+)\.\d+\.\d+', '\1.xxx.xxx')
    END as ip_address
  FROM user_profile_history uph
  WHERE uph.user_id = p_user_id
  ORDER BY uph.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create function to update multiple profile fields at once
CREATE OR REPLACE FUNCTION update_user_profile_batch(
  p_updates jsonb,
  p_reason text DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key text;
  v_value text;
BEGIN
  -- Check if user is updating their own profile or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only update their own profile';
  END IF;

  -- Process each field in the updates
  FOR v_key, v_value IN
    SELECT * FROM jsonb_each_text(p_updates)
  LOOP
    PERFORM update_user_profile(v_key, v_value, p_reason, p_user_id);
  END LOOP;
  
  RETURN true;
END;
$$;

-- Create function to get current user profile
CREATE OR REPLACE FUNCTION get_user_profile(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile jsonb;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own profile';
  END IF;

  -- Get user data
  SELECT 
    jsonb_build_object(
      'user_id', user_id,
      'preferences', preferences,
      'settings', settings,
      'last_login', last_login,
      'login_count', login_count,
      'created_at', created_at,
      'updated_at', updated_at
    ) INTO v_profile
  FROM user_data
  WHERE user_id = p_user_id;
  
  -- If no user data found, return basic profile
  IF v_profile IS NULL THEN
    SELECT 
      jsonb_build_object(
        'user_id', id,
        'email', email,
        'created_at', created_at
      ) INTO v_profile
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
  
  RETURN COALESCE(v_profile, '{}'::jsonb);
END;
$$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_profile_history_user_created
ON user_profile_history(user_id, created_at DESC);