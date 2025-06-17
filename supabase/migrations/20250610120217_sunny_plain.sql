/*
  # AI Services Schema

  1. New Tables
    - `ai_models` - Available AI models
    - `ai_prompts` - Stored prompts for AI models
    - `ai_conversations` - User conversations with AI
    - `ai_messages` - Individual messages in conversations
    - `ai_feedback` - User feedback on AI responses
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  model_type text NOT NULL,
  capabilities text[] DEFAULT '{}'::text[],
  max_tokens integer,
  token_cost numeric,
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider, name)
);

-- Create ai_prompts table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  is_template boolean DEFAULT false,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  summary text,
  context jsonb DEFAULT '{}'::jsonb,
  is_archived boolean DEFAULT false,
  message_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL,
  content text NOT NULL,
  model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  tokens_used integer,
  processing_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer,
  feedback_text text,
  is_helpful boolean,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- AI models: public read, admin write
CREATE POLICY "AI models are viewable by everyone" 
  ON ai_models FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify AI models" 
  ON ai_models FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- AI prompts: users can manage their own, can view public/templates
CREATE POLICY "Users can view their own prompts" 
  ON ai_prompts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public prompts and templates" 
  ON ai_prompts FOR SELECT 
  USING (is_public = true OR is_template = true);

CREATE POLICY "Users can manage their own prompts" 
  ON ai_prompts FOR ALL 
  USING (auth.uid() = user_id);

-- AI conversations: users can manage their own
CREATE POLICY "Users can view their own conversations" 
  ON ai_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations" 
  ON ai_conversations FOR ALL 
  USING (auth.uid() = user_id);

-- AI messages: users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" 
  ON ai_messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  ));

-- AI feedback: users can manage their own feedback
CREATE POLICY "Users can view their own feedback" 
  ON ai_feedback FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback" 
  ON ai_feedback FOR ALL 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_ai_models_changes
  AFTER INSERT OR UPDATE OR DELETE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_ai_prompts_changes
  AFTER INSERT OR UPDATE OR DELETE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_ai_conversations_changes
  AFTER INSERT OR UPDATE OR DELETE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_ai_messages_changes
  AFTER INSERT OR UPDATE OR DELETE ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_ai_feedback_changes
  AFTER INSERT OR UPDATE OR DELETE ON ai_feedback
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_message_id ON ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_type, capabilities, max_tokens, token_cost, configuration)
VALUES
  ('gpt-4-turbo', 'openai', 'chat', ARRAY['general', 'coding', 'analysis'], 128000, 0.00003, '{"temperature": 0.7}'),
  ('claude-3-opus', 'anthropic', 'chat', ARRAY['general', 'cultural', 'creative'], 200000, 0.000075, '{"temperature": 0.7}'),
  ('gemini-1.5-pro', 'google', 'chat', ARRAY['general', 'multimodal', 'research'], 1048576, 0.000007, '{"temperature": 0.7}'),
  ('dylanallan-business', 'dylanallan', 'specialized', ARRAY['business', 'automation', 'consulting'], 8192, 0.00001, '{"context": "business_automation"}'),
  ('deepseek-coder', 'deepseek', 'specialized', ARRAY['coding', 'technical'], 16384, 0.000001, '{"temperature": 0.1}')
ON CONFLICT (provider, name) DO NOTHING;