-- Fix incorrect JSONB index
BEGIN;

-- First, drop the problematic index if it exists
DROP INDEX IF EXISTS idx_knowledge_base_trgm;

-- Create the correct index for JSONB content
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_gin 
ON knowledge_base USING GIN (content jsonb_path_ops);

-- Create a separate text index if we need text search capabilities
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_text 
ON knowledge_base USING GIN (to_tsvector('english', content::text));

-- Add helpful comment
COMMENT ON INDEX idx_knowledge_base_content_gin IS 'GIN index for JSONB content using jsonb_path_ops';
COMMENT ON INDEX idx_knowledge_base_content_text IS 'GIN index for text search on content';

COMMIT; 