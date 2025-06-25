-- Migration: Expand family_members for public genealogy compatibility
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS birth_location text,
  ADD COLUMN IF NOT EXISTS death_date date,
  ADD COLUMN IF NOT EXISTS death_location text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS occupation text[],
  ADD COLUMN IF NOT EXISTS education text[],
  ADD COLUMN IF NOT EXISTS military_service jsonb,
  ADD COLUMN IF NOT EXISTS immigration_records jsonb,
  ADD COLUMN IF NOT EXISTS citizenship text[],
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS ethnicity text[],
  ADD COLUMN IF NOT EXISTS dna_profile_id uuid,
  ADD COLUMN IF NOT EXISTS biography text,
  ADD COLUMN IF NOT EXISTS photos jsonb,
  ADD COLUMN IF NOT EXISTS documents jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS wikitree_id text,
  ADD COLUMN IF NOT EXISTS familysearch_id text;

CREATE INDEX IF NOT EXISTS idx_family_members_wikitree_id ON family_members(wikitree_id);
CREATE INDEX IF NOT EXISTS idx_family_members_familysearch_id ON family_members(familysearch_id); 