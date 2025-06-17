-- Fix AI Conversation History Table
-- This migration fixes issues with the AI conversation history table and related functions

-- First, check if the table exists and create it if not
CREATE TABLE IF NOT EXISTS ai_conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_index integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  model_used text,
  tokens_used integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ai_conversation_user_session ON ai_conversation_history(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_session_index ON ai_conversation_history(session_id, message_index);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_created ON ai_conversation_history(created_at);

-- Enable RLS if not already enabled
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own conversation history" ON ai_conversation_history;

-- Create policies
CREATE POLICY "Users can manage their own conversation history"
  ON ai_conversation_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_conversation_context(text, uuid, integer);

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

-- Create ai_custom_instructions table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_user ON ai_custom_instructions(user_id);

-- Enable RLS if not already enabled
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own custom instructions" ON ai_custom_instructions;

-- Create policy
CREATE POLICY "Users can manage their own custom instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create ai_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  rating integer NOT NULL,
  feedback_text text,
  categories text[],
  created_at timestamp with time zone DEFAULT now()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation ON ai_feedback(conversation_id);

-- Enable RLS if not already enabled
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own feedback" ON ai_feedback;

-- Create policy
CREATE POLICY "Users can manage their own feedback"
  ON ai_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);