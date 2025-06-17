/*
  # Enhanced AI Capabilities

  1. New Tables
    - `ai_prompts` - Stores pre-defined prompts for different use cases
    - `ai_conversation_history` - Stores user conversation history for context
    - `ai_feedback` - Stores user feedback on AI responses
    - `ai_embeddings` - Stores vector embeddings for semantic search
    - `ai_custom_instructions` - Stores user-specific AI instructions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Changes
    - Add vector support for semantic search
    - Add functions for AI routing and context management
*/

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Prompts Table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt_text text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prompts"
  ON ai_prompts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

-- AI Conversation History Table
CREATE TABLE IF NOT EXISTS ai_conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_index integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  model_used text,
  tokens_used integer,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own conversation history"
  ON ai_conversation_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversation_history_session
  ON ai_conversation_history(user_id, session_id, message_index);

-- Create vector index for semantic search
CREATE INDEX IF NOT EXISTS idx_conversation_history_embedding
  ON ai_conversation_history
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- AI Feedback Table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES ai_conversation_history(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  categories text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback"
  ON ai_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Custom Instructions Table
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their custom instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Embeddings Table for Knowledge Base
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own embeddings"
  ON ai_embeddings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create vector index for semantic search
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_embedding
  ON ai_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create unique constraint on content_type and content_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_embeddings_content
  ON ai_embeddings(user_id, content_type, content_id);

-- Function to find similar content based on vector similarity
CREATE OR REPLACE FUNCTION find_similar_content(
  p_embedding vector(1536),
  p_match_threshold float,
  p_match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content_type,
    e.content_id,
    e.content,
    1 - (e.embedding <=> p_embedding) as similarity
  FROM
    ai_embeddings e
  WHERE
    e.user_id = p_user_id
    AND 1 - (e.embedding <=> p_embedding) > p_match_threshold
  ORDER BY
    e.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$;

-- Function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_session_id text,
  p_user_id uuid,
  p_max_messages int DEFAULT 10
)
RETURNS TABLE (
  role text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.role,
    ch.content,
    ch.created_at
  FROM
    ai_conversation_history ch
  WHERE
    ch.session_id = p_session_id
    AND ch.user_id = p_user_id
  ORDER BY
    ch.message_index DESC
  LIMIT p_max_messages;
END;
$$;

-- Add triggers for updated_at timestamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_prompts_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_prompts_updated_at
      BEFORE UPDATE ON ai_prompts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_custom_instructions_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_custom_instructions_updated_at
      BEFORE UPDATE ON ai_custom_instructions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ai_embeddings_updated_at'
  ) THEN
    CREATE TRIGGER update_ai_embeddings_updated_at
      BEFORE UPDATE ON ai_embeddings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;