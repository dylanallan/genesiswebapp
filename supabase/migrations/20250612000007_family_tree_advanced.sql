-- Advanced Family Tree and Genealogy Features

-- Create family members table with enhanced fields
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  maiden_name text,
  birth_date date,
  birth_location jsonb,
  death_date date,
  death_location jsonb,
  gender text,
  occupation text[],
  education text[],
  military_service jsonb[],
  immigration_records jsonb[],
  citizenship text[],
  languages text[],
  religion text,
  ethnicity text[],
  dna_profile_id uuid REFERENCES dna_analysis_results(id),
  biography text,
  photos jsonb,
  documents jsonb,
  notes text,
  privacy_settings jsonb DEFAULT '{
    "share_basic_info": true,
    "share_contact": false,
    "share_biography": true,
    "share_documents": false,
    "share_photos": true
  }'::jsonb,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family relationships table with enhanced fields
CREATE TABLE IF NOT EXISTS family_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  related_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  relationship_date date,
  relationship_location jsonb,
  relationship_status text,
  relationship_notes text,
  dna_evidence jsonb,
  confidence_score numeric,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(family_member_id, related_member_id, relationship_type)
);

-- Create family events table
CREATE TABLE IF NOT EXISTS family_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  event_location jsonb,
  description text,
  participants jsonb[],
  documents jsonb,
  photos jsonb,
  notes text,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family documents table
CREATE TABLE IF NOT EXISTS family_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  description text,
  document_date date,
  document_location jsonb,
  document_url text,
  transcription text,
  translation text,
  metadata jsonb,
  privacy_settings jsonb DEFAULT '{
    "share_with_family": true,
    "share_with_researchers": false,
    "share_with_public": false
  }'::jsonb,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family stories table
CREATE TABLE IF NOT EXISTS family_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  story_date date,
  story_location jsonb,
  story_type text,
  tags text[],
  media_attachments jsonb,
  privacy_settings jsonb DEFAULT '{
    "share_with_family": true,
    "share_with_researchers": false,
    "share_with_public": false
  }'::jsonb,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family trees table
CREATE TABLE IF NOT EXISTS family_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  root_member_id uuid REFERENCES family_members(id),
  privacy_settings jsonb DEFAULT '{
    "share_with_family": true,
    "share_with_researchers": false,
    "share_with_public": false,
    "allow_collaboration": true
  }'::jsonb,
  collaboration_settings jsonb DEFAULT '{
    "allow_add_members": true,
    "allow_edit_members": true,
    "allow_add_documents": true,
    "allow_add_stories": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create family tree collaborators table
CREATE TABLE IF NOT EXISTS family_tree_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id uuid REFERENCES family_trees(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb,
  invitation_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(family_tree_id, user_id)
);

-- Create family research notes table
CREATE TABLE IF NOT EXISTS family_research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  note_type text NOT NULL,
  content text NOT NULL,
  sources jsonb[],
  tags text[],
  privacy_settings jsonb DEFAULT '{
    "share_with_family": true,
    "share_with_researchers": false,
    "share_with_public": false
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample family members
INSERT INTO family_members (
  user_id,
  first_name,
  last_name,
  birth_date,
  birth_location,
  death_date,
  death_location,
  gender,
  occupation,
  education,
  biography
)
SELECT 
  id,
  'John',
  'Smith',
  '1850-01-15',
  '{"country": "England", "city": "London"}'::jsonb,
  '1920-03-20',
  '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
  'male',
  ARRAY['Farmer', 'Shopkeeper'],
  ARRAY['Elementary School'],
  'John Smith immigrated to Canada in 1870, settling in Ontario where he established a successful farm and general store.'
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert sample family relationships
INSERT INTO family_relationships (
  family_member_id,
  related_member_id,
  relationship_type,
  relationship_date,
  relationship_location,
  relationship_status,
  relationship_notes
)
SELECT 
  f1.id,
  f2.id,
  'spouse',
  '1875-06-10',
  '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
  'married',
  'Married in Toronto, Ontario'
FROM family_members f1
CROSS JOIN family_members f2
WHERE f1.id = (SELECT id FROM family_members ORDER BY created_at ASC LIMIT 1)
AND f2.id = (SELECT id FROM family_members ORDER BY created_at DESC LIMIT 1)
ON CONFLICT DO NOTHING;

-- Insert sample family events
INSERT INTO family_events (
  family_member_id,
  event_type,
  event_date,
  event_location,
  description,
  participants
)
SELECT 
  id,
  'immigration',
  '1870-05-15',
  '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
  'Immigrated to Canada from England',
  ARRAY[
    '{"name": "John Smith", "role": "immigrant"}',
    '{"name": "Mary Smith", "role": "spouse"}'
  ]::jsonb[]
FROM family_members
WHERE id = (
  SELECT id FROM family_members ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert sample family documents
INSERT INTO family_documents (
  family_member_id,
  document_type,
  title,
  description,
  document_date,
  document_location,
  transcription
)
SELECT 
  id,
  'immigration_record',
  'Canadian Immigration Record',
  'Official immigration record from 1870',
  '1870-05-15',
  '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
  'John Smith, Age 20, Occupation: Farmer, Origin: England...'
FROM family_members
WHERE id = (
  SELECT id FROM family_members ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert sample family stories
INSERT INTO family_stories (
  family_member_id,
  title,
  content,
  story_date,
  story_location,
  story_type,
  tags
)
SELECT 
  id,
  'The Journey to Canada',
  'In the spring of 1870, John Smith embarked on a journey that would change his family''s destiny...',
  '1870-05-15',
  '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
  'immigration',
  ARRAY['immigration', 'family history', 'settlement']
FROM family_members
WHERE id = (
  SELECT id FROM family_members ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_family_members_dates ON family_members(birth_date, death_date);
CREATE INDEX IF NOT EXISTS idx_family_relationships_members ON family_relationships(family_member_id, related_member_id);
CREATE INDEX IF NOT EXISTS idx_family_events_member ON family_events(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_documents_member ON family_documents(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_stories_member ON family_stories(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_trees_user ON family_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_family_tree_collaborators ON family_tree_collaborators(family_tree_id, user_id);
CREATE INDEX IF NOT EXISTS idx_family_research_notes ON family_research_notes(user_id, family_member_id);

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_tree_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_research_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own family members"
  ON family_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view family relationships of their members"
  ON family_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE id = family_relationships.family_member_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view events of their family members"
  ON family_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE id = family_events.family_member_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view documents of their family members"
  ON family_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE id = family_documents.family_member_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view stories of their family members"
  ON family_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE id = family_stories.family_member_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own family trees"
  ON family_trees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view family trees they collaborate on"
  ON family_trees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_tree_collaborators
      WHERE family_tree_id = family_trees.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own research notes"
  ON family_research_notes FOR SELECT
  USING (auth.uid() = user_id); 