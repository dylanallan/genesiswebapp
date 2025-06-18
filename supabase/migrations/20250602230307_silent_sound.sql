/*
  # Marketing Automation System Integration

  1. New Tables
    - marketing_funnels: Stores funnel configurations and stages
    - lead_magnets: Stores lead magnet content and metrics
    - email_sequences: Stores email nurture sequences
    - client_journeys: Tracks client progression through funnels
    - automation_workflows: Stores automation rules and triggers
    - sacred_content: Stores spiritual and ancestral content
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Changes
    - Add materialized views for analytics
    - Add functions for automation processing
*/

-- Marketing Funnels
CREATE TABLE IF NOT EXISTS marketing_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  stages jsonb NOT NULL DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lead Magnets
CREATE TABLE IF NOT EXISTS lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL,
  conversion_rate numeric DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email Sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  emails jsonb NOT NULL DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Journeys
CREATE TABLE IF NOT EXISTS client_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_email text NOT NULL,
  funnel_id uuid REFERENCES marketing_funnels(id) ON DELETE CASCADE,
  current_stage text NOT NULL,
  journey_data jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Automation Workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sacred Content
CREATE TABLE IF NOT EXISTS sacred_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL,
  content text NOT NULL,
  cultural_context text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketing_funnels_user ON marketing_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnets_type ON lead_magnets(type);
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger ON email_sequences(trigger_type);
CREATE INDEX IF NOT EXISTS idx_client_journeys_email ON client_journeys(client_email);
CREATE INDEX IF NOT EXISTS idx_client_journeys_funnel ON client_journeys(funnel_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_sacred_content_type ON sacred_content(content_type);
CREATE INDEX IF NOT EXISTS idx_sacred_content_tags ON sacred_content USING gin(tags);

-- Enable RLS
ALTER TABLE marketing_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacred_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their marketing funnels" ON marketing_funnels
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their lead magnets" ON lead_magnets
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their email sequences" ON email_sequences
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their client journeys" ON client_journeys
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their automation workflows" ON automation_workflows
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their sacred content" ON sacred_content
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create materialized view for funnel analytics
CREATE MATERIALIZED VIEW funnel_performance_summary AS
SELECT 
  f.id as funnel_id,
  f.name as funnel_name,
  f.user_id,
  COUNT(DISTINCT cj.id) as total_leads,
  COUNT(DISTINCT CASE WHEN cj.current_stage = 'converted' THEN cj.id END) as conversions,
  ROUND(COUNT(DISTINCT CASE WHEN cj.current_stage = 'converted' THEN cj.id END)::numeric / 
    NULLIF(COUNT(DISTINCT cj.id), 0) * 100, 2) as conversion_rate,
  AVG(EXTRACT(EPOCH FROM (cj.updated_at - cj.started_at))/86400)::integer as avg_days_to_convert
FROM marketing_funnels f
LEFT JOIN client_journeys cj ON f.id = cj.funnel_id
GROUP BY f.id, f.name, f.user_id;

-- Create function to process automation rules
CREATE OR REPLACE FUNCTION process_automation_rules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation would process automation rules
  -- This is a placeholder
  NULL;
END;
$$;

-- Create function to update journey stage
CREATE OR REPLACE FUNCTION update_journey_stage(
  p_journey_id uuid,
  p_new_stage text,
  p_journey_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_journeys
  SET 
    current_stage = p_new_stage,
    journey_data = COALESCE(p_journey_data, journey_data),
    updated_at = now()
  WHERE id = p_journey_id;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_marketing_funnels_updated_at
  BEFORE UPDATE ON marketing_funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_magnets_updated_at
  BEFORE UPDATE ON lead_magnets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_journeys_updated_at
  BEFORE UPDATE ON client_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sacred_content_updated_at
  BEFORE UPDATE ON sacred_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();