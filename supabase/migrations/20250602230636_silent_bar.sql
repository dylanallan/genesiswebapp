/*
  # Add Photo Analysis Support
  
  1. New Tables
    - photo_analyses: Stores analysis results from Google Vision AI
    - face_names: Maps detected faces to known family members
  
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Photo Analyses Table
CREATE TABLE IF NOT EXISTS photo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_path text NOT NULL,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Face Names Table
CREATE TABLE IF NOT EXISTS face_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  face_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(face_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photo_analyses_user ON photo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_face_names_user ON face_names(user_id);

-- Enable RLS
ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_names ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their photo analyses" ON photo_analyses
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their face names" ON face_names
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create triggers
CREATE TRIGGER update_photo_analyses_updated_at
  BEFORE UPDATE ON photo_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_face_names_updated_at
  BEFORE UPDATE ON face_names
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();