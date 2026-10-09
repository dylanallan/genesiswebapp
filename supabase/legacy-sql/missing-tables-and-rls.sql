-- MISSING ENUMS
CREATE TYPE IF NOT EXISTS ai_provider AS ENUM ('openai', 'anthropic', 'google', 'custom');
CREATE TYPE IF NOT EXISTS feedback_type AS ENUM ('thumbs_up', 'thumbs_down', 'flagged', 'comment');
CREATE TYPE IF NOT EXISTS admin_role AS ENUM ('superadmin', 'admin', 'moderator');
CREATE TYPE IF NOT EXISTS voice_status AS ENUM ('pending', 'ready', 'failed');
CREATE TYPE IF NOT EXISTS integration_type AS ENUM ('n8n', 'zapier', 'custom');

-- 1. ai_response_feedback
CREATE TABLE IF NOT EXISTS ai_response_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,
    message_id UUID,
    feedback feedback_type NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ai_usage_quotas
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    tokens_limit INTEGER DEFAULT 100000,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. admin_roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role admin_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 4. ai_service_config
CREATE TABLE IF NOT EXISTS ai_service_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider ai_provider NOT NULL,
    api_key TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider)
);

-- 5. ai_conversation_history
CREATE TABLE IF NOT EXISTS ai_conversation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,
    message TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ai_custom_instructions
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    instructions TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ai_embeddings
CREATE TABLE IF NOT EXISTS ai_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- or use FLOAT[] if VECTOR not available
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. user_activity_log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. system_optimization_logs
CREATE TABLE IF NOT EXISTS system_optimization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. genealogy_records
CREATE TABLE IF NOT EXISTS genealogy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. historical_records
CREATE TABLE IF NOT EXISTS historical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. voice_profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    status voice_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. voice_generations
CREATE TABLE IF NOT EXISTS voice_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES voice_profiles(id) ON DELETE CASCADE,
    audio_url TEXT,
    transcript TEXT,
    status voice_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. integration_settings
CREATE TABLE IF NOT EXISTS integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration integration_type NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. error_recovery_logs
CREATE TABLE IF NOT EXISTS error_recovery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    recovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ai_response_feedback_user_id ON ai_response_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_user_id ON ai_usage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_user_id ON ai_conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_user_id ON ai_custom_instructions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_user_id ON ai_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_records_user_id ON genealogy_records(user_id);
CREATE INDEX IF NOT EXISTS idx_historical_records_user_id ON historical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_generations_user_id ON voice_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON integration_settings(user_id);

-- RLS: Enable for all tables
ALTER TABLE ai_response_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE genealogy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_recovery_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- User-specific data
CREATE POLICY IF NOT EXISTS "Users can view own ai_response_feedback" ON ai_response_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own ai_response_feedback" ON ai_response_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own ai_usage_quotas" ON ai_usage_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own ai_conversation_history" ON ai_conversation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own ai_custom_instructions" ON ai_custom_instructions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own ai_embeddings" ON ai_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own user_activity_log" ON user_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own genealogy_records" ON genealogy_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own historical_records" ON historical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own voice_profiles" ON voice_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own voice_generations" ON voice_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can view own integration_settings" ON integration_settings FOR SELECT USING (auth.uid() = user_id);

-- Admin-only data
CREATE POLICY IF NOT EXISTS "Admins can manage admin_roles" ON admin_roles FOR ALL USING (EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can manage ai_service_config" ON ai_service_config FOR ALL USING (EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can view system_optimization_logs" ON system_optimization_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can view error_recovery_logs" ON error_recovery_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_metadata WHERE user_id = auth.uid() AND role = 'admin'));

-- Publicly readable data (example, adjust as needed)
-- CREATE POLICY IF NOT EXISTS "Authenticated users can read ai_models" ON ai_models FOR SELECT USING (auth.role() = 'authenticated');

-- Add more policies as needed for INSERT/UPDATE/DELETE

-- END OF FILE 