-- Advanced Cultural Heritage and Historical Records

-- Create historical records table
CREATE TABLE IF NOT EXISTS historical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type text NOT NULL,
  title text NOT NULL,
  description text,
  date_from date,
  date_to date,
  location jsonb,
  source text NOT NULL,
  source_url text,
  document_url text,
  transcription text,
  metadata jsonb,
  tags text[],
  is_verified boolean DEFAULT false,
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create historical events table
CREATE TABLE IF NOT EXISTS historical_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date,
  event_type text NOT NULL,
  location jsonb,
  historical_context text,
  significance text,
  related_records uuid[],
  related_people uuid[],
  source_references jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create historical figures table
CREATE TABLE IF NOT EXISTS historical_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date date,
  death_date date,
  birth_location jsonb,
  death_location jsonb,
  biography text,
  occupation text[],
  achievements text[],
  historical_significance text,
  related_events uuid[],
  related_records uuid[],
  source_references jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cultural artifacts table
CREATE TABLE IF NOT EXISTS cultural_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  artifact_type text NOT NULL,
  description text,
  creation_date date,
  origin_location jsonb,
  current_location jsonb,
  cultural_significance text,
  materials text[],
  dimensions jsonb,
  condition text,
  conservation_notes text,
  images jsonb,
  related_records uuid[],
  source_references jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cultural traditions table
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

-- Create historical documents table
CREATE TABLE IF NOT EXISTS historical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  document_type text NOT NULL,
  description text,
  creation_date date,
  author text,
  location jsonb,
  language text,
  content text,
  transcription text,
  translation text,
  metadata jsonb,
  related_records uuid[],
  source_references jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create historical places table
CREATE TABLE IF NOT EXISTS historical_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  place_type text NOT NULL,
  description text,
  location jsonb NOT NULL,
  historical_period text,
  cultural_significance text,
  current_status text,
  architectural_style text[],
  related_events uuid[],
  related_records uuid[],
  images jsonb,
  source_references jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user heritage connections table
CREATE TABLE IF NOT EXISTS user_heritage_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type text NOT NULL,
  connected_id uuid NOT NULL,
  connection_details jsonb,
  confidence_score numeric,
  verification_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, connection_type, connected_id)
);

-- Insert sample historical records
INSERT INTO historical_records (
  record_type,
  title,
  description,
  date_from,
  date_to,
  location,
  source,
  source_url,
  transcription,
  tags,
  is_verified
)
VALUES
  (
    'Census Record',
    '1851 Census of Canada',
    'Population census record for Ontario, Canada',
    '1851-01-01',
    '1851-12-31',
    '{"country": "Canada", "province": "Ontario", "city": "Toronto"}'::jsonb,
    'Library and Archives Canada',
    'https://www.bac-lac.gc.ca/eng/census/1851/Pages/about-census.aspx',
    'Household of John Smith, Farmer, Age 45, Born in England...',
    ARRAY['census', 'immigration', 'family history'],
    true
  ),
  (
    'Immigration Record',
    'Ellis Island Arrival Record',
    'Passenger manifest for SS Britannia',
    '1892-01-15',
    '1892-01-15',
    '{"country": "USA", "state": "New York", "city": "New York"}'::jsonb,
    'National Archives and Records Administration',
    'https://www.archives.gov/',
    'Passenger: Mary Johnson, Age 25, Origin: Ireland...',
    ARRAY['immigration', 'passenger list', 'family history'],
    true
  );

-- Insert sample historical events
INSERT INTO historical_events (
  title,
  description,
  event_date,
  event_type,
  location,
  historical_context,
  significance
)
VALUES
  (
    'Great Famine Migration',
    'Mass migration of Irish people to North America during the Great Famine',
    '1845-01-01',
    'Migration Event',
    '{"from": {"country": "Ireland"}, "to": {"country": "United States", "country": "Canada"}}'::jsonb,
    'The Great Famine (1845-1852) caused mass starvation and disease in Ireland',
    'One of the largest mass migrations in history, significantly impacting the demographic makeup of North America'
  ),
  (
    'Transcontinental Railroad Completion',
    'Completion of the first transcontinental railroad in the United States',
    '1869-05-10',
    'Infrastructure Development',
    '{"country": "USA", "state": "Utah", "city": "Promontory Summit"}'::jsonb,
    'Part of the westward expansion of the United States',
    'Revolutionized transportation and migration patterns in North America'
  );

-- Insert sample historical figures
INSERT INTO historical_figures (
  name,
  birth_date,
  death_date,
  birth_location,
  death_location,
  biography,
  occupation,
  achievements,
  historical_significance
)
VALUES
  (
    'John A. Macdonald',
    '1815-01-11',
    '1891-06-06',
    '{"country": "United Kingdom", "city": "Glasgow"}'::jsonb,
    '{"country": "Canada", "city": "Ottawa"}'::jsonb,
    'First Prime Minister of Canada, played a crucial role in Confederation',
    ARRAY['Politician', 'Lawyer'],
    ARRAY['First Prime Minister of Canada', 'Father of Confederation'],
    'Key figure in Canadian history and nation-building'
  ),
  (
    'Laura Secord',
    '1775-09-13',
    '1868-10-17',
    '{"country": "USA", "state": "Massachusetts"}'::jsonb,
    '{"country": "Canada", "province": "Ontario"}'::jsonb,
    'Canadian heroine of the War of 1812',
    ARRAY['Heroine', 'Farmer'],
    ARRAY['War of 1812 Heroine', 'Canadian Patriot'],
    'Symbol of Canadian patriotism and women''s contribution to history'
  );

-- Insert sample cultural artifacts
INSERT INTO cultural_artifacts (
  name,
  artifact_type,
  description,
  creation_date,
  origin_location,
  current_location,
  cultural_significance,
  materials,
  dimensions
)
VALUES
  (
    'First Nations Totem Pole',
    'Carved Wooden Artifact',
    'Traditional totem pole depicting family crests and stories',
    '1850-01-01',
    '{"country": "Canada", "province": "British Columbia", "region": "Pacific Northwest"}'::jsonb,
    '{"country": "Canada", "province": "British Columbia", "city": "Vancouver", "institution": "Museum of Anthropology"}'::jsonb,
    'Represents family lineage and cultural heritage of Pacific Northwest First Nations',
    ARRAY['Cedar', 'Natural Pigments'],
    '{"height": "12m", "width": "0.8m", "depth": "0.8m"}'::jsonb
  ),
  (
    'Acadian Spinning Wheel',
    'Household Artifact',
    'Traditional spinning wheel used by Acadian settlers',
    '1750-01-01',
    '{"country": "Canada", "province": "Nova Scotia", "region": "Acadia"}'::jsonb,
    '{"country": "Canada", "province": "Nova Scotia", "city": "Halifax", "institution": "Nova Scotia Museum"}'::jsonb,
    'Represents traditional Acadian craftsmanship and daily life',
    ARRAY['Wood', 'Metal', 'Leather'],
    '{"height": "1.2m", "width": "0.8m", "depth": "0.6m"}'::jsonb
  );

-- Insert sample cultural traditions
INSERT INTO cultural_traditions (
  name,
  tradition_type,
  description,
  origin_date,
  origin_location,
  current_practice_location,
  cultural_significance,
  practices
)
VALUES
  (
    'Métis Jigging',
    'Dance Tradition',
    'Traditional Métis dance combining First Nations and European influences',
    '1800-01-01',
    '{"country": "Canada", "region": "Prairies"}'::jsonb,
    ARRAY[
      '{"country": "Canada", "province": "Manitoba"}',
      '{"country": "Canada", "province": "Saskatchewan"}',
      '{"country": "Canada", "province": "Alberta"}'
    ]::jsonb[],
    'Represents the unique cultural fusion of Métis heritage',
    ARRAY['Traditional jig steps', 'Fiddle music', 'Community celebrations']
  ),
  (
    'Québécois Sugar Shack',
    'Culinary Tradition',
    'Traditional maple syrup production and celebration',
    '1700-01-01',
    '{"country": "Canada", "province": "Quebec"}'::jsonb,
    ARRAY[
      '{"country": "Canada", "province": "Quebec"}',
      '{"country": "Canada", "province": "Ontario"}',
      '{"country": "Canada", "province": "New Brunswick"}'
    ]::jsonb[],
    'Celebrates Canadian maple syrup production and rural heritage',
    ARRAY['Maple syrup production', 'Traditional meals', 'Spring celebrations']
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_historical_records_type ON historical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_historical_records_dates ON historical_records(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_historical_events_date ON historical_events(event_date);
CREATE INDEX IF NOT EXISTS idx_historical_figures_dates ON historical_figures(birth_date, death_date);
CREATE INDEX IF NOT EXISTS idx_cultural_artifacts_type ON cultural_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_cultural_traditions_type ON cultural_traditions(tradition_type);
CREATE INDEX IF NOT EXISTS idx_user_heritage_connections ON user_heritage_connections(user_id, connection_type);

-- Enable Row Level Security
ALTER TABLE historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_traditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_heritage_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view historical records"
  ON historical_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view historical events"
  ON historical_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view historical figures"
  ON historical_figures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view cultural artifacts"
  ON cultural_artifacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view cultural traditions"
  ON cultural_traditions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view historical documents"
  ON historical_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view historical places"
  ON historical_places FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own heritage connections"
  ON user_heritage_connections FOR SELECT
  USING (auth.uid() = user_id); 