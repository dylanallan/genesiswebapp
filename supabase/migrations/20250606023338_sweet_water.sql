/*
  # Admin User Setup

  1. Changes
    - Creates or updates admin user with proper UUID and metadata
    - Sets up admin role with full permissions
    - Ensures proper unique constraints are respected

  2. Security
    - Encrypts password using bcrypt
    - Sets up proper role-based access control
*/

-- Create admin user with UUID
WITH new_user AS (
  INSERT INTO auth.users (
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
    gen_random_uuid(),  -- Generate UUID for id
    '00000000-0000-0000-0000-000000000000',  -- Default instance_id
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
  ON CONFLICT ON CONSTRAINT users_email_key 
  DO UPDATE SET
    encrypted_password = crypt('Latino@1992', gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object(
      'is_admin', true,
      'role', 'admin'
    ),
    updated_at = now()
  RETURNING id
)
INSERT INTO admin_roles (
  id,
  user_id,
  role_name,
  permissions,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  new_user.id,
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
FROM new_user
ON CONFLICT ON CONSTRAINT admin_roles_user_id_key 
DO UPDATE SET
  permissions = EXCLUDED.permissions,
  updated_at = now();