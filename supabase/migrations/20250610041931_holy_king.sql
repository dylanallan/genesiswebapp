-- Create default admin role
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user in the system
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- If a user exists, make them an admin
  IF v_user_id IS NOT NULL THEN
    -- Check if admin_roles table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'admin_roles'
    ) THEN
      INSERT INTO admin_roles (user_id, role_name, permissions)
      VALUES (
        v_user_id, 
        'admin', 
        '{"full_access": true}'::jsonb
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    -- Check if user_data table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_data'
    ) THEN
      INSERT INTO user_data (user_id, preferences, settings)
      VALUES (
        v_user_id,
        '{"viewMode": "standard", "theme": "light"}'::jsonb,
        '{"notifications": true, "language": "en"}'::jsonb
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
END
$$;