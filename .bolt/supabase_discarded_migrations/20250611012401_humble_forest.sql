/*
  # Create AI Conversation History System

  1. New Tables
    - `ai_conversation_history` - Stores all conversation messages with embedding support
    - `ai_custom_instructions` - Stores user-defined custom instructions for the AI
    - `ai_feedback` - Stores user feedback on AI responses
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Functions
    - Add function to get conversation context
    - Add function to find similar messages using vector similarity
*/

-- Create extension for vector operations if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Create AI conversation history table
CREATE TABLE IF NOT EXISTS ai_conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_index integer NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  model_used text,
  tokens_used integer,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index on session_id and message_index
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_session ON ai_conversation_history(session_id, message_index);

-- Create index on user_id and created_at
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_user_time ON ai_conversation_history(user_id, created_at);

-- Create vector index for embeddings
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_embedding ON ai_conversation_history USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create custom instructions table
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_custom_instructions_user ON ai_custom_instructions(user_id) WHERE is_active = true;

-- Create AI feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  response_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  was_helpful boolean,
  categories text[],
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id and created_at
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_time ON ai_feedback(user_id, created_at);

-- Create AI embeddings table for knowledge base
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on content_type and content_id
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_content ON ai_embeddings(content_type, content_id);

-- Create vector index for embeddings
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_embedding ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create AI request logs table
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id text NOT NULL,
  request_type text,
  prompt_length integer,
  response_length integer,
  tokens_used integer,
  cost numeric,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for AI request logs
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider_id ON ai_request_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);

-- Create AI service configuration table
CREATE TABLE IF NOT EXISTS ai_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations"
  ON ai_conversation_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their custom instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can provide feedback"
  ON ai_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback"
  ON ai_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their embeddings"
  ON ai_embeddings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all request logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage AI service config"
  ON ai_service_config
  FOR ALL
  TO authenticated
  USING ((SELECT role_name FROM admin_roles WHERE user_id = auth.uid()) = 'admin');

-- Create function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_session_id text,
  p_user_id uuid,
  p_max_messages integer DEFAULT 10
)
RETURNS TABLE (
  role text,
  content text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT ch.role, ch.content, ch.created_at
  FROM ai_conversation_history ch
  WHERE ch.session_id = p_session_id
  AND ch.user_id = p_user_id
  ORDER BY ch.message_index ASC
  LIMIT p_max_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find similar messages using vector similarity
CREATE OR REPLACE FUNCTION find_similar_messages(
  p_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  role text,
  content text,
  similarity float,
  session_id text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.role,
    ch.content,
    1 - (ch.embedding <=> p_embedding) as similarity,
    ch.session_id,
    ch.created_at
  FROM ai_conversation_history ch
  WHERE ch.embedding IS NOT NULL
  AND (p_user_id IS NULL OR ch.user_id = p_user_id)
  AND 1 - (ch.embedding <=> p_embedding) > p_match_threshold
  ORDER BY ch.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find similar content in knowledge base
CREATE OR REPLACE FUNCTION find_similar_content(
  p_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id text,
  content text,
  similarity float,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_type,
    e.content_id,
    e.content,
    1 - (e.embedding <=> p_embedding) as similarity,
    e.created_at
  FROM ai_embeddings e
  WHERE e.embedding IS NOT NULL
  AND (p_user_id IS NULL OR e.user_id = p_user_id)
  AND 1 - (e.embedding <=> p_embedding) > p_match_threshold
  ORDER BY e.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log AI requests
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text DEFAULT 'chat',
  p_prompt_length integer DEFAULT NULL,
  p_response_length integer DEFAULT NULL,
  p_tokens_used integer DEFAULT NULL,
  p_cost numeric DEFAULT NULL,
  p_response_time_ms integer DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO ai_request_logs (
    user_id,
    provider_id,
    request_type,
    prompt_length,
    response_length,
    tokens_used,
    cost,
    response_time_ms,
    success,
    error_message,
    created_at
  ) VALUES (
    p_user_id,
    p_provider_id,
    p_request_type,
    p_prompt_length,
    p_response_length,
    p_tokens_used,
    p_cost,
    p_response_time_ms,
    p_success,
    p_error_message,
    now()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update embedding when content changes
CREATE OR REPLACE FUNCTION update_ai_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder. In a real implementation, you would call an external service
  -- to generate the embedding, or use pgvector's built-in functions if available.
  -- For now, we'll just set it to NULL and handle embedding generation in the application.
  NEW.embedding = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_conversation_history
CREATE TRIGGER update_ai_conversation_embedding
BEFORE INSERT OR UPDATE OF content ON ai_conversation_history
FOR EACH ROW
WHEN (NEW.embedding IS NULL)
EXECUTE FUNCTION update_ai_embedding();

-- Create trigger for ai_embeddings
CREATE TRIGGER update_ai_knowledge_embedding
BEFORE INSERT OR UPDATE OF content ON ai_embeddings
FOR EACH ROW
WHEN (NEW.embedding IS NULL)
EXECUTE FUNCTION update_ai_embedding();

-- Insert default AI service configurations
INSERT INTO ai_service_config (service_name, is_active, config)
VALUES 
  ('openai', true, '{"default_model": "gpt-4-turbo-preview", "streaming": true}'),
  ('anthropic', true, '{"default_model": "claude-3-opus", "streaming": true}'),
  ('google', true, '{"default_model": "gemini-pro", "streaming": false}')
ON CONFLICT (service_name) DO NOTHING;