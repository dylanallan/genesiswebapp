/*
  # Family and Genealogy Schema

  1. New Tables
    - `family_members` - Family member records
    - `family_relationships` - Relationships between family members
    - `family_events` - Important family events
    - `family_documents` - Family documents and records
    - `dna_analysis` - DNA analysis results
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date,
  death_date date,
  birth_location text,
  gender text,
  is_living boolean DEFAULT true,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family_relationships table
CREATE TABLE IF NOT EXISTS family_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  person1_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  person2_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_people CHECK (person1_id != person2_id)
);

-- Create family_events table
CREATE TABLE IF NOT EXISTS family_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date,
  event_location text,
  description text,
  participants uuid[] DEFAULT '{}'::uuid[],
  media_urls text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family_documents table
CREATE TABLE IF NOT EXISTS family_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text NOT NULL,
  description text,
  file_url text,
  file_type text,
  related_members uuid[] DEFAULT '{}'::uuid[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dna_analysis table
CREATE TABLE IF NOT EXISTS dna_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  provider text,
  results jsonb NOT NULL,
  raw_data_url text,
  ethnicity_breakdown jsonb,
  health_insights jsonb,
  relative_matches jsonb,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Family members: users can manage their own
CREATE POLICY "Users can view their own family members" 
  ON family_members FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own family members" 
  ON family_members FOR ALL 
  USING (auth.uid() = user_id);

-- Family relationships: users can manage their own
CREATE POLICY "Users can view their own family relationships" 
  ON family_relationships FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own family relationships" 
  ON family_relationships FOR ALL 
  USING (auth.uid() = user_id);

-- Family events: users can manage their own
CREATE POLICY "Users can view their own family events" 
  ON family_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own family events" 
  ON family_events FOR ALL 
  USING (auth.uid() = user_id);

-- Family documents: users can manage their own
CREATE POLICY "Users can view their own family documents" 
  ON family_documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own family documents" 
  ON family_documents FOR ALL 
  USING (auth.uid() = user_id);

-- DNA analysis: users can manage their own
CREATE POLICY "Users can view their own DNA analysis" 
  ON dna_analysis FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own DNA analysis" 
  ON dna_analysis FOR ALL 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_relationships_updated_at
  BEFORE UPDATE ON family_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_events_updated_at
  BEFORE UPDATE ON family_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_documents_updated_at
  BEFORE UPDATE ON family_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dna_analysis_updated_at
  BEFORE UPDATE ON dna_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_family_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_family_relationships_changes
  AFTER INSERT OR UPDATE OR DELETE ON family_relationships
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_family_events_changes
  AFTER INSERT OR UPDATE OR DELETE ON family_events
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_family_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON family_documents
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_dna_analysis_changes
  AFTER INSERT OR UPDATE OR DELETE ON dna_analysis
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(name);
CREATE INDEX IF NOT EXISTS idx_family_relationships_user_id ON family_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_person1_id ON family_relationships(person1_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_person2_id ON family_relationships(person2_id);
CREATE INDEX IF NOT EXISTS idx_family_events_user_id ON family_events(user_id);
CREATE INDEX IF NOT EXISTS idx_family_events_event_type ON family_events(event_type);
CREATE INDEX IF NOT EXISTS idx_family_events_event_date ON family_events(event_date);
CREATE INDEX IF NOT EXISTS idx_family_documents_user_id ON family_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_family_documents_document_type ON family_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_user_id ON dna_analysis(user_id);