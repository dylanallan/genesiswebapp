-- Create test user with specified credentials
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Insert user into auth.users table
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_current,
    email_change,
    instance_id
  )
  VALUES (
    'Latino@1992',
    crypt('Latino@1992', gen_salt('bf')), -- Using Blowfish encryption for password
    now(), -- Email already confirmed
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Test User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '00000000-0000-0000-0000-000000000000'
  )
  RETURNING id INTO v_user_id;

  -- Add user preferences
  INSERT INTO user_data (
    user_id,
    preferences,
    settings
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
    }'::jsonb
  );

  -- Log the creation
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    metadata
  )
  VALUES (
    v_user_id,
    'account_created',
    jsonb_build_object(
      'method', 'migration',
      'timestamp', now()
    )
  );
END;
$$;