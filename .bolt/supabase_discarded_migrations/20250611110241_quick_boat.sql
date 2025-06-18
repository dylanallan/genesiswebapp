/*
  # Conversation Features Enhancement

  1. New Tables
    - `conversation_summaries` - Stores AI-generated summaries of conversations
    - `conversation_topics` - Stores extracted topics from conversations
    - `ai_feedback` - Stores user feedback on AI responses

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Changes
    - Add indexes for performance optimization
    - Add triggers for updated_at columns
*/

-- Conversation Summaries Table
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  summary text NOT NULL,
  summary_type text NOT NULL,
  message_count integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their conversation summaries"
  ON conversation_summaries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Conversation Topics Table
CREATE TABLE IF NOT EXISTS conversation_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  topic text NOT NULL,
  confidence numeric NOT NULL,
  message_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their conversation topics"
  ON conversation_topics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Feedback Table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  response_id text NOT NULL,
  rating integer NOT NULL,
  feedback_text text,
  categories text[] DEFAULT '{}',
  was_helpful boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their AI feedback"
  ON ai_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Custom Instructions Table (if not exists)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_session ON conversation_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_topics_session ON conversation_topics(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_topics_topic ON conversation_topics(topic);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_response ON ai_feedback(response_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_conversation_summaries_updated_at
  BEFORE UPDATE ON conversation_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_custom_instructions_updated_at
  BEFORE UPDATE ON ai_custom_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to extract topics from conversation
CREATE OR REPLACE FUNCTION extract_conversation_topics(
  p_session_id text,
  p_user_id uuid
)
RETURNS SETOF conversation_topics
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_text text;
  v_topics jsonb;
BEGIN
  -- Get conversation text
  SELECT string_agg(content, ' ') INTO v_conversation_text
  FROM ai_conversation_history
  WHERE session_id = p_session_id
  AND user_id = p_user_id;
  
  -- In a real implementation, this would call an AI service to extract topics
  -- For now, we'll just insert some placeholder topics
  
  INSERT INTO conversation_topics (
    user_id,
    session_id,
    topic,
    confidence,
    created_at
  )
  VALUES
    (p_user_id, p_session_id, 'business automation', 0.9, now()),
    (p_user_id, p_session_id, 'cultural heritage', 0.8, now()),
    (p_user_id, p_session_id, 'AI integration', 0.7, now())
  RETURNING *;
END;
$$;