-- Drop existing GIN indexes that use gin_trgm_ops on JSONB columns
DROP INDEX IF EXISTS idx_voice_stories_metadata;
DROP INDEX IF EXISTS idx_voice_stories_story_analysis;
DROP INDEX IF EXISTS idx_voice_stories_audio_processing_metadata;
DROP INDEX IF EXISTS idx_voice_stories_audio_quality_metrics;
DROP INDEX IF EXISTS idx_voice_stories_sentiment_analysis;

-- Recreate indexes using the correct operator class for JSONB
CREATE INDEX IF NOT EXISTS idx_voice_stories_metadata ON voice_stories USING GIN (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_voice_stories_story_analysis ON voice_stories USING GIN (story_analysis jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_voice_stories_audio_processing_metadata ON voice_stories USING GIN (audio_processing_metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_voice_stories_audio_quality_metrics ON voice_stories USING GIN (audio_quality_metrics jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_voice_stories_sentiment_analysis ON voice_stories USING GIN (sentiment_analysis jsonb_path_ops);

-- Add text search indexes for JSONB text fields
CREATE INDEX IF NOT EXISTS idx_voice_stories_metadata_text ON voice_stories USING GIN ((metadata::text) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voice_stories_story_analysis_text ON voice_stories USING GIN ((story_analysis::text) gin_trgm_ops);

-- Add function to search JSONB fields
CREATE OR REPLACE FUNCTION search_voice_stories(
  search_term TEXT,
  search_fields TEXT[] DEFAULT ARRAY['metadata', 'story_analysis']
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  metadata JSONB,
  story_analysis JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vs.id,
    vs.title,
    vs.metadata,
    vs.story_analysis,
    GREATEST(
      similarity(vs.metadata::text, search_term),
      similarity(vs.story_analysis::text, search_term)
    ) as similarity
  FROM voice_stories vs
  WHERE 
    search_fields @> ARRAY['metadata'] AND vs.metadata::text ILIKE '%' || search_term || '%'
    OR search_fields @> ARRAY['story_analysis'] AND vs.story_analysis::text ILIKE '%' || search_term || '%'
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;

-- Add function to update JSONB fields with proper indexing
CREATE OR REPLACE FUNCTION update_voice_story_jsonb(
  story_id UUID,
  field_name TEXT,
  new_value JSONB
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE voice_stories SET %I = $1 WHERE id = $2',
    field_name
  ) USING new_value, story_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for JSONB operations
CREATE POLICY "Enable JSONB search for authenticated users"
ON voice_stories
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (
    metadata ? 'public' OR
    story_analysis ? 'public' OR
    auth.uid() = user_id
  )
);

-- Add function to get JSONB statistics
CREATE OR REPLACE FUNCTION get_voice_story_jsonb_stats(
  field_name TEXT
)
RETURNS TABLE (
  key TEXT,
  count BIGINT,
  avg_length FLOAT
) AS $$
BEGIN
  RETURN QUERY
  EXECUTE format(
    'SELECT 
      key,
      COUNT(*) as count,
      AVG(LENGTH(value::text)) as avg_length
    FROM voice_stories,
    jsonb_each(%I)
    GROUP BY key
    ORDER BY count DESC',
    field_name
  );
END;
$$ LANGUAGE plpgsql; 