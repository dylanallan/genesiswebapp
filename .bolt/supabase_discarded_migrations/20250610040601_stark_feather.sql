-- Create default admin role
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first user in the system
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- If a user exists, make them an admin
  IF v_user_id IS NOT NULL THEN
    INSERT INTO admin_roles (user_id, role_name, permissions)
    VALUES (
      v_user_id, 
      'admin', 
      '{"full_access": true}'::jsonb
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Also ensure they have user_data entry
    INSERT INTO user_data (user_id, preferences, settings)
    VALUES (
      v_user_id,
      '{"viewMode": "standard", "theme": "light"}'::jsonb,
      '{"notifications": true, "language": "en"}'::jsonb
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END
$$;