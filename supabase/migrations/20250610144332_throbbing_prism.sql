/*
  # Initial Schema Setup

  1. New Tables
    - `cultural_artifacts`: Stores cultural artifacts with metadata
    - `celebrations`: Tracks cultural celebrations and events
    - `traditions`: Records family and cultural traditions
    - `family_contacts`: Stores family member contact information
    - `recipes`: Manages cultural recipes with ingredients and instructions
    - `cultural_stories`: Preserves cultural stories and narratives

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Performance
    - Add appropriate indexes
    - Enable full-text search for artifacts
    - Add updated_at triggers
*/

-- Cultural Artifacts Table
CREATE TABLE IF NOT EXISTS cultural_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Only create RLS policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cultural_artifacts' 
    AND policyname = 'Users can manage their own artifacts'
  ) THEN
    ALTER TABLE cultural_artifacts ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage their own artifacts"
      ON cultural_artifacts
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Celebrations Table
CREATE TABLE IF NOT EXISTS celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can manage their celebrations"
  ON celebrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Traditions Table
CREATE TABLE IF NOT EXISTS traditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can manage their traditions"
  ON traditions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Family Contacts Table
CREATE TABLE IF NOT EXISTS family_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can manage their family contacts"
  ON family_contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can manage their recipes"
  ON recipes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Cultural Stories Table
CREATE TABLE IF NOT EXISTS cultural_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can manage their cultural stories"
  ON cultural_stories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS celebration_artifacts (
  celebration_id uuid REFERENCES celebrations(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES cultural_artifacts(id) ON DELETE CASCADE,
  PRIMARY KEY (celebration_id, artifact_id)
);

ALTER TABLE celebration_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage celebration artifacts"
  ON celebration_artifacts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM celebrations
    WHERE celebrations.id = celebration_artifacts.celebration_id
    AND celebrations.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS tradition_artifacts (
  tradition_id uuid REFERENCES traditions(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES cultural_artifacts(id) ON DELETE CASCADE,
  PRIMARY KEY (tradition_id, artifact_id)
);

ALTER TABLE tradition_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tradition artifacts"
  ON tradition_artifacts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM traditions
    WHERE traditions.id = tradition_artifacts.tradition_id
    AND traditions.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS story_artifacts (
  story_id uuid REFERENCES cultural_stories(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES cultural_artifacts(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, artifact_id)
);

ALTER TABLE story_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage story artifacts"
  ON story_artifacts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cultural_stories
    WHERE cultural_stories.id = story_artifacts.story_id
    AND cultural_stories.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS recipe_images (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES cultural_artifacts(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, artifact_id)
);

ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage recipe images"
  ON recipe_images
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_images.recipe_id
    AND recipes.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artifacts_category ON cultural_artifacts USING btree (category);
CREATE INDEX IF NOT EXISTS idx_artifacts_tags ON cultural_artifacts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_celebrations_date ON celebrations USING btree (date_or_season);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_stories_themes ON cultural_stories USING gin (themes);

-- Enable full-text search
ALTER TABLE cultural_artifacts ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS cultural_artifacts_fts_idx ON cultural_artifacts USING gin(fts);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_cultural_artifacts_updated_at'
  ) THEN
    CREATE TRIGGER update_cultural_artifacts_updated_at
      BEFORE UPDATE ON cultural_artifacts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_celebrations_updated_at'
  ) THEN
    CREATE TRIGGER update_celebrations_updated_at
      BEFORE UPDATE ON celebrations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_traditions_updated_at'
  ) THEN
    CREATE TRIGGER update_traditions_updated_at
      BEFORE UPDATE ON traditions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_family_contacts_updated_at'
  ) THEN
    CREATE TRIGGER update_family_contacts_updated_at
      BEFORE UPDATE ON family_contacts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_recipes_updated_at'
  ) THEN
    CREATE TRIGGER update_recipes_updated_at
      BEFORE UPDATE ON recipes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_cultural_stories_updated_at'
  ) THEN
    CREATE TRIGGER update_cultural_stories_updated_at
      BEFORE UPDATE ON cultural_stories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;