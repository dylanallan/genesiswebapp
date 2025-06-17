/*
  # Admin User Setup

  1. Changes
    - Creates or updates admin user
    - Sets up admin role and permissions
    
  2. Security
    - Securely stores encrypted password
    - Sets up admin permissions
*/

-- Function to safely create or update admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- First try to find existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dylltoamill@gmail.com'
  LIMIT 1;

  -- If user exists, update it
  IF v_user_id IS NOT NULL THEN
    SET
      encrypted_password = crypt('Latino@1992', gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object(
        'is_admin', true,
        'role', 'admin'
      ),
      updated_at = now()
    WHERE id = v_user_id;
  -- If user doesn't exist, create it
  ELSE
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      invited_at,
      is_sso_user,
      deleted_at,
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'dylltoamill@gmail.com',
      crypt('Latino@1992', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'is_admin', true,
        'role', 'admin'
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      null,
      null,
      '',
      '',
      null,
      false,
      null,
      false
    )
    RETURNING id INTO v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- Create or update admin user and role
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Create or update admin user
  v_user_id := create_admin_user();

  -- Create or update admin role
  IF v_user_id IS NOT NULL THEN
    -- Delete existing role if any
    DELETE FROM admin_roles WHERE user_id = v_user_id;
    
    -- Create new role
    INSERT INTO admin_roles (
      id,
      user_id,
      role_name,
      permissions,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'admin',
      jsonb_build_object(
        'full_access', true,
        'manage_users', true,
        'manage_content', true,
        'manage_settings', true,
        'view_analytics', true,
        'manage_api_keys', true
      ),
      now(),
      now()
    );
  END IF;
END;
$$;