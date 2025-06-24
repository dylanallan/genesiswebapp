-- Genesis Heritage Pro: Market-Ready Backend Schema
-- Run this in your Supabase SQL editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- === User Profiles ===
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name text,
  avatar_url text,
  ancestry text,
  business_goals text,
  cultural_background text,
  location text,
  timezone text,
  language text,
  onboarding_completed boolean,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- === User Data ===
CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY,
  preferences jsonb,
  settings jsonb,
  last_login timestamptz,
  login_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own data" ON user_data FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Celebrations ===
CREATE TABLE IF NOT EXISTS celebrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  description text,
  date_or_season text,
  significance text,
  location text,
  participants text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE celebrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their celebrations" ON celebrations FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Traditions ===
CREATE TABLE IF NOT EXISTS traditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  description text,
  origin text,
  historical_context text,
  modern_application text,
  frequency text,
  participants text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE traditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their traditions" ON traditions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Cultural Stories ===
CREATE TABLE IF NOT EXISTS cultural_stories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  title text NOT NULL,
  content text NOT NULL,
  storyteller text,
  date_recorded timestamptz DEFAULT now(),
  location text,
  themes text[],
  language text,
  translation text,
  verification_status text DEFAULT 'unverified',
  verification_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cultural_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their stories" ON cultural_stories FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Cultural Artifacts ===
CREATE TABLE IF NOT EXISTS cultural_artifacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  media_url text,
  media_type text,
  metadata jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cultural_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their artifacts" ON cultural_artifacts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Family Contacts ===
CREATE TABLE IF NOT EXISTS family_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  relationship text,
  contact_info jsonb,
  birth_date date,
  location text,
  notes text,
  related_names text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their family contacts" ON family_contacts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Recipes ===
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  description text,
  ingredients jsonb NOT NULL,
  instructions jsonb NOT NULL,
  cultural_significance text,
  origin text,
  serving_size int,
  preparation_time interval,
  difficulty_level text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their recipes" ON recipes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Timeline Events ===
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  location text,
  people text[] DEFAULT '{}',
  category text DEFAULT 'other',
  media_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own timeline events" ON timeline_events FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date);

-- === Automation Workflows ===
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  trigger_conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their workflows" ON automation_workflows FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === AI Models ===
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  version text NOT NULL,
  capabilities text[],
  context_window int,
  api_endpoint text NOT NULL,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Security Alerts ===
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  anomaly_score numeric NOT NULL,
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- === Admin Roles ===
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  role_name text NOT NULL,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === System Health Metrics ===
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ts timestamptz NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'
);

-- === Error Recovery Logs ===
CREATE TABLE IF NOT EXISTS error_recovery_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  component text,
  error_message text,
  stack_trace text,
  recovery_strategy text,
  timestamp timestamptz,
  user_agent text,
  user_id uuid
);

-- === DNA Insights (example) ===
CREATE TABLE IF NOT EXISTS dna_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  insights jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dna_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own dna insights" ON dna_insights FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === Voice Profiles (example) ===
CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES user_profiles(id),
  name text NOT NULL,
  relationship text,
  audio_path text NOT NULL,
  features jsonb DEFAULT '{}',
  quality_score numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Voice Generations (example) ===
CREATE TABLE IF NOT EXISTS voice_generations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_profile_id uuid REFERENCES voice_profiles(id),
  text_input text NOT NULL,
  audio_url text NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Add more tables as needed for your features

-- === Indexes for Performance ===
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_cultural_stories_user_id ON cultural_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_artifacts_user_id ON cultural_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_user_id ON family_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_user_id ON automation_workflows(user_id);

-- === Knowledge Base for Semantic Search ===
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  content_length int NOT NULL,
  content_tokens int NOT NULL,
  embedding vector(1536), -- Match your OpenAI embedding model's dimensions
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create a function for semantic search
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM
    knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- === End of Market-Ready Schema === 