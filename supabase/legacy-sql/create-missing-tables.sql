-- Create missing tables needed for chat functionality

-- AI conversation history table
CREATE TABLE IF NOT EXISTS ai_conversation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,
    message TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error recovery logs table
CREATE TABLE IF NOT EXISTS error_recovery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    recovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage quotas table
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    tokens_limit INTEGER DEFAULT 100000,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_quotas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own conversation history" ON ai_conversation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own conversation history" ON ai_conversation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own usage quotas" ON ai_usage_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own usage quotas" ON ai_usage_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own usage quotas" ON ai_usage_quotas
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_user_id ON ai_conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_conversation_id ON ai_conversation_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user_id ON ai_usage_quotas(user_id); 