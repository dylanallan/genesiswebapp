/*
  # Heritage Data Tables

  1. New Tables
    - `heritage_regions` - Geographic regions for heritage data
    - `heritage_traditions` - Cultural traditions linked to regions
    - `heritage_stories` - Cultural stories and narratives
    - `heritage_artifacts` - Cultural artifacts and items
    - `user_heritage` - User's heritage connections
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create heritage_regions table
CREATE TABLE IF NOT EXISTS heritage_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  geographic_area text,
  coordinates point,
  historical_significance text,
  cultural_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create heritage_traditions table
CREATE TABLE IF NOT EXISTS heritage_traditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES heritage_regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  historical_context text,
  modern_practice text,
  significance text,
  time_period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create heritage_stories table
CREATE TABLE IF NOT EXISTS heritage_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES heritage_regions(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  origin text,
  time_period text,
  cultural_significance text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create heritage_artifacts table
CREATE TABLE IF NOT EXISTS heritage_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES heritage_regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  historical_context text,
  cultural_significance text,
  time_period text,
  image_url text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_heritage table to connect users with their heritage
CREATE TABLE IF NOT EXISTS user_heritage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id uuid REFERENCES heritage_regions(id) ON DELETE CASCADE,
  connection_strength numeric DEFAULT 0.5,
  notes text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, region_id)
);

-- Enable Row Level Security
ALTER TABLE heritage_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_traditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_heritage ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Heritage regions: public read, admin write
CREATE POLICY "Heritage regions are viewable by everyone" 
  ON heritage_regions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify heritage regions" 
  ON heritage_regions FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Heritage traditions: public read, admin write
CREATE POLICY "Heritage traditions are viewable by everyone" 
  ON heritage_traditions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify heritage traditions" 
  ON heritage_traditions FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Heritage stories: public read, admin write
CREATE POLICY "Heritage stories are viewable by everyone" 
  ON heritage_stories FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify heritage stories" 
  ON heritage_stories FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Heritage artifacts: public read, admin write
CREATE POLICY "Heritage artifacts are viewable by everyone" 
  ON heritage_artifacts FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify heritage artifacts" 
  ON heritage_artifacts FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- User heritage: users can manage their own connections
CREATE POLICY "Users can view their own heritage connections" 
  ON user_heritage FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own heritage connections" 
  ON user_heritage FOR ALL 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_heritage_regions_updated_at
  BEFORE UPDATE ON heritage_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heritage_traditions_updated_at
  BEFORE UPDATE ON heritage_traditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heritage_stories_updated_at
  BEFORE UPDATE ON heritage_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heritage_artifacts_updated_at
  BEFORE UPDATE ON heritage_artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_heritage_updated_at
  BEFORE UPDATE ON user_heritage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_heritage_regions_changes
  AFTER INSERT OR UPDATE OR DELETE ON heritage_regions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_heritage_traditions_changes
  AFTER INSERT OR UPDATE OR DELETE ON heritage_traditions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_heritage_stories_changes
  AFTER INSERT OR UPDATE OR DELETE ON heritage_stories
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_heritage_artifacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON heritage_artifacts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_user_heritage_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_heritage
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX idx_heritage_regions_name ON heritage_regions(name);
CREATE INDEX idx_heritage_traditions_name ON heritage_traditions(name);
CREATE INDEX idx_heritage_stories_title ON heritage_stories(title);
CREATE INDEX idx_heritage_artifacts_name ON heritage_artifacts(name);
CREATE INDEX idx_user_heritage_user_id ON user_heritage(user_id);
CREATE INDEX idx_user_heritage_region_id ON user_heritage(region_id);