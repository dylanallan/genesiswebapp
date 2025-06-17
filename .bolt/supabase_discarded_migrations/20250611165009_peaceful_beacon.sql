/*
  # Fix admin roles table and policies

  1. New Tables
    - No new tables created
  2. Security
    - Fixes existing policies for admin_roles table
  3. Changes
    - Adds IF NOT EXISTS checks for policies
    - Adds unique constraint for user_id
*/

-- Create admin_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '{"full_access": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_roles_user_id_key' AND conrelid = 'admin_roles'::regclass
  ) THEN
    ALTER TABLE admin_roles ADD CONSTRAINT admin_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_roles' AND policyname = 'Admins can manage admin roles'
  ) THEN
    CREATE POLICY "Admins can manage admin roles"
      ON admin_roles
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;
END $$;

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
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) - 'is_admin'
  WHERE id = target_user_id;
END;
$$;

-- Create trigger to update admin_roles updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_admin_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_admin_roles_updated_at
      BEFORE UPDATE ON admin_roles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;