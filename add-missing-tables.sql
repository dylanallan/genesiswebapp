-- Add missing tables for Genesis Heritage

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

-- Enable RLS on new tables
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
DO $$
BEGIN
  -- AI service config policies (admin only)
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ai_service_config' AND policyname = 'Admins can manage AI config') THEN
    CREATE POLICY "Admins can manage AI config"
      ON ai_service_config FOR ALL TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;

  -- Family members policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can manage their family members') THEN
    CREATE POLICY "Users can manage their family members"
      ON family_members FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Family relationships policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'family_relationships' AND policyname = 'Users can manage their family relationships') THEN
    CREATE POLICY "Users can manage their family relationships"
      ON family_relationships FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM family_members 
        WHERE id IN (person1_id, person2_id) 
        AND user_id = auth.uid()
      ));
  END IF;

  -- Community groups policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'community_groups' AND policyname = 'Authenticated users can access public groups') THEN
    CREATE POLICY "Authenticated users can access public groups"
      ON community_groups FOR SELECT TO authenticated
      USING (is_public = true);
  END IF;

  -- Group members policies
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'group_members' AND policyname = 'Users can manage their group memberships') THEN
    CREATE POLICY "Users can manage their group memberships"
      ON group_members FOR ALL TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_ai_service_config_name ON ai_service_config(service_name);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_relationship ON family_members(relationship);
CREATE INDEX IF NOT EXISTS idx_family_relationships_person1 ON family_relationships(person1_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_person2 ON family_relationships(person2_id);
CREATE INDEX IF NOT EXISTS idx_community_groups_category ON community_groups(category);
CREATE INDEX IF NOT EXISTS idx_community_groups_is_public ON community_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_ai_service_config_updated_at ON ai_service_config;
CREATE TRIGGER update_ai_service_config_updated_at
  BEFORE UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_groups_updated_at ON community_groups;
CREATE TRIGGER update_community_groups_updated_at
  BEFORE UPDATE ON community_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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