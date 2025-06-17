-- Voice Profiles Table
CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  audio_path text NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  quality_score numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voice Generations Table
CREATE TABLE IF NOT EXISTS voice_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id uuid REFERENCES voice_profiles(id) ON DELETE CASCADE,
  text_input text NOT NULL,
  audio_url text NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- DNA Analysis Results Table
CREATE TABLE IF NOT EXISTS dna_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_data_path text,
  ethnicity_breakdown jsonb DEFAULT '[]'::jsonb,
  health_insights jsonb DEFAULT '[]'::jsonb,
  migration_patterns jsonb DEFAULT '[]'::jsonb,
  potential_relatives jsonb DEFAULT '[]'::jsonb,
  analyzed_at timestamptz DEFAULT now()
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  location text,
  people text[] DEFAULT '{}',
  category text DEFAULT 'other',
  media_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cultural Recipes Table
CREATE TABLE IF NOT EXISTS cultural_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  origin text,
  cultural_significance text,
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions text[] DEFAULT '{}',
  prep_time integer DEFAULT 0,
  cook_time integer DEFAULT 0,
  servings integer DEFAULT 1,
  difficulty text DEFAULT 'Medium',
  story text,
  tags text[] DEFAULT '{}',
  rating integer DEFAULT 5,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AR Heritage Markers Table
CREATE TABLE IF NOT EXISTS ar_heritage_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  latitude numeric,
  longitude numeric,
  historical_date text,
  media_url text,
  marker_type text DEFAULT 'location',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_heritage_markers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their voice profiles"
  ON voice_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view voice generations for their profiles"
  ON voice_generations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM voice_profiles 
    WHERE voice_profiles.id = voice_generations.voice_profile_id 
    AND voice_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their DNA analysis"
  ON dna_analysis FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their timeline events"
  ON timeline_events FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their cultural recipes"
  ON cultural_recipes FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their AR markers"
  ON ar_heritage_markers FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_generations_profile_id ON voice_generations(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_user_id ON dna_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_date ON timeline_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_cultural_recipes_user_id ON cultural_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_markers_location ON ar_heritage_markers(latitude, longitude);

-- Create updated_at triggers
CREATE TRIGGER update_voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_recipes_updated_at
  BEFORE UPDATE ON cultural_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('voice-samples', 'voice-samples', false),
  ('generated-audio', 'generated-audio', true),
  ('dna-files', 'dna-files', false),
  ('timeline-media', 'timeline-media', true),
  ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload voice samples"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can access their voice samples"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-samples' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public access to generated audio"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'generated-audio');

CREATE POLICY "Users can upload DNA files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dna-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload timeline media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'timeline-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public access to timeline media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'timeline-media');

CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public access to recipe images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'recipe-images');