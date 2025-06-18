-- Advanced DNA Analysis and Genetic Features

-- Create DNA analysis results table with advanced features
CREATE TABLE IF NOT EXISTS dna_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id text NOT NULL,
  test_date timestamptz NOT NULL,
  test_provider text NOT NULL,
  raw_data jsonb,
  ethnicity_breakdown jsonb NOT NULL,
  genetic_matches jsonb,
  health_insights jsonb,
  traits_analysis jsonb,
  migration_patterns jsonb,
  haplogroups jsonb,
  genetic_communities jsonb,
  confidence_scores jsonb,
  privacy_settings jsonb DEFAULT '{
    "share_ethnicity": true,
    "share_health": false,
    "share_matches": true,
    "share_traits": true,
    "share_communities": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create DNA matches table
CREATE TABLE IF NOT EXISTS dna_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  match_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_dna_cm numeric NOT NULL,
  shared_segments jsonb NOT NULL,
  relationship_estimate text,
  confidence_score numeric,
  common_ancestors jsonb,
  match_date timestamptz DEFAULT now(),
  is_contacted boolean DEFAULT false,
  contact_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_user_id)
);

-- Create genetic communities table
CREATE TABLE IF NOT EXISTS genetic_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  region text,
  time_period text,
  genetic_markers jsonb,
  member_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create genetic traits table
CREATE TABLE IF NOT EXISTS genetic_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  genetic_markers jsonb,
  prevalence jsonb,
  scientific_references jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user genetic traits table
CREATE TABLE IF NOT EXISTS user_genetic_traits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trait_id uuid REFERENCES genetic_traits(id) ON DELETE CASCADE,
  result text NOT NULL,
  confidence_score numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, trait_id)
);

-- Create DNA health insights table
CREATE TABLE IF NOT EXISTS dna_health_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  insight_type text NOT NULL,
  result text NOT NULL,
  risk_level text,
  scientific_references jsonb,
  recommendations jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create migration patterns table
CREATE TABLE IF NOT EXISTS migration_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  time_period text NOT NULL,
  region text NOT NULL,
  confidence_score numeric,
  genetic_evidence jsonb,
  historical_context jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample genetic communities
INSERT INTO genetic_communities (name, description, region, time_period, genetic_markers, is_verified)
VALUES
  ('North Atlantic Settlers', 'Early settlers of the North Atlantic region', 'North Atlantic', '1500-1800', '{"markers": ["R1b", "I1", "R1a"]}', true),
  ('Mediterranean Traders', 'Ancient Mediterranean trading communities', 'Mediterranean', '1000-1500', '{"markers": ["E1b1b", "J2", "T"]}', true),
  ('Central Asian Nomads', 'Historical nomadic communities of Central Asia', 'Central Asia', '500-1500', '{"markers": ["C2", "N", "Q"]}', true),
  ('Pacific Islanders', 'Traditional Pacific Island communities', 'Pacific Islands', '1000-1800', '{"markers": ["O", "C1", "B4"]}', true),
  ('West African Traders', 'Historical West African trading communities', 'West Africa', '1000-1800', '{"markers": ["E1b1a", "E2", "A1"]}', true);

-- Insert sample genetic traits
INSERT INTO genetic_traits (name, description, genetic_markers, prevalence, scientific_references)
VALUES
  ('Lactose Tolerance', 'Ability to digest lactose in adulthood', '{"markers": ["rs4988235"]}', '{"global": 0.35, "european": 0.75}', '{"papers": ["PMID:12345678"]}'),
  ('Bitter Taste Perception', 'Sensitivity to bitter tastes', '{"markers": ["rs713598"]}', '{"global": 0.25}', '{"papers": ["PMID:23456789"]}'),
  ('Earwax Type', 'Type of earwax (wet/dry)', '{"markers": ["rs17822931"]}', '{"global": 0.50}', '{"papers": ["PMID:34567890"]}'),
  ('Hair Color', 'Natural hair color variation', '{"markers": ["rs1805007", "rs1805008"]}', '{"global": "variable"}', '{"papers": ["PMID:45678901"]}'),
  ('Eye Color', 'Natural eye color variation', '{"markers": ["rs12913832"]}', '{"global": "variable"}', '{"papers": ["PMID:56789012"]}');

-- Insert sample DNA analysis results
INSERT INTO dna_analysis_results (
  user_id,
  test_id,
  test_date,
  test_provider,
  ethnicity_breakdown,
  genetic_matches,
  health_insights,
  traits_analysis,
  migration_patterns,
  haplogroups,
  genetic_communities,
  confidence_scores
)
SELECT 
  id,
  'TEST-' || gen_random_uuid(),
  now() - interval '1 year',
  'Genesis DNA',
  '{
    "regions": [
      {"region": "Northern Europe", "percentage": 45.5, "confidence": 0.95},
      {"region": "Western Europe", "percentage": 30.2, "confidence": 0.92},
      {"region": "Southern Europe", "percentage": 15.3, "confidence": 0.88},
      {"region": "Eastern Europe", "percentage": 9.0, "confidence": 0.85}
    ]
  }'::jsonb,
  '{
    "total_matches": 1250,
    "close_matches": 45,
    "distant_matches": 1205
  }'::jsonb,
  '{
    "health_risks": [
      {"condition": "Type 2 Diabetes", "risk_level": "moderate", "confidence": 0.85},
      {"condition": "Heart Disease", "risk_level": "low", "confidence": 0.90}
    ],
    "carrier_status": [
      {"condition": "Cystic Fibrosis", "status": "carrier", "confidence": 0.95},
      {"condition": "Sickle Cell", "status": "non-carrier", "confidence": 0.98}
    ]
  }'::jsonb,
  '{
    "traits": [
      {"trait": "Lactose Tolerance", "result": "tolerant", "confidence": 0.95},
      {"trait": "Bitter Taste", "result": "sensitive", "confidence": 0.88},
      {"trait": "Earwax Type", "result": "wet", "confidence": 0.92}
    ]
  }'::jsonb,
  '{
    "patterns": [
      {"period": "1500-1800", "region": "Northern Europe", "confidence": 0.90},
      {"period": "1000-1500", "region": "Western Europe", "confidence": 0.85}
    ]
  }'::jsonb,
  '{
    "maternal": "H1",
    "paternal": "R1b",
    "confidence": 0.95
  }'::jsonb,
  '{
    "communities": [
      {"name": "North Atlantic Settlers", "confidence": 0.92},
      {"name": "Western European Farmers", "confidence": 0.88}
    ]
  }'::jsonb,
  '{
    "ethnicity": 0.95,
    "health": 0.90,
    "traits": 0.92,
    "migration": 0.88,
    "communities": 0.90
  }'::jsonb
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert sample DNA matches
INSERT INTO dna_matches (
  user_id,
  match_user_id,
  shared_dna_cm,
  shared_segments,
  relationship_estimate,
  confidence_score,
  common_ancestors
)
SELECT 
  u1.id,
  u2.id,
  150.5,
  '[
    {"chromosome": 1, "start": 1000000, "end": 2000000, "cm": 45.2},
    {"chromosome": 2, "start": 5000000, "end": 6000000, "cm": 35.3},
    {"chromosome": 3, "start": 3000000, "end": 4000000, "cm": 70.0}
  ]'::jsonb,
  '3rd Cousin',
  0.95,
  '[
    {"name": "John Smith", "relationship": "Great-Great-Grandfather", "birth_date": "1850"},
    {"name": "Mary Smith", "relationship": "Great-Great-Grandmother", "birth_date": "1852"}
  ]'::jsonb
FROM auth.users u1
CROSS JOIN auth.users u2
WHERE u1.id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
AND u2.id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ON CONFLICT DO NOTHING;

-- Insert sample health insights
INSERT INTO dna_health_insights (
  user_id,
  category,
  insight_type,
  result,
  risk_level,
  scientific_references,
  recommendations
)
SELECT 
  id,
  unnest(ARRAY[
    'Metabolic',
    'Cardiovascular',
    'Immune System',
    'Neurological',
    'Musculoskeletal'
  ]),
  unnest(ARRAY[
    'Diabetes Risk',
    'Heart Disease Risk',
    'Autoimmune Risk',
    'Cognitive Health',
    'Bone Health'
  ]),
  unnest(ARRAY[
    'Moderate risk for Type 2 Diabetes',
    'Low risk for Coronary Heart Disease',
    'Elevated risk for Rheumatoid Arthritis',
    'Normal cognitive aging pattern',
    'Normal bone density pattern'
  ]),
  unnest(ARRAY[
    'moderate',
    'low',
    'elevated',
    'normal',
    'normal'
  ]),
  unnest(ARRAY[
    '{"papers": ["PMID:12345678", "PMID:23456789"]}'::jsonb,
    '{"papers": ["PMID:34567890", "PMID:45678901"]}'::jsonb,
    '{"papers": ["PMID:56789012", "PMID:67890123"]}'::jsonb,
    '{"papers": ["PMID:78901234", "PMID:89012345"]}'::jsonb,
    '{"papers": ["PMID:90123456", "PMID:01234567"]}'::jsonb
  ]),
  unnest(ARRAY[
    '{"lifestyle": ["Regular exercise", "Balanced diet"], "monitoring": ["Annual glucose check"]}'::jsonb,
    '{"lifestyle": ["Heart-healthy diet", "Regular exercise"], "monitoring": ["Annual checkup"]}'::jsonb,
    '{"lifestyle": ["Anti-inflammatory diet", "Stress management"], "monitoring": ["Regular checkups"]}'::jsonb,
    '{"lifestyle": ["Mental exercise", "Social engagement"], "monitoring": ["Annual cognitive assessment"]}'::jsonb,
    '{"lifestyle": ["Calcium-rich diet", "Weight-bearing exercise"], "monitoring": ["Bone density scan every 2 years"]}'::jsonb
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dna_analysis_user ON dna_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_dna_matches_users ON dna_matches(user_id, match_user_id);
CREATE INDEX IF NOT EXISTS idx_genetic_traits_name ON genetic_traits(name);
CREATE INDEX IF NOT EXISTS idx_user_genetic_traits ON user_genetic_traits(user_id, trait_id);
CREATE INDEX IF NOT EXISTS idx_dna_health_user ON dna_health_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_patterns_user ON migration_patterns(user_id);

-- Enable Row Level Security
ALTER TABLE dna_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_genetic_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_health_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own DNA analysis"
  ON dna_analysis_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own DNA matches"
  ON dna_matches FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = match_user_id);

CREATE POLICY "Users can view genetic communities"
  ON genetic_communities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view genetic traits"
  ON genetic_traits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own genetic traits"
  ON user_genetic_traits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own health insights"
  ON dna_health_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own migration patterns"
  ON migration_patterns FOR SELECT
  USING (auth.uid() = user_id); 