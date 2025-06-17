-- Bolt compatibility fix for knowledge base indexes
BEGIN;

-- First, drop ALL existing indexes on knowledge_base
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

-- Recreate indexes with simpler, more compatible definitions
-- Basic btree index for content
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_btree 
ON knowledge_base (content);

-- Simple GIN index for content
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_gin 
ON knowledge_base USING GIN (to_tsvector('english', content));

-- Simple GIN index for JSONB if content is JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_base' 
        AND column_name = 'content' 
        AND data_type = 'jsonb'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_jsonb 
        ON knowledge_base USING GIN (content);
    END IF;
END $$;

-- Add a function to verify index health
CREATE OR REPLACE FUNCTION verify_knowledge_base_indexes()
RETURNS void AS $$
DECLARE
    missing_indexes text[];
BEGIN
    -- Check for required indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'knowledge_base' 
        AND indexname = 'idx_knowledge_base_content_btree'
    ) THEN
        missing_indexes := array_append(missing_indexes, 'idx_knowledge_base_content_btree');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'knowledge_base' 
        AND indexname = 'idx_knowledge_base_content_gin'
    ) THEN
        missing_indexes := array_append(missing_indexes, 'idx_knowledge_base_content_gin');
    END IF;

    -- Raise exception if any indexes are missing
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required indexes: %', array_to_string(missing_indexes, ', ');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the verification
SELECT verify_knowledge_base_indexes();

-- Clean up the verification function
DROP FUNCTION IF EXISTS verify_knowledge_base_indexes();

-- Add a comment to the table for tracking
COMMENT ON TABLE knowledge_base IS 'Indexes last rebuilt for Bolt compatibility on 2025-06-13';

COMMIT; 