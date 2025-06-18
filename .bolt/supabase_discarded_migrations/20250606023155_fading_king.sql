-- Update admin user configuration
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Update existing admin user if exists
  SET 
    email = 'dylltoamill@gmail.com',
    encrypted_password = crypt('Latino@1992', gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object(
      'is_admin', true,
      'role', 'admin'
    )
  WHERE email IN ('admin@example.com', 'dylltoamill2gmail.com')
  RETURNING id INTO v_user_id;

  -- If user doesn't exist, create them
  IF v_user_id IS NULL THEN
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data
    ) VALUES (
      'dylltoamill@gmail.com',
      crypt('Latino@1992', gen_salt('bf')),
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

END;
$$;