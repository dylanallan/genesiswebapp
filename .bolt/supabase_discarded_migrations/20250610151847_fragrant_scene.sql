/*
  # Create AI Conversation History Table

  1. New Tables
    - `ai_conversation_history` - Stores conversation history for AI assistant
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `session_id` (text, for grouping conversations)
      - `message_index` (integer, for ordering messages)
      - `role` (text, user/assistant/system)
      - `content` (text, message content)
      - `model_used` (text, optional)
      - `tokens_used` (integer, optional)
      - `embedding` (vector, optional)
      - `metadata` (jsonb, optional)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `ai_conversation_history` table
    - Add policy for users to manage their own conversation history
    
  3. Functions
    - Add function to get conversation context
    - Add function to find similar messages
*/

-- Create ai_conversation_history table
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
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversation_user_session ON ai_conversation_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_session_index ON ai_conversation_history(session_id, message_index);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_created ON ai_conversation_history(created_at);

-- Enable RLS
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own conversation history"
  ON ai_conversation_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_session_id text,
  p_user_id uuid DEFAULT auth.uid(),
  p_max_messages integer DEFAULT 10
)
RETURNS TABLE (
  role text,
  content text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ach.role,
    ach.content,
    ach.created_at
  FROM 
    ai_conversation_history ach
  WHERE 
    ach.session_id = p_session_id
    AND ach.user_id = p_user_id
  ORDER BY 
    ach.message_index ASC
  LIMIT 
    p_max_messages;
END;
$$;

-- Create function to find similar messages
CREATE OR REPLACE FUNCTION find_similar_messages(
  p_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  role text,
  content text,
  session_id text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ach.id,
    ach.role,
    ach.content,
    ach.session_id,
    ach.created_at,
    1 - (ach.embedding <=> p_embedding) as similarity
  FROM
    ai_conversation_history ach
  WHERE
    ach.user_id = p_user_id
    AND ach.embedding IS NOT NULL
    AND 1 - (ach.embedding <=> p_embedding) > p_match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    p_match_count;
END;
$$;

-- Create ai_custom_instructions table
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_user ON ai_custom_instructions(user_id);

-- Enable RLS
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own custom instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  rating integer NOT NULL,
  feedback_text text,
  categories text[],
  created_at timestamp with time zone DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation ON ai_feedback(conversation_id);

-- Enable RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own feedback"
  ON ai_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);