-- Set up admin user and initial configuration
DO $$
DECLARE
  v_user_id uuid;
  v_encryption_key text := 'your-secure-encryption-key';
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@example.com'
  LIMIT 1;

  -- If user doesn't exist, create them
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    ) VALUES (
      'admin@example.com',
      crypt('admin-password', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'is_admin', true,
        'role', 'admin'
      )
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Ensure admin role exists
  INSERT INTO admin_roles (
    user_id,
    role_name,
    permissions
  ) VALUES (
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
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Set up AI service configurations
  INSERT INTO ai_service_config (
    service_name,
    api_key,
    config
  ) VALUES 
    (
      'openai',
      'sk-...your-openai-key...',
      jsonb_build_object(
        'model', 'gpt-4-turbo-preview',
        'max_tokens', 2048,
        'temperature', 0.7
      )
    ),
    (
      'anthropic',
      'sk-...your-anthropic-key...',
      jsonb_build_object(
        'model', 'claude-3-opus-20240229',
        'max_tokens', 2048,
        'temperature', 0.7
      )
    ),
    (
      'gemini',
      '...your-gemini-key...',
      jsonb_build_object(
        'model', 'gemini-pro',
        'max_tokens', 2048,
        'temperature', 0.7
      )
    )
  ON CONFLICT (service_name) 
  DO UPDATE SET
    api_key = EXCLUDED.api_key,
    config = EXCLUDED.config,
    updated_at = now();

END;
$$;

-- Create function to verify admin status
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

-- Create function to get AI configuration
CREATE OR REPLACE FUNCTION get_ai_config(service_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config jsonb;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'api_key', api_key,
    'config', config,
    'is_active', is_active
  ) INTO v_config
  FROM ai_service_config
  WHERE service_name = $1;

  RETURN v_config;
END;
$$;