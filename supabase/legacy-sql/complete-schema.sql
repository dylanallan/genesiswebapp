-- Complete Genesis Web App Database Schema
-- Run this entire script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'user', 'moderator');
CREATE TYPE IF NOT EXISTS content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE IF NOT EXISTS analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE IF NOT EXISTS voice_story_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- User metadata table (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    profile_data JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- DNA analysis results
CREATE TABLE IF NOT EXISTS dna_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    insights JSONB DEFAULT '{}',
    status analysis_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document analysis results
CREATE TABLE IF NOT EXISTS document_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_content TEXT,
    analysis_data JSONB NOT NULL,
    insights JSONB DEFAULT '{}',
    status analysis_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Record matching results
CREATE TABLE IF NOT EXISTS record_matching_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query_data JSONB NOT NULL,
    matches JSONB DEFAULT '[]',
    confidence_scores JSONB DEFAULT '[]',
    status analysis_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice story generation
CREATE TABLE IF NOT EXISTS voice_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    story_data JSONB NOT NULL,
    audio_url TEXT,
    transcript TEXT,
    status voice_story_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System performance logs
CREATE TABLE IF NOT EXISTS system_performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_name TEXT NOT NULL,
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI system insights (materialized view)
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_system_insights AS
SELECT 
    'dna_analysis' as analysis_type,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_analyses,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_analyses,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM dna_analysis_results
UNION ALL
SELECT 
    'document_analysis' as analysis_type,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_analyses,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_analyses,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM document_analysis_results
UNION ALL
SELECT 
    'record_matching' as analysis_type,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_analyses,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_analyses,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM record_matching_results
UNION ALL
SELECT 
    'voice_stories' as analysis_type,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_analyses,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_analyses,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM voice_stories;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dna_analysis_user_id ON dna_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_status ON dna_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_created_at ON dna_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_data_gin ON dna_analysis_results USING GIN (analysis_data);

CREATE INDEX IF NOT EXISTS idx_document_analysis_user_id ON document_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_status ON document_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_created_at ON document_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analysis_data_gin ON document_analysis_results USING GIN (analysis_data);

CREATE INDEX IF NOT EXISTS idx_record_matching_user_id ON record_matching_results(user_id);
CREATE INDEX IF NOT EXISTS idx_record_matching_status ON record_matching_results(status);
CREATE INDEX IF NOT EXISTS idx_record_matching_created_at ON record_matching_results(created_at);
CREATE INDEX IF NOT EXISTS idx_record_matching_query_gin ON record_matching_results USING GIN (query_data);

CREATE INDEX IF NOT EXISTS idx_voice_stories_user_id ON voice_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_stories_status ON voice_stories(status);
CREATE INDEX IF NOT EXISTS idx_voice_stories_created_at ON voice_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_stories_data_gin ON voice_stories USING GIN (story_data);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_health_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_value_gin ON system_health_metrics USING GIN (metric_value);

CREATE INDEX IF NOT EXISTS idx_system_performance_timestamp ON system_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_performance_operation ON system_performance_logs(operation_name);
CREATE INDEX IF NOT EXISTS idx_system_performance_success ON system_performance_logs(success);

-- Create RLS policies
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_matching_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_logs ENABLE ROW LEVEL SECURITY;

-- User metadata policies
CREATE POLICY IF NOT EXISTS "Users can view own metadata" ON user_metadata
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own metadata" ON user_metadata
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own metadata" ON user_metadata
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DNA analysis policies
CREATE POLICY IF NOT EXISTS "Users can view own DNA analysis" ON dna_analysis_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own DNA analysis" ON dna_analysis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own DNA analysis" ON dna_analysis_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Document analysis policies
CREATE POLICY IF NOT EXISTS "Users can view own document analysis" ON document_analysis_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own document analysis" ON document_analysis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own document analysis" ON document_analysis_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Record matching policies
CREATE POLICY IF NOT EXISTS "Users can view own record matching" ON record_matching_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own record matching" ON record_matching_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own record matching" ON record_matching_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Voice stories policies
CREATE POLICY IF NOT EXISTS "Users can view own voice stories" ON voice_stories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own voice stories" ON voice_stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own voice stories" ON voice_stories
    FOR UPDATE USING (auth.uid() = user_id);

-- System metrics policies (admin only)
CREATE POLICY IF NOT EXISTS "Admins can view system metrics" ON system_health_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_metadata 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can insert system metrics" ON system_health_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_metadata 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- System performance policies (admin only)
CREATE POLICY IF NOT EXISTS "Admins can view system performance" ON system_performance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_metadata 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can insert system performance" ON system_performance_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_metadata 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_user_metadata_updated_at 
    BEFORE UPDATE ON user_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_dna_analysis_updated_at 
    BEFORE UPDATE ON dna_analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_document_analysis_updated_at 
    BEFORE UPDATE ON document_analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_record_matching_updated_at 
    BEFORE UPDATE ON record_matching_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_voice_stories_updated_at 
    BEFORE UPDATE ON voice_stories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_ai_system_insights()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW ai_system_insights;
END;
$$ LANGUAGE plpgsql;

-- Create a function to initialize user metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_metadata (user_id, role)
    VALUES (new.id, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh the materialized view
SELECT refresh_ai_system_insights(); 