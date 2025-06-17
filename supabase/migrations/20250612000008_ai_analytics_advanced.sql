-- Advanced AI and Analytics Features

-- Create AI models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_type text NOT NULL,
  description text,
  provider text NOT NULL,
  version text NOT NULL,
  capabilities jsonb NOT NULL,
  parameters jsonb,
  performance_metrics jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI prompts table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prompt_type text NOT NULL,
  description text,
  prompt_template text NOT NULL,
  variables jsonb,
  model_id uuid REFERENCES ai_models(id),
  context_requirements jsonb,
  example_outputs jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid REFERENCES ai_models(id),
  title text,
  context jsonb,
  metadata jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  tokens_used integer,
  processing_time numeric,
  created_at timestamptz DEFAULT now()
);

-- Create AI analysis results table
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  model_id uuid REFERENCES ai_models(id),
  input_data jsonb,
  output_data jsonb NOT NULL,
  confidence_scores jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create AI training data table
CREATE TABLE IF NOT EXISTS ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL,
  content jsonb NOT NULL,
  metadata jsonb,
  quality_score numeric,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  session_id text,
  device_info jsonb,
  location jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create system analytics table
CREATE TABLE IF NOT EXISTS system_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_type text NOT NULL,
  dimension jsonb,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb
);

-- Create AI feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES ai_analysis_results(id),
  conversation_id uuid REFERENCES ai_conversations(id),
  feedback_type text NOT NULL,
  rating integer,
  comments text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample AI models
INSERT INTO ai_models (
  name,
  model_type,
  description,
  provider,
  version,
  capabilities,
  parameters,
  performance_metrics
)
VALUES
  (
    'GenealogyGPT',
    'language_model',
    'Specialized model for genealogy research and family history analysis',
    'Genesis AI',
    '1.0.0',
    '{
      "capabilities": [
        "family tree analysis",
        "historical context generation",
        "document interpretation",
        "relationship inference",
        "cultural heritage analysis"
      ]
    }'::jsonb,
    '{
      "temperature": 0.7,
      "max_tokens": 2000,
      "top_p": 0.9
    }'::jsonb,
    '{
      "accuracy": 0.92,
      "response_time": 1.5,
      "user_satisfaction": 0.88
    }'::jsonb
  ),
  (
    'DNAAnalyzer',
    'analysis_model',
    'Specialized model for DNA analysis and genetic interpretation',
    'Genesis AI',
    '1.0.0',
    '{
      "capabilities": [
        "ethnicity estimation",
        "genetic matching",
        "health insights",
        "trait prediction",
        "migration analysis"
      ]
    }'::jsonb,
    '{
      "confidence_threshold": 0.85,
      "analysis_depth": "comprehensive"
    }'::jsonb,
    '{
      "accuracy": 0.95,
      "processing_time": 2.0,
      "scientific_validation": 0.90
    }'::jsonb
  );

-- Insert sample AI prompts
INSERT INTO ai_prompts (
  name,
  prompt_type,
  description,
  prompt_template,
  variables,
  model_id,
  context_requirements,
  example_outputs
)
VALUES
  (
    'Family History Analysis',
    'genealogy',
    'Analyzes family history and generates insights',
    'Analyze the following family history data and provide insights about {family_name}: {family_data}. Consider the following aspects: {analysis_aspects}',
    '{
      "family_name": "string",
      "family_data": "json",
      "analysis_aspects": "array"
    }'::jsonb,
    (SELECT id FROM ai_models WHERE name = 'GenealogyGPT'),
    '{
      "required_data": [
        "family_members",
        "relationships",
        "events",
        "locations"
      ]
    }'::jsonb,
    '{
      "examples": [
        {
          "input": {
            "family_name": "Smith",
            "family_data": {"members": [...], "events": [...]},
            "analysis_aspects": ["migration", "occupation", "social_status"]
          },
          "output": {
            "insights": [...],
            "patterns": [...],
            "recommendations": [...]
          }
        }
      ]
    }'::jsonb
  ),
  (
    'DNA Interpretation',
    'dna_analysis',
    'Interprets DNA results and provides detailed analysis',
    'Analyze the following DNA results for {user_name}: {dna_data}. Focus on: {analysis_focus}',
    '{
      "user_name": "string",
      "dna_data": "json",
      "analysis_focus": "array"
    }'::jsonb,
    (SELECT id FROM ai_models WHERE name = 'DNAAnalyzer'),
    '{
      "required_data": [
        "ethnicity_breakdown",
        "genetic_matches",
        "health_insights",
        "traits"
      ]
    }'::jsonb,
    '{
      "examples": [
        {
          "input": {
            "user_name": "John Doe",
            "dna_data": {"ethnicity": [...], "matches": [...]},
            "analysis_focus": ["ethnicity", "health", "traits"]
          },
          "output": {
            "interpretation": [...],
            "insights": [...],
            "recommendations": [...]
          }
        }
      ]
    }'::jsonb
  );

-- Insert sample AI analysis results
INSERT INTO ai_analysis_results (
  user_id,
  analysis_type,
  model_id,
  input_data,
  output_data,
  confidence_scores
)
SELECT 
  id,
  'family_history',
  (SELECT id FROM ai_models WHERE name = 'GenealogyGPT'),
  '{
    "family_members": [
      {
        "name": "John Smith",
        "birth_date": "1850-01-15",
        "birth_location": {"country": "England", "city": "London"},
        "occupation": ["Farmer", "Shopkeeper"]
      }
    ],
    "events": [
      {
        "type": "immigration",
        "date": "1870-05-15",
        "location": {"country": "Canada", "province": "Ontario"}
      }
    ]
  }'::jsonb,
  '{
    "insights": [
      {
        "type": "migration_pattern",
        "description": "Family migrated from England to Canada during the late 19th century",
        "confidence": 0.95
      },
      {
        "type": "occupation_trend",
        "description": "Transition from agricultural to commercial occupations",
        "confidence": 0.88
      }
    ],
    "recommendations": [
      {
        "type": "research",
        "suggestion": "Investigate Canadian immigration records from 1870",
        "priority": "high"
      },
      {
        "type": "documentation",
        "suggestion": "Document family business history in Ontario",
        "priority": "medium"
      }
    ]
  }'::jsonb,
  '{
    "overall": 0.92,
    "migration_analysis": 0.95,
    "occupation_analysis": 0.88,
    "historical_context": 0.90
  }'::jsonb
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_user ON ai_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_type ON ai_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_system_analytics_metric ON system_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_analytics_timestamp ON system_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);

-- Enable Row Level Security
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active AI models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active AI prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
  ON ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE id = ai_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own analysis results"
  ON ai_analysis_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
  ON user_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to track user analytics
CREATE OR REPLACE FUNCTION track_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_analytics (
    user_id,
    event_type,
    event_data,
    session_id,
    device_info,
    location
  )
  VALUES (
    NEW.user_id,
    NEW.event_type,
    NEW.event_data,
    NEW.session_id,
    NEW.device_info,
    NEW.location
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user analytics
CREATE TRIGGER track_user_analytics_trigger
  AFTER INSERT ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION track_user_analytics();

-- Create function to update system analytics
CREATE OR REPLACE FUNCTION update_system_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update various system metrics based on the event
  INSERT INTO system_analytics (
    metric_name,
    metric_value,
    metric_type,
    dimension,
    metadata
  )
  VALUES
    ('active_users', 
     (SELECT COUNT(DISTINCT user_id) FROM user_analytics 
      WHERE created_at > NOW() - INTERVAL '1 hour'),
     'counter',
     '{"timeframe": "hourly"}'::jsonb,
     '{"source": "user_analytics"}'::jsonb
    ),
    ('ai_requests',
     (SELECT COUNT(*) FROM ai_analysis_results 
      WHERE created_at > NOW() - INTERVAL '1 hour'),
     'counter',
     '{"timeframe": "hourly"}'::jsonb,
     '{"source": "ai_analysis"}'::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for system analytics
CREATE TRIGGER update_system_analytics_trigger
  AFTER INSERT ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_system_analytics(); 