-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test user with specified credentials
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Create the user with all required fields
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    instance_id,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change,
    created_at,
    updated_at,
    last_sign_in_at,
    is_sso_user,
    deleted_at
  )
  VALUES (
    'dylltoamill@gmail.com',
    crypt('Latino@1992', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test User", "is_admin": true}'::jsonb,
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    '',
    '',
    '',
    '',
    now(),
    now(),
    now(),
    false,
    null
  )
  RETURNING id INTO v_user_id;

  -- Add user preferences
  INSERT INTO public.user_data (
    user_id,
    preferences,
    settings,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '{
      "theme": "light",
      "notifications": true,
      "language": "en"
    }'::jsonb,
    '{
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY"
    }'::jsonb,
    now(),
    now()
  );

  -- Make user an admin
  INSERT INTO public.admin_roles (
    user_id,
    role_name,
    permissions,
    created_at,
    updated_at
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
    ),
    now(),
    now()
  );

  -- Log the creation
  INSERT INTO public.user_activity_log (
    id,
    user_id,
    activity_type,
    metadata,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'account_created',
    jsonb_build_object(
      'method', 'migration',
      'timestamp', now(),
      'is_admin', true
    ),
    now()
  );
END;
$$;