-- Enhance voice_stories table with additional fields and indexes
ALTER TABLE voice_stories
  -- Add new columns for better tracking and analytics
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
  ADD COLUMN IF NOT EXISTS voice_name TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT,
  ADD COLUMN IF NOT EXISTS style TEXT,
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS audio_format TEXT,
  ADD COLUMN IF NOT EXISTS audio_quality TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_voice_stories_created_at ON voice_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_stories_language ON voice_stories(language);
CREATE INDEX IF NOT EXISTS idx_voice_stories_voice_name ON voice_stories(voice_name);
CREATE INDEX IF NOT EXISTS idx_voice_stories_processing_status ON voice_stories(processing_status);
CREATE INDEX IF NOT EXISTS idx_voice_stories_metadata ON voice_stories USING GIN (metadata);

-- Add constraints
ALTER TABLE voice_stories
  ADD CONSTRAINT voice_stories_word_count_check CHECK (word_count > 0),
  ADD CONSTRAINT voice_stories_audio_duration_check CHECK (audio_duration > 0),
  ADD CONSTRAINT voice_stories_processing_status_check 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create a function to update error tracking
CREATE OR REPLACE FUNCTION update_voice_story_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_error IS NOT NULL THEN
    NEW.error_count = COALESCE(OLD.error_count, 0) + 1;
    NEW.last_error_at = NOW();
    NEW.processing_status = 'failed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for error tracking
CREATE TRIGGER track_voice_story_errors
  BEFORE UPDATE ON voice_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_story_error();

-- Create a function to clean up old stories
CREATE OR REPLACE FUNCTION cleanup_old_voice_stories()
RETURNS void AS $$
BEGIN
  -- Delete stories older than 30 days that are not marked as important
  DELETE FROM voice_stories
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND (metadata->>'important')::boolean IS NOT TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup
SELECT cron.schedule(
  'cleanup-old-voice-stories',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT cleanup_old_voice_stories()$$
);

-- Create a view for story statistics
CREATE OR REPLACE VIEW voice_story_statistics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  language,
  voice_name,
  COUNT(*) as total_stories,
  AVG(word_count) as avg_word_count,
  AVG(audio_duration) as avg_duration,
  AVG(processing_time) as avg_processing_time,
  COUNT(CASE WHEN error_count > 0 THEN 1 END) as error_count,
  COUNT(CASE WHEN cache_hit THEN 1 END) as cache_hits
FROM voice_stories
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- Add RLS policies
ALTER TABLE voice_stories ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own stories
CREATE POLICY "Users can view their own stories"
  ON voice_stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for service role to manage all stories
CREATE POLICY "Service role can manage all stories"
  ON voice_stories
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for anonymous users to view public stories
CREATE POLICY "Anyone can view public stories"
  ON voice_stories
  FOR SELECT
  TO anon
  USING (metadata->>'public' = 'true');

-- Create a function to get story recommendations
CREATE OR REPLACE FUNCTION get_story_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  story_id UUID,
  title TEXT,
  language TEXT,
  voice_name TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    SELECT
      language,
      voice_name,
      style,
      tone
    FROM voice_stories
    WHERE user_id = p_user_id
    GROUP BY 1, 2, 3, 4
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT
    vs.id as story_id,
    vs.metadata->>'title' as title,
    vs.language,
    vs.voice_name,
    vs.audio_duration as duration,
    vs.created_at,
    CASE
      WHEN vs.language = up.language THEN 0.4
      ELSE 0.0
    END +
    CASE
      WHEN vs.voice_name = up.voice_name THEN 0.3
      ELSE 0.0
    END +
    CASE
      WHEN vs.style = up.style THEN 0.2
      ELSE 0.0
    END +
    CASE
      WHEN vs.tone = up.tone THEN 0.1
      ELSE 0.0
    END as similarity
  FROM voice_stories vs
  CROSS JOIN user_preferences up
  WHERE vs.user_id != p_user_id
    AND vs.metadata->>'public' = 'true'
  ORDER BY similarity DESC, vs.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 