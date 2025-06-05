-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test user with specified credentials
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert user into auth.users table
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_current,
    email_change
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'dylltoamill@gmail.com',
    crypt('Latino@1992', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    ''
  );

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
      'timestamp', now()
    ),
    now()
  );
END;
$$;