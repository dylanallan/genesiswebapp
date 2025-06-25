-- Migration: Create user_favorites table for tradition bookmarks
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
  USING (auth.uid() = user_id); 