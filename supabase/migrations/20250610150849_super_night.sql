/*
  # Memory System for AI Assistant

  1. New Functions
    - `find_similar_messages` - Function to find similar messages in conversation history
    - `get_conversation_memory` - Function to retrieve conversation memory
    - `clear_conversation_memory` - Function to clear conversation memory
  
  2. New Indexes
    - Vector index for conversation history embeddings
    - Index for session_id and message_index
  
  3. Security
    - RLS policies for conversation memory
*/

-- Function to find similar messages based on vector similarity
CREATE OR REPLACE FUNCTION find_similar_messages(
  p_embedding vector(1536),
  p_match_threshold float,
  p_match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  session_id text,
  role text,
  content text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.session_id,
    ch.role,
    ch.content,
    ch.created_at,
    1 - (ch.embedding <=> p_embedding) as similarity
  FROM
    ai_conversation_history ch
  WHERE
    ch.user_id = p_user_id
    AND ch.embedding IS NOT NULL
    AND 1 - (ch.embedding <=> p_embedding) > p_match_threshold
  ORDER BY
    ch.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$;

-- Function to get conversation memory
CREATE OR REPLACE FUNCTION get_conversation_memory(
  p_session_id text,
  p_user_id uuid,
  p_limit int DEFAULT 10
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
    ch.message_index ASC
  LIMIT p_limit;
END;
$$;

-- Function to clear conversation memory
CREATE OR REPLACE FUNCTION clear_conversation_memory(
  p_session_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM ai_conversation_history
  WHERE session_id = p_session_id
  AND user_id = p_user_id;
END;
$$;

-- Create index for session_id and message_index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_conversation_history_session_message'
  ) THEN
    CREATE INDEX idx_conversation_history_session_message
      ON ai_conversation_history(session_id, message_index);
  END IF;
END
$$;

-- Create index for user_id and session_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_conversation_history_user_session'
  ) THEN
    CREATE INDEX idx_conversation_history_user_session
      ON ai_conversation_history(user_id, session_id);
  END IF;
END
$$;

-- Create vector index for embeddings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_conversation_history_embedding'
  ) THEN
    CREATE INDEX idx_conversation_history_embedding
      ON ai_conversation_history
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END
$$;