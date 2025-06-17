-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS ai_conversation_context CASCADE;
DROP TABLE IF EXISTS ai_conversation_feedback CASCADE;
DROP TABLE IF EXISTS ai_conversation_analytics CASCADE;
DROP TABLE IF EXISTS user_ai_preferences CASCADE;
DROP TABLE IF EXISTS ai_research_assistants CASCADE;
DROP TABLE IF EXISTS ai_research_tasks CASCADE;
DROP TABLE IF EXISTS ai_content_generation CASCADE;
DROP TABLE IF EXISTS ai_translation_memory CASCADE;
DROP TABLE IF EXISTS ai_cultural_insights CASCADE;

-- Create AI model configurations with advanced features
CREATE TABLE IF NOT EXISTS llm_model_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    provider text NOT NULL,
    model_name text NOT NULL,
    version text NOT NULL,
    capabilities jsonb NOT NULL,
    context_window integer NOT NULL,
    max_tokens integer NOT NULL,
    temperature numeric DEFAULT 0.7,
    top_p numeric DEFAULT 1.0,
    frequency_penalty numeric DEFAULT 0.0,
    presence_penalty numeric DEFAULT 0.0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create AI conversation templates
CREATE TABLE IF NOT EXISTS ai_conversation_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    system_prompt text NOT NULL,
    context_requirements jsonb,
    example_conversations jsonb,
    metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create AI conversation context table
CREATE TABLE ai_conversation_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  context_type text NOT NULL,
  context_data jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint after table creation
ALTER TABLE ai_conversation_context
  ADD CONSTRAINT fk_conversation_context
  FOREIGN KEY (conversation_id)
  REFERENCES llm_conversations(id)
  ON DELETE CASCADE;

-- Create AI conversation feedback table
CREATE TABLE ai_conversation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  categories text[] DEFAULT '{}',
  was_helpful boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints after table creation
ALTER TABLE ai_conversation_feedback
  ADD CONSTRAINT fk_conversation_feedback
  FOREIGN KEY (conversation_id)
  REFERENCES llm_conversations(id)
  ON DELETE CASCADE;

ALTER TABLE ai_conversation_feedback
  ADD CONSTRAINT fk_user_feedback
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create AI conversation analytics table
CREATE TABLE ai_conversation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  user_message_count integer NOT NULL DEFAULT 0,
  assistant_message_count integer NOT NULL DEFAULT 0,
  average_user_message_length integer,
  average_assistant_message_length integer,
  conversation_duration_seconds integer,
  topics jsonb,
  sentiment_score numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints after table creation
ALTER TABLE ai_conversation_analytics
  ADD CONSTRAINT fk_conversation_analytics
  FOREIGN KEY (conversation_id)
  REFERENCES llm_conversations(id)
  ON DELETE CASCADE;

ALTER TABLE ai_conversation_analytics
  ADD CONSTRAINT fk_user_analytics
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create user AI preferences table
CREATE TABLE user_ai_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preferred_model_id uuid,
  conversation_settings jsonb DEFAULT '{}'::jsonb,
  privacy_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_preferences
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_preferred_model
    FOREIGN KEY (preferred_model_id)
    REFERENCES llm_model_configs(id)
    ON DELETE SET NULL
);

-- Create AI research assistants table
CREATE TABLE ai_research_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  capabilities jsonb NOT NULL,
  configuration jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_research_assistant_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create AI research tasks table
CREATE TABLE ai_research_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  task_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_data jsonb NOT NULL,
  output_data jsonb,
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_research_task_assistant
    FOREIGN KEY (assistant_id)
    REFERENCES ai_research_assistants(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_research_task_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create AI content generation table
CREATE TABLE ai_content_generation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  prompt text NOT NULL,
  generated_content text NOT NULL,
  model_used text NOT NULL,
  tokens_used integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_content_generation_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create AI translation memory table
CREATE TABLE ai_translation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_language text NOT NULL,
  target_language text NOT NULL,
  source_text text NOT NULL,
  translated_text text NOT NULL,
  context text,
  confidence_score numeric,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_translation_memory_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create AI cultural insights table
CREATE TABLE ai_cultural_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text NOT NULL,
  content text NOT NULL,
  cultural_context jsonb NOT NULL,
  source_references jsonb,
  confidence_score numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_cultural_insights_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_conversation_context_conversation ON ai_conversation_context(conversation_id);
CREATE INDEX idx_conversation_feedback_conversation ON ai_conversation_feedback(conversation_id);
CREATE INDEX idx_conversation_feedback_user ON ai_conversation_feedback(user_id);
CREATE INDEX idx_conversation_analytics_conversation ON ai_conversation_analytics(conversation_id);
CREATE INDEX idx_conversation_analytics_user ON ai_conversation_analytics(user_id);
CREATE INDEX idx_user_ai_preferences_user ON user_ai_preferences(user_id);
CREATE INDEX idx_ai_research_assistants_user ON ai_research_assistants(user_id);
CREATE INDEX idx_ai_research_tasks_assistant ON ai_research_tasks(assistant_id);
CREATE INDEX idx_ai_research_tasks_user ON ai_research_tasks(user_id);
CREATE INDEX idx_ai_content_generation_user ON ai_content_generation(user_id);
CREATE INDEX idx_ai_translation_memory_user ON ai_translation_memory(user_id);
CREATE INDEX idx_ai_translation_memory_languages ON ai_translation_memory(source_language, target_language);
CREATE INDEX idx_ai_cultural_insights_user ON ai_cultural_insights(user_id);
CREATE INDEX idx_ai_cultural_insights_type ON ai_cultural_insights(insight_type);

-- Enable Row Level Security
ALTER TABLE ai_conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_research_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_generation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cultural_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own conversation context"
  ON ai_conversation_context FOR ALL
  USING (EXISTS (
    SELECT 1 FROM llm_conversations
    WHERE id = ai_conversation_context.conversation_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own conversation feedback"
  ON ai_conversation_feedback FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own conversation analytics"
  ON ai_conversation_analytics FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own AI preferences"
  ON user_ai_preferences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own research assistants"
  ON ai_research_assistants FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own research tasks"
  ON ai_research_tasks FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own content generation"
  ON ai_content_generation FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own translation memory"
  ON ai_translation_memory FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own cultural insights"
  ON ai_cultural_insights FOR ALL
  USING (user_id = auth.uid());

-- Create function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
    p_conversation_id uuid,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
    context_type text,
    context_data jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        acc.context_type,
        acc.context_data,
        acc.created_at
    FROM 
        ai_conversation_context acc
        JOIN llm_conversations lc ON lc.id = acc.conversation_id
    WHERE 
        acc.conversation_id = p_conversation_id
        AND lc.user_id = p_user_id
    ORDER BY 
        acc.created_at DESC;
END;
$$;

-- Create function to generate AI content
CREATE OR REPLACE FUNCTION generate_ai_content(
    p_user_id uuid,
    p_content_type text,
    p_prompt text,
    p_model_used text DEFAULT 'gpt-4-turbo'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO ai_content_generation (
        user_id,
        content_type,
        prompt,
        generated_content,
        model_used
    )
    VALUES (
        p_user_id,
        p_content_type,
        p_prompt,
        'Generated content will be inserted here', -- This would be replaced by actual AI generation
        p_model_used
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Create function to update conversation analytics
CREATE OR REPLACE FUNCTION update_conversation_analytics(
    p_conversation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_message_count integer;
    v_user_message_count integer;
    v_assistant_message_count integer;
    v_avg_user_length integer;
    v_avg_assistant_length integer;
    v_duration integer;
BEGIN
    -- Get conversation user_id
    SELECT user_id INTO v_user_id
    FROM llm_conversations
    WHERE id = p_conversation_id;

    -- Get message counts and lengths
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE role = 'user'),
        COUNT(*) FILTER (WHERE role = 'assistant'),
        AVG(LENGTH(content)) FILTER (WHERE role = 'user'),
        AVG(LENGTH(content)) FILTER (WHERE role = 'assistant'),
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))
    INTO 
        v_message_count,
        v_user_message_count,
        v_assistant_message_count,
        v_avg_user_length,
        v_avg_assistant_length,
        v_duration
    FROM llm_messages
    WHERE conversation_id = p_conversation_id;

    -- Insert or update analytics
    INSERT INTO ai_conversation_analytics (
        conversation_id,
        user_id,
        message_count,
        user_message_count,
        assistant_message_count,
        average_user_message_length,
        average_assistant_message_length,
        conversation_duration_seconds
    )
    VALUES (
        p_conversation_id,
        v_user_id,
        v_message_count,
        v_user_message_count,
        v_assistant_message_count,
        v_avg_user_length,
        v_avg_assistant_length,
        v_duration
    )
    ON CONFLICT (conversation_id) DO UPDATE
    SET
        message_count = EXCLUDED.message_count,
        user_message_count = EXCLUDED.user_message_count,
        assistant_message_count = EXCLUDED.assistant_message_count,
        average_user_message_length = EXCLUDED.average_user_message_length,
        average_assistant_message_length = EXCLUDED.average_assistant_message_length,
        conversation_duration_seconds = EXCLUDED.conversation_duration_seconds,
        updated_at = now();
END;
$$;

-- Create trigger to update analytics after message insert
CREATE OR REPLACE FUNCTION trigger_update_conversation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_conversation_analytics(NEW.conversation_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_after_message
    AFTER INSERT ON llm_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_conversation_analytics();

-- Create materialized view for conversation insights
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_insights AS
SELECT 
    lc.id as conversation_id,
    lc.user_id,
    lc.created_at as conversation_start,
    lc.updated_at as conversation_end,
    aca.message_count,
    aca.user_message_count,
    aca.assistant_message_count,
    aca.average_user_message_length,
    aca.average_assistant_message_length,
    aca.conversation_duration_seconds,
    aca.sentiment_score,
    acf.rating as feedback_rating,
    acf.was_helpful as feedback_helpful
FROM 
    llm_conversations lc
    LEFT JOIN ai_conversation_analytics aca ON aca.conversation_id = lc.id
    LEFT JOIN ai_conversation_feedback acf ON acf.conversation_id = lc.id
WITH DATA;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_insights_conversation 
    ON conversation_insights(conversation_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_conversation_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_insights;
END;
$$;

-- Create scheduled job to refresh insights (runs daily)
SELECT cron.schedule(
    'refresh-conversation-insights',
    '0 0 * * *',  -- Run at midnight every day
    $$SELECT refresh_conversation_insights()$$
);

-- Insert default AI model configurations
INSERT INTO llm_model_configs (
    name,
    provider,
    model_name,
    version,
    capabilities,
    context_window,
    max_tokens,
    temperature,
    metadata
) VALUES
(
    'GPT-4 Turbo',
    'openai',
    'gpt-4-turbo-preview',
    '2024-02-15',
    '{
        "text_generation": true,
        "code_generation": true,
        "translation": true,
        "summarization": true,
        "cultural_analysis": true
    }'::jsonb,
    128000,
    4096,
    0.7,
    '{
        "description": "Most capable model for complex tasks",
        "recommended_use": "Advanced cultural analysis and research"
    }'::jsonb
),
(
    'Claude 3 Opus',
    'anthropic',
    'claude-3-opus',
    '2024-02-29',
    '{
        "text_generation": true,
        "code_generation": true,
        "translation": true,
        "summarization": true,
        "cultural_analysis": true
    }'::jsonb,
    200000,
    4096,
    0.7,
    '{
        "description": "Advanced model for cultural heritage analysis",
        "recommended_use": "Deep cultural insights and research"
    }'::jsonb
),
(
    'Gemini Pro',
    'google',
    'gemini-pro',
    '1.5',
    '{
        "text_generation": true,
        "code_generation": true,
        "translation": true,
        "summarization": true,
        "cultural_analysis": true
    }'::jsonb,
    32768,
    2048,
    0.7,
    '{
        "description": "Efficient model for general tasks",
        "recommended_use": "Quick translations and basic analysis"
    }'::jsonb
)
ON CONFLICT (name, provider) DO UPDATE SET
    version = EXCLUDED.version,
    capabilities = EXCLUDED.capabilities,
    context_window = EXCLUDED.context_window,
    max_tokens = EXCLUDED.max_tokens,
    temperature = EXCLUDED.temperature,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- Insert default conversation templates
INSERT INTO ai_conversation_templates (
    name,
    description,
    system_prompt,
    context_requirements,
    example_conversations,
    metadata
) VALUES
(
    'Cultural Heritage Research',
    'Template for researching cultural heritage topics',
    'You are a knowledgeable cultural heritage research assistant. Your role is to help users explore and understand their cultural heritage, traditions, and family history. Provide accurate, well-researched information while being sensitive to cultural nuances and personal connections.',
    '{
        "required_context": ["user_heritage", "research_goals"],
        "optional_context": ["family_history", "cultural_background"]
    }'::jsonb,
    '[
        {
            "user": "Can you help me research my family''s traditional recipes?",
            "assistant": "I''d be happy to help you explore your family''s culinary heritage. Could you tell me more about your family''s cultural background and any specific recipes you''re interested in?"
        }
    ]'::jsonb,
    '{
        "use_case": "cultural_research",
        "recommended_model": "claude-3-opus"
    }'::jsonb
),
(
    'DNA Analysis Interpretation',
    'Template for interpreting DNA analysis results',
    'You are a DNA analysis interpretation assistant. Help users understand their genetic ancestry, health insights, and family connections based on their DNA test results. Provide clear explanations while being sensitive to potentially sensitive information.',
    '{
        "required_context": ["dna_test_results", "user_concerns"],
        "optional_context": ["family_tree", "health_history"]
    }'::jsonb,
    '[
        {
            "user": "What do these ethnicity percentages mean?",
            "assistant": "I''ll help you understand your ethnicity estimates. Could you share which DNA testing company you used and what regions were identified in your results?"
        }
    ]'::jsonb,
    '{
        "use_case": "dna_analysis",
        "recommended_model": "gpt-4-turbo"
    }'::jsonb
),
(
    'Cultural Story Preservation',
    'Template for preserving and documenting cultural stories',
    'You are a cultural story preservation assistant. Help users document, preserve, and share their family stories and cultural traditions. Guide them in capturing important details while maintaining cultural authenticity.',
    '{
        "required_context": ["story_type", "cultural_context"],
        "optional_context": ["family_members", "historical_period"]
    }'::jsonb,
    '[
        {
            "user": "How can I document my grandmother''s traditional stories?",
            "assistant": "I''ll help you preserve your grandmother''s stories. Could you tell me about the type of stories she shares and any specific cultural traditions they relate to?"
        }
    ]'::jsonb,
    '{
        "use_case": "story_preservation",
        "recommended_model": "claude-3-opus"
    }'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    context_requirements = EXCLUDED.context_requirements,
    example_conversations = EXCLUDED.example_conversations,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- Create verification query
SELECT 
    'Database setup completed successfully' as status,
    (SELECT COUNT(*) FROM llm_model_configs) as model_configs_count,
    (SELECT COUNT(*) FROM ai_conversation_templates) as templates_count;

-- Create function to get chat history
CREATE OR REPLACE FUNCTION get_chat_history(
  p_session_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check if user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 
    FROM llm_conversations 
    WHERE id = p_session_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to access this conversation';
  END IF;

  SELECT json_build_object(
    'session', (
      SELECT json_build_object(
        'id', id,
        'title', title,
        'created_at', created_at,
        'updated_at', updated_at,
        'context', context
      )
      FROM llm_conversations
      WHERE id = p_session_id
    ),
    'messages', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'role', role,
          'content', content,
          'created_at', created_at,
          'model_used', model_used,
          'tokens_used', tokens_used,
          'metadata', metadata
        )
        ORDER BY created_at ASC
      )
      FROM llm_messages
      WHERE conversation_id = p_session_id
      LIMIT p_limit
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$; 