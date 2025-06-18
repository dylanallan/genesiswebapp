-- Fix knowledge base indexes
BEGIN;

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

-- Create the correct indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_btree ON knowledge_base (content);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_text ON knowledge_base USING GIN (to_tsvector('english', content::text));
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_jsonb ON knowledge_base USING GIN (content jsonb_path_ops);

COMMIT;