-- Consolidated fix for Bolt compatibility
BEGIN;

-- Drop problematic views and materialized views
DROP MATERIALIZED VIEW IF EXISTS ai_system_insights;
DROP VIEW IF EXISTS ai_system_insights;

-- Drop all existing indexes on knowledge_base
DO $$
DECLARE
    idx record;
BEGIN
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'knowledge_base'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I CASCADE', idx.indexname);
    END LOOP;
END $$;

-- Recreate knowledge_base table with proper structure
DROP TABLE IF EXISTS knowledge_base CASCADE;
CREATE TABLE knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simple, compatible indexes
CREATE INDEX idx_knowledge_base_content 
ON knowledge_base (content);

CREATE INDEX idx_knowledge_base_metadata 
ON knowledge_base USING GIN (metadata);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Enable read access for all users" 
ON knowledge_base FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON knowledge_base FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON knowledge_base FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON knowledge_base TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON TABLE knowledge_base IS 'Knowledge base table with Bolt-compatible structure and indexes';

COMMIT; 