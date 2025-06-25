-- Migration: Create family_members table for advanced genealogy
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  maiden_name text,
  birth_date date,
  birth_location text,
  death_date date,
  death_location text,
  gender text,
  occupation text[],
  education text[],
  military_service jsonb,
  immigration_records jsonb,
  citizenship text[],
  languages text[],
  religion text,
  ethnicity text[],
  dna_profile_id uuid,
  biography text,
  photos jsonb,
  documents jsonb,
  notes text,
  is_living boolean DEFAULT true,
  privacy_settings jsonb DEFAULT '{"share_basic_info": true, "share_contact": false, "share_biography": true, "share_documents": false, "share_photos": true}'::jsonb,
  verification_status text DEFAULT 'pending',
  verification_notes text,
  wikitree_id text,
  familysearch_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_wikitree_id ON family_members(wikitree_id);
CREATE INDEX IF NOT EXISTS idx_family_members_familysearch_id ON family_members(familysearch_id);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their family members"
  ON family_members
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id); 