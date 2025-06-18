-- =====================================================
-- COMPLETE GENESIS HERITAGE DATABASE SCHEMA SETUP
-- =====================================================
-- This script creates all essential tables, functions, and policies
-- for the Genesis Heritage application

-- =====================================================
-- 1. CORE USER TABLES
-- =====================================================

-- Create user_data table (if not exists)
CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz DEFAULT now(),
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  avatar_url text,
  ancestry text,
  business_goals text,
  cultural_background text,
  location text,
  timezone text,
  language text DEFAULT 'en',
  onboarding_completed boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. AI AND API MANAGEMENT
-- =====================================================

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  encrypted_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  capabilities text[] DEFAULT '{}',
  context_window integer DEFAULT 4096,
  api_endpoint text NOT NULL,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_service_config table
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 3. CONTENT MANAGEMENT
-- =====================================================

-- Create knowledge_base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content jsonb NOT NULL,
  category text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sacred_content table
CREATE TABLE IF NOT EXISTS sacred_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  cultural_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cultural_artifacts table
CREATE TABLE IF NOT EXISTS cultural_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cultural_significance text,
  origin text,
  era text,
  category text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. SYSTEM MONITORING
-- =====================================================

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create system_performance_logs table
CREATE TABLE IF NOT EXISTS system_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  component text NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL,
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- =====================================================
-- 5. NOTIFICATION SYSTEM
-- =====================================================

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  subject text,
  body text,
  blocks jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create notification_channels table
CREATE TABLE IF NOT EXISTS notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('email', 'slack', 'webhook')),
  config jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  template text NOT NULL,
  data jsonb NOT NULL,
  result jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. FAMILY TREE AND RELATIONSHIPS
-- =====================================================

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  birth_date date,
  death_date date,
  cultural_background text,
  stories text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family_relationships table
CREATE TABLE IF NOT EXISTS family_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person1_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  person2_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 7. COMMUNITY AND GROUPS
-- =====================================================

-- Create community_groups table
CREATE TABLE IF NOT EXISTS community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  cultural_focus text,
  is_public boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacred_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE POLICIES
-- =====================================================

-- User data policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_data' AND policyname = 'Users can manage their own data') THEN
    CREATE POLICY "Users can manage their own data"
      ON user_data FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- User profiles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can manage their own profile') THEN
    CREATE POLICY "Users can manage their own profile"
      ON user_profiles FOR ALL TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- API keys policies (admin only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Admins can manage API keys') THEN
    CREATE POLICY "Admins can manage API keys"
      ON api_keys FOR ALL TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;
END $$;

-- AI models policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Authenticated users can read AI models') THEN
    CREATE POLICY "Authenticated users can read AI models"
      ON ai_models FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- Knowledge base policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'knowledge_base' AND policyname = 'Authenticated users can access knowledge base') THEN
    CREATE POLICY "Authenticated users can access knowledge base"
      ON knowledge_base FOR ALL TO authenticated
      USING (true);
  END IF;
END $$;

-- Sacred content policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sacred_content' AND policyname = 'Authenticated users can access sacred content') THEN
    CREATE POLICY "Authenticated users can access sacred content"
      ON sacred_content FOR ALL TO authenticated
      USING (true);
  END IF;
END $$;

-- Family members policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can manage their family members') THEN
    CREATE POLICY "Users can manage their family members"
      ON family_members FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Community groups policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'community_groups' AND policyname = 'Authenticated users can access public groups') THEN
    CREATE POLICY "Authenticated users can access public groups"
      ON community_groups FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;
END $$;

-- =====================================================
-- 10. CREATE INDEXES
-- =====================================================

-- User data indexes
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_preferences ON user_data USING gin (preferences);
CREATE INDEX IF NOT EXISTS idx_user_data_settings ON user_data USING gin (settings);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_ancestry ON user_profiles(ancestry);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);

-- AI models indexes
CREATE INDEX IF NOT EXISTS idx_ai_models_name ON ai_models(name);
CREATE INDEX IF NOT EXISTS idx_ai_models_capabilities ON ai_models USING gin (capabilities);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base USING gin (content);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING gin (tags);

-- Sacred content indexes
CREATE INDEX IF NOT EXISTS idx_sacred_content_category ON sacred_content(category);
CREATE INDEX IF NOT EXISTS idx_sacred_content_content ON sacred_content USING gin (to_tsvector('english', content));

-- System monitoring indexes
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_ts ON system_health_metrics(ts);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_performance_logs_timestamp ON system_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_performance_logs_component ON system_performance_logs(component);

-- Family members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_relationship ON family_members(relationship);

-- Community groups indexes
CREATE INDEX IF NOT EXISTS idx_community_groups_category ON community_groups(category);
CREATE INDEX IF NOT EXISTS idx_community_groups_is_public ON community_groups(is_public);

-- =====================================================
-- 11. CREATE FUNCTIONS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Get user profile function
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
BEGIN
  -- Get user profile
  SELECT jsonb_build_object(
    'profile', row_to_json(up.*),
    'user_data', row_to_json(ud.*)
  ) INTO profile_data
  FROM user_profiles up
  LEFT JOIN user_data ud ON ud.user_id = p_user_id
  WHERE up.id = p_user_id;
  
  RETURN profile_data;
END;
$$;

-- Log system performance function
CREATE OR REPLACE FUNCTION log_system_performance(
  p_component text,
  p_metric_type text,
  p_value numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO system_performance_logs (
    component,
    metric_type,
    value,
    metadata
  ) VALUES (
    p_component,
    p_metric_type,
    p_value,
    p_metadata
  );
END;
$$;

-- =====================================================
-- 12. CREATE TRIGGERS
-- =====================================================

-- User data trigger
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User profiles trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- API keys trigger
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- AI models trigger
DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Knowledge base trigger
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sacred content trigger
DROP TRIGGER IF EXISTS update_sacred_content_updated_at ON sacred_content;
CREATE TRIGGER update_sacred_content_updated_at
  BEFORE UPDATE ON sacred_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. INSERT DEFAULT DATA
-- =====================================================

-- Insert default notification templates
INSERT INTO notification_templates (name, description, subject, body, blocks)
VALUES
  (
    'welcome',
    'Welcome notification for new users',
    'Welcome to Genesis Heritage!',
    '<h1>Welcome to Genesis Heritage</h1><p>We''re excited to help you explore your cultural heritage and automate your business.</p>',
    '[]'
  ),
  (
    'alert_error',
    'Template for error alerts',
    '🚨 Alert: System Error',
    '<h1>Error Alert</h1><p>An error has occurred in the system.</p>',
    '[]'
  )
ON CONFLICT (name) DO NOTHING;

-- Insert default AI service configurations
INSERT INTO ai_service_config (service_name, api_key, config)
VALUES
  (
    'openai',
    NULL,
    '{"model": "gpt-4-turbo-preview", "max_tokens": 2048, "temperature": 0.7}'::jsonb
  ),
  (
    'anthropic',
    NULL,
    '{"model": "claude-3-opus-20240229", "max_tokens": 2048, "temperature": 0.7}'::jsonb
  ),
  (
    'gemini',
    NULL,
    '{"model": "gemini-pro", "max_tokens": 2048, "temperature": 0.7}'::jsonb
  )
ON CONFLICT (service_name) DO NOTHING;

-- =====================================================
-- 14. GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_performance(text, text, numeric, jsonb) TO authenticated;

-- =====================================================
-- COMPLETE SCHEMA SETUP FINISHED
-- ===================================================== 