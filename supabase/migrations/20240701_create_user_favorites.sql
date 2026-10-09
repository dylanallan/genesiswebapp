-- Migration: Create user_favorites table for tradition bookmarks

-- Shared, read-only library of cultural traditions that users can bookmark.
-- (Previously only defined in supabase/temp_migrations, so this migration failed on fresh projects.)
CREATE TABLE IF NOT EXISTS cultural_traditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tradition_type text NOT NULL,
  description text,
  origin_date date,
  origin_location jsonb,
  current_practice_location jsonb[],
  cultural_significance text,
  practices text[],
  related_artifacts uuid[],
  related_records uuid[],
  source_references jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE cultural_traditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view cultural traditions" ON cultural_traditions;
CREATE POLICY "Anyone can view cultural traditions" ON cultural_traditions FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tradition_id uuid REFERENCES cultural_traditions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tradition_id)
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Users can manage their favorites" ON user_favorites;
CREATE POLICY "Users can manage their favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 