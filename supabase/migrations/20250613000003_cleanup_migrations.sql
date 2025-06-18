-- Cleanup and Consolidation Migration

-- Drop conflicting migrations' data
DO $$
BEGIN
  -- Clean up duplicate admin users
  DELETE FROM auth.users 
  WHERE email IN ('admin@example.com', 'dylltoamill2gmail.com', 'Latino@1992')
  AND email != 'dylltoamill@gmail.com';

  -- Clean up duplicate admin roles
  DELETE FROM admin_roles 
  WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email = 'dylltoamill@gmail.com'
  );

  -- Clean up duplicate test users
  DELETE FROM auth.users 
  WHERE email = 'Latino@1992' 
  AND id NOT IN (
    SELECT user_id FROM admin_roles
  );
END $$;

-- Drop old tables that are being replaced
DROP TABLE IF EXISTS old_api_endpoints CASCADE;
DROP TABLE IF EXISTS old_edge_functions CASCADE;
DROP TABLE IF EXISTS old_api_request_logs CASCADE;
DROP TABLE IF EXISTS old_edge_function_logs CASCADE;

-- Rename current tables to old_* if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_endpoints') THEN
    ALTER TABLE api_endpoints RENAME TO old_api_endpoints;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'edge_functions') THEN
    ALTER TABLE edge_functions RENAME TO old_edge_functions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_request_logs') THEN
    ALTER TABLE api_request_logs RENAME TO old_api_request_logs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'edge_function_logs') THEN
    ALTER TABLE edge_function_logs RENAME TO old_edge_function_logs;
  END IF;
END $$;

-- Drop redundant indexes
DROP INDEX IF EXISTS idx_api_endpoints_path;
DROP INDEX IF EXISTS idx_edge_functions_name;
DROP INDEX IF EXISTS idx_api_request_logs_endpoint;
DROP INDEX IF EXISTS idx_api_request_logs_user;
DROP INDEX IF EXISTS idx_edge_function_logs_function;
DROP INDEX IF EXISTS idx_edge_function_logs_user;

-- Drop redundant triggers
DROP TRIGGER IF EXISTS on_session_update ON user_sessions;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_heritage_traditions_changes ON heritage_traditions;
DROP TRIGGER IF EXISTS audit_heritage_stories_changes ON heritage_stories;
DROP TRIGGER IF EXISTS audit_heritage_artifacts_changes ON heritage_artifacts;
DROP TRIGGER IF EXISTS audit_user_heritage_changes ON user_heritage;

-- Drop redundant functions
DROP FUNCTION IF EXISTS update_session();
DROP FUNCTION IF EXISTS handle_user_login();
DROP FUNCTION IF EXISTS audit_log_changes();

-- Clean up storage buckets
DELETE FROM storage.buckets 
WHERE id IN (
  'voice-samples',
  'generated-audio',
  'dna-files',
  'timeline-media',
  'recipe-images'
);

-- Recreate storage buckets with proper configuration
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('voice-samples', 'voice-samples', false),
  ('generated-audio', 'generated-audio', true),
  ('dna-files', 'dna-files', false),
  ('timeline-media', 'timeline-media', true),
  ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Update system settings
UPDATE system_settings
SET 
  value = '"Genesis Heritage"',
  description = 'Application name',
  is_public = true
WHERE key = 'app_name';

UPDATE system_settings
SET 
  value = '"1.0.0"',
  description = 'Application version',
  is_public = true
WHERE key = 'app_version';

UPDATE system_settings
SET 
  value = 'false',
  description = 'Whether the application is in maintenance mode',
  is_public = true
WHERE key = 'maintenance_mode';

UPDATE system_settings
SET 
  value = 'true',
  description = 'Whether AI providers are enabled',
  is_public = true
WHERE key = 'ai_providers_enabled';

UPDATE system_settings
SET 
  value = '{"theme": "light", "notifications": true}',
  description = 'Default user preferences',
  is_public = true
WHERE key = 'default_user_preferences';

-- Ensure admin user exists with correct configuration
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get or create admin user
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    'dylltoamill@gmail.com',
    crypt('Latino@1992', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'is_admin', true,
      'role', 'admin'
    ),
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET
    encrypted_password = crypt('Latino@1992', gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object(
      'is_admin', true,
      'role', 'admin'
    ),
    updated_at = now()
  RETURNING id INTO v_user_id;

  -- Ensure admin role exists
  INSERT INTO admin_roles (
    user_id,
    role_name,
    permissions,
    created_at,
    updated_at
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
    ),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    permissions = EXCLUDED.permissions,
    updated_at = now();
END $$;

-- Create a function to verify cleanup
CREATE OR REPLACE FUNCTION verify_cleanup()
RETURNS TABLE (
  check_name text,
  status text,
  details text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  -- Check admin users
  SELECT 
    'Admin Users' as check_name,
    CASE 
      WHEN COUNT(*) = 1 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' admin users' as details
  FROM auth.users 
  WHERE email = 'dylltoamill@gmail.com'
  UNION ALL
  -- Check admin roles
  SELECT 
    'Admin Roles' as check_name,
    CASE 
      WHEN COUNT(*) = 1 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' admin roles' as details
  FROM admin_roles
  UNION ALL
  -- Check storage buckets
  SELECT 
    'Storage Buckets' as check_name,
    CASE 
      WHEN COUNT(*) = 5 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' storage buckets' as details
  FROM storage.buckets
  WHERE id IN (
    'voice-samples',
    'generated-audio',
    'dna-files',
    'timeline-media',
    'recipe-images'
  );
END $$; 