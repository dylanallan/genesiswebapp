/*
  # Add admin role management
  
  1. New Tables
    - admin_roles: Tracks admin users and their permissions
  
  2. Security
    - Enable RLS on admin_roles table
    - Add policy for admin access
    - Add functions for admin management
  
  3. Constraints
    - Primary key on id
    - Unique constraint on user_id
    - Foreign key to auth.users
*/

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '{"full_access": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage admin roles"
  ON admin_roles
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE admin_roles.user_id = $1
  );
END;
$$;

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;

  -- Add admin role
  INSERT INTO admin_roles (user_id, role_name, permissions)
  VALUES (
    target_user_id,
    'admin',
    jsonb_build_object(
      'full_access', true,
      'manage_users', true,
      'manage_content', true,
      'manage_settings', true,
      'view_analytics', true,
      'manage_api_keys', true
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_admin', true)
  WHERE id = target_user_id;
END;
$$;

-- Create function to revoke admin access
CREATE OR REPLACE FUNCTION revoke_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can revoke admin access';
  END IF;

  -- Prevent revoking the last admin
  IF (SELECT COUNT(*) FROM admin_roles) <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke the last admin account';
  END IF;

  -- Remove admin role
  DELETE FROM admin_roles
  WHERE user_id = target_user_id;

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) - 'is_admin'
  WHERE id = target_user_id;
END;
$$;

-- Create trigger to update admin_roles updated_at
CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Promote the current user to admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = current_setting('app.admin_email', true);

  -- Insert admin role if user exists
  IF v_user_id IS NOT NULL THEN
    INSERT INTO admin_roles (
      user_id,
      role_name,
      permissions
    )
    VALUES (
      v_user_id,
      'admin',
      jsonb_build_object(
        'full_access', true,
        'manage_users', true,
        'manage_content', true,
        'manage_settings', true,
        'view_analytics', true,
        'manage_api_keys', true
      )
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', true)
    WHERE id = v_user_id;
  END IF;
END;
$$;