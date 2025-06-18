-- Drop existing tables and recreate with uuid type
DROP TABLE IF EXISTS llm_conversations CASCADE;
DROP TABLE IF EXISTS llm_model_configs CASCADE;

-- Create llm_model_configs table with uuid
CREATE TABLE public.llm_model_configs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    model_name text NOT NULL,
    api_key_id uuid NOT NULL REFERENCES api_key_management(id),
    configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
    capabilities text[] NOT NULL DEFAULT '{}'::text[],
    context_window integer NOT NULL DEFAULT 4096,
    max_tokens integer,
    temperature numeric DEFAULT 0.7,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT llm_model_configs_pkey PRIMARY KEY (id)
);

-- Create llm_conversations table with uuid
CREATE TABLE public.llm_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    model_config_id uuid NOT NULL REFERENCES llm_model_configs(id),
    context jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active'::text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT llm_conversations_pkey PRIMARY KEY (id)
);

-- Create llm_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.llm_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES llm_conversations(id),
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    tokens_used integer,
    processing_time interval,
    metadata jsonb DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT llm_messages_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_conversations_user_id ON llm_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_conversations_model_config_id ON llm_conversations(model_config_id);
CREATE INDEX IF NOT EXISTS idx_llm_messages_conversation_id ON llm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_llm_messages_created_at ON llm_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_provider ON llm_model_configs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_is_active ON llm_model_configs(is_active);

-- Enable Row Level Security
ALTER TABLE llm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_model_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations"
    ON llm_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON llm_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON llm_conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
    ON llm_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM llm_conversations
            WHERE id = llm_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations"
    ON llm_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM llm_conversations
            WHERE id = conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage model configs"
    ON llm_model_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles
            WHERE user_id = auth.uid()
            AND role_name = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_llm_conversations_updated_at
    BEFORE UPDATE ON llm_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_model_configs_updated_at
    BEFORE UPDATE ON llm_model_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 