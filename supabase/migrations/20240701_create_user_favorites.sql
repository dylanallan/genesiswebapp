-- Migration: Create user_favorites table for tradition bookmarks
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tradition_id uuid REFERENCES traditions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tradition_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id); 