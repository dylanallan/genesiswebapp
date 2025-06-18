-- Drop incorrect GIN indexes
DROP INDEX IF EXISTS idx_document_analysis_data;
DROP INDEX IF EXISTS idx_relationship_inference_data;
DROP INDEX IF EXISTS idx_artifacts_tags;
DROP INDEX IF EXISTS idx_recipes_tags;
DROP INDEX IF EXISTS idx_stories_themes;
DROP INDEX IF EXISTS idx_sacred_content_tags;
DROP INDEX IF EXISTS idx_marketing_contacts_tags;

-- Create correct GIN indexes with proper operator classes
-- For JSONB columns
CREATE INDEX IF NOT EXISTS idx_document_analysis_data 
ON document_analysis_results USING GIN (analysis_data jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_relationship_inference_data 
ON relationship_inference_results USING GIN (inference_data jsonb_path_ops);

-- For text array columns (using gin_trgm_ops)
CREATE INDEX IF NOT EXISTS idx_artifacts_tags 
ON cultural_artifacts USING GIN (tags gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_recipes_tags 
ON recipes USING GIN (tags gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_stories_themes 
ON cultural_stories USING GIN (themes gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sacred_content_tags 
ON sacred_content USING GIN (tags gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_tags 
ON marketing_contacts USING GIN (tags gin_trgm_ops);

-- Add comments explaining the operator classes
COMMENT ON INDEX idx_document_analysis_data IS 'GIN index for JSONB path operations on analysis_data';
COMMENT ON INDEX idx_relationship_inference_data IS 'GIN index for JSONB path operations on inference_data';
COMMENT ON INDEX idx_artifacts_tags IS 'GIN index for trigram text search on tags';
COMMENT ON INDEX idx_recipes_tags IS 'GIN index for trigram text search on tags';
COMMENT ON INDEX idx_stories_themes IS 'GIN index for trigram text search on themes';
COMMENT ON INDEX idx_sacred_content_tags IS 'GIN index for trigram text search on tags';
COMMENT ON INDEX idx_marketing_contacts_tags IS 'GIN index for trigram text search on tags';

-- Note: The following indexes are already correct and don't need modification:
-- - idx_llm_conversations_context (using jsonb_path_ops)
-- - idx_llm_conversations_metadata (using jsonb_path_ops)
-- - idx_llm_messages_content (using to_tsvector)
-- - idx_llm_messages_metadata (using jsonb_path_ops)
-- - cultural_artifacts_fts_idx (using to_tsvector)
-- - idx_search_vectors_vector (using to_tsvector) 