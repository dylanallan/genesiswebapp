/*
  # Create Test User Migration

  1. Test User Creation
    - Creates a test user with email 'Latino@1992' and password 'Latino@1992'
    - Properly handles Supabase auth.users table structure
    - Sets up user preferences and activity logging

  2. Security
    - Uses proper UUID generation for user ID
    - Encrypts password using Supabase's auth system
    - Sets up proper user metadata and preferences
*/

-- Create test user with proper Supabase auth structure
DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- Generate a proper UUID for the user
  v_user_id := gen_random_uuid();
  
  -- Create encrypted password using Supabase's method
  v_encrypted_password := crypt('Latino@1992', gen_salt('bf'));

  -- Insert user into auth.users table with proper structure
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'Latino@1992',
    v_encrypted_password,
    now(), -- Email confirmed
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    now(), -- Set last sign in
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test User", "full_name": "Test User"}'::jsonb,
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null
  );

  -- Create user data entry if the table exists
  INSERT INTO user_data (
    user_id,
    preferences,
    settings,
    last_login,
    login_count,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '{
      "theme": "light",
      "notifications": true,
      "language": "en",
      "culturalContext": "Latino heritage"
    }'::jsonb,
    '{
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY",
      "autoSave": true
    }'::jsonb,
    now(),
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user session entry
  INSERT INTO user_sessions (
    user_id,
    device_info,
    ip_address,
    last_active,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '{"browser": "Migration Script", "os": "Server", "device": "Test"}'::jsonb,
    '127.0.0.1',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Log the account creation activity
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata,
    created_at
  )
  VALUES (
    v_user_id,
    'account_created',
    jsonb_build_object(
      'method', 'migration',
      'timestamp', now(),
      'email', 'Latino@1992',
      'source', 'test_user_creation'
    ),
    now()
  );

  -- Create initial user security metadata
  INSERT INTO user_security_metadata (
    user_id,
    last_security_check,
    security_score,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    now(),
    0.8, -- Good initial security score
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Log successful creation
  RAISE NOTICE 'Test user created successfully with ID: %', v_user_id;
  RAISE NOTICE 'Email: Latino@1992';
  RAISE NOTICE 'Password: Latino@1992';
  RAISE NOTICE 'User can now sign in to the application';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test user: %', SQLERRM;
    RAISE NOTICE 'This may be because the user already exists or required tables are missing';
END;
$$;

-- Verify the user was created
DO $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE email = 'Latino@1992';
  
  IF user_count > 0 THEN
    RAISE NOTICE 'Verification: Test user exists in auth.users table';
  ELSE
    RAISE NOTICE 'Verification: Test user was not created';
  END IF;
END;
$$;