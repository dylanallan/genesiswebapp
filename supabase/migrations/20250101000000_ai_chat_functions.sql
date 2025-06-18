-- AI Chat Database Functions
-- These functions provide the interface between frontend and Edge Functions

-- Function to process chat messages
CREATE OR REPLACE FUNCTION process_chat_message(
  user_uuid UUID,
  message TEXT,
  context JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
  response_data JSONB;
  edge_function_url TEXT;
BEGIN
  -- Get or create conversation ID
  IF context->>'conversation_id' IS NOT NULL THEN
    conversation_id := (context->>'conversation_id')::UUID;
  ELSE
    conversation_id := gen_random_uuid();
  END IF;

  -- Call the Edge Function
  edge_function_url := current_setting('app.settings.edge_function_url', true) || '/chat';
  
  SELECT content::jsonb INTO response_data
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      ('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))::http_header,
      ('Content-Type', 'application/json')::http_header
    ],
    'application/json',
    json_build_object(
      'message', message,
      'userId', user_uuid,
      'conversationId', conversation_id,
      'provider', COALESCE(context->>'provider', 'auto'),
      'model', COALESCE(context->>'model', 'auto')
    )::text
  ));

  -- Return the response with conversation ID
  RETURN json_build_object(
    'response', response_data->>'response',
    'conversationId', conversation_id,
    'provider', response_data->>'provider',
    'model', response_data->>'model',
    'timestamp', response_data->>'timestamp'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback response if Edge Function fails
    RETURN json_build_object(
      'response', 'I apologize, but I''m having trouble processing your request right now. Please try again in a moment.',
      'conversationId', conversation_id,
      'provider', 'fallback',
      'model', 'fallback',
      'timestamp', now()::text
    );
END;
$$;

-- Function to get chat history
CREATE OR REPLACE FUNCTION get_chat_history(
  user_uuid UUID,
  conversation_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  message TEXT,
  role TEXT,
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF conversation_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      ach.id,
      ach.message,
      ach.role,
      ach.provider,
      ach.model,
      ach.created_at
    FROM ai_conversation_history ach
    WHERE ach.user_id = user_uuid 
      AND ach.conversation_id = conversation_id
    ORDER BY ach.created_at ASC;
  ELSE
    RETURN QUERY
    SELECT 
      ach.id,
      ach.message,
      ach.role,
      ach.provider,
      ach.model,
      ach.created_at
    FROM ai_conversation_history ach
    WHERE ach.user_id = user_uuid
    ORDER BY ach.created_at DESC
    LIMIT 50;
  END IF;
END;
$$;

-- Function to get conversation list
CREATE OR REPLACE FUNCTION get_conversation_list(user_uuid UUID)
RETURNS TABLE(
  conversation_id UUID,
  title TEXT,
  last_message TEXT,
  message_count BIGINT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ach.conversation_id,
    COALESCE(
      (SELECT message FROM ai_conversation_history 
       WHERE conversation_id = ach.conversation_id 
       ORDER BY created_at ASC LIMIT 1),
      'New Conversation'
    ) as title,
    (SELECT message FROM ai_conversation_history 
     WHERE conversation_id = ach.conversation_id 
     ORDER BY created_at DESC LIMIT 1) as last_message,
    COUNT(*) as message_count,
    MAX(ach.created_at) as last_updated
  FROM ai_conversation_history ach
  WHERE ach.user_id = user_uuid
    AND ach.conversation_id IS NOT NULL
  GROUP BY ach.conversation_id
  ORDER BY last_updated DESC;
END;
$$;

-- Function to create new conversation
CREATE OR REPLACE FUNCTION create_conversation(user_uuid UUID, title TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_conversation_id UUID;
BEGIN
  new_conversation_id := gen_random_uuid();
  
  -- Insert initial system message
  INSERT INTO ai_conversation_history (
    user_id,
    conversation_id,
    message,
    role,
    provider,
    model
  ) VALUES (
    user_uuid,
    new_conversation_id,
    COALESCE(title, 'New Conversation'),
    'system',
    'system',
    'system'
  );
  
  RETURN new_conversation_id;
END;
$$;

-- Function to delete conversation
CREATE OR REPLACE FUNCTION delete_conversation(user_uuid UUID, conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM ai_conversation_history 
  WHERE user_id = user_uuid 
    AND conversation_id = conversation_id;
  
  RETURN FOUND;
END;
$$;

-- RLS Policies for ai_conversation_history
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversation history"
  ON ai_conversation_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON ai_conversation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON ai_conversation_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON ai_conversation_history
  FOR DELETE
  USING (auth.uid() = user_id); 