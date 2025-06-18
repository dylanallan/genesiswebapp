-- Fix knowledge base indexes
BEGIN;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_knowledge_base_trgm;
DROP INDEX IF EXISTS idx_knowledge_base_content;
DROP INDEX IF EXISTS idx_knowledge_base_jsonb;

-- Recreate indexes with proper definitions
CREATE INDEX idx_knowledge_base_content 
ON knowledge_base USING btree (content);

CREATE INDEX idx_knowledge_base_trgm 
ON knowledge_base USING gin (content gin_trgm_ops);

CREATE INDEX idx_knowledge_base_jsonb
ON knowledge_base USING gin (content jsonb_path_ops);

-- Verify indexes were created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_knowledge_base_content'
    ) THEN
        RAISE EXCEPTION 'Failed to create idx_knowledge_base_content';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_knowledge_base_trgm'
    ) THEN
        RAISE EXCEPTION 'Failed to create idx_knowledge_base_trgm';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_knowledge_base_jsonb'
    ) THEN
        RAISE EXCEPTION 'Failed to create idx_knowledge_base_jsonb';
    END IF;
END $$;

COMMIT; 