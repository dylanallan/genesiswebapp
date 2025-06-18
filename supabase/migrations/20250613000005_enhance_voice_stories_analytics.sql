-- Add analytics and tracking fields to voice_stories table
ALTER TABLE voice_stories
  -- Voice configuration
  ADD COLUMN IF NOT EXISTS voice_config JSONB,
  ADD COLUMN IF NOT EXISTS voice_characteristics JSONB,
  
  -- Audio processing
  ADD COLUMN IF NOT EXISTS audio_processing_metadata JSONB,
  ADD COLUMN IF NOT EXISTS audio_quality_metrics JSONB,
  ADD COLUMN IF NOT EXISTS audio_effects JSONB,
  
  -- Story analysis
  ADD COLUMN IF NOT EXISTS story_analysis JSONB,
  ADD COLUMN IF NOT EXISTS sentiment_analysis JSONB,
  ADD COLUMN IF NOT EXISTS topic_tags TEXT[],
  
  -- Performance metrics
  ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS processing_steps JSONB,
  ADD COLUMN IF NOT EXISTS resource_usage JSONB,
  
  -- Usage tracking
  ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS play_duration INTEGER,
  ADD COLUMN IF NOT EXISTS user_feedback JSONB,
  
  -- Caching
  ADD COLUMN IF NOT EXISTS cache_key TEXT,
  ADD COLUMN IF NOT EXISTS cache_hit_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_last_hit_at TIMESTAMPTZ,
  
  -- Versioning
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_versions JSONB;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_voice_stories_play_count ON voice_stories(play_count);
CREATE INDEX IF NOT EXISTS idx_voice_stories_last_played ON voice_stories(last_played_at);
CREATE INDEX IF NOT EXISTS idx_voice_stories_topic_tags ON voice_stories USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_voice_stories_voice_config ON voice_stories USING GIN(voice_config);
CREATE INDEX IF NOT EXISTS idx_voice_stories_story_analysis ON voice_stories USING GIN(story_analysis);

-- Create function to update play statistics
CREATE OR REPLACE FUNCTION update_voice_story_play_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.play_count = COALESCE(OLD.play_count, 0) + 1;
  NEW.last_played_at = CURRENT_TIMESTAMP;
  NEW.play_duration = COALESCE(NEW.play_duration, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for play statistics
CREATE TRIGGER track_voice_story_plays
  BEFORE UPDATE ON voice_stories
  FOR EACH ROW
  WHEN (OLD.play_count IS DISTINCT FROM NEW.play_count)
  EXECUTE FUNCTION update_voice_story_play_stats();

-- Create function to track cache hits
CREATE OR REPLACE FUNCTION update_voice_story_cache_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cache_hit_count = COALESCE(OLD.cache_hit_count, 0) + 1;
  NEW.cache_last_hit_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cache statistics
CREATE TRIGGER track_voice_story_cache_hits
  BEFORE UPDATE ON voice_stories
  FOR EACH ROW
  WHEN (OLD.cache_hit_count IS DISTINCT FROM NEW.cache_hit_count)
  EXECUTE FUNCTION update_voice_story_cache_stats();

-- Create function to analyze story content
CREATE OR REPLACE FUNCTION analyze_voice_story_content()
RETURNS TRIGGER AS $$
DECLARE
  sentiment jsonb;
  topics text[];
BEGIN
  -- Perform sentiment analysis (placeholder for AI integration)
  sentiment := jsonb_build_object(
    'positive_score', 0.0,
    'negative_score', 0.0,
    'neutral_score', 0.0,
    'dominant_emotion', 'neutral'
  );
  
  -- Extract topics (placeholder for AI integration)
  topics := ARRAY['placeholder_topic'];
  
  NEW.sentiment_analysis := sentiment;
  NEW.topic_tags := topics;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content analysis
CREATE TRIGGER analyze_voice_story_content
  BEFORE INSERT OR UPDATE OF story_text ON voice_stories
  FOR EACH ROW
  EXECUTE FUNCTION analyze_voice_story_content();

-- Create view for voice story analytics
CREATE OR REPLACE VIEW voice_story_analytics AS
SELECT
  id,
  created_at,
  language,
  voice_name,
  style,
  tone,
  word_count,
  duration,
  play_count,
  last_played_at,
  play_duration,
  cache_hit_count,
  cache_last_hit_at,
  generation_time_ms,
  sentiment_analysis,
  topic_tags,
  audio_quality_metrics,
  user_feedback
FROM voice_stories;

-- Create function to get story recommendations
CREATE OR REPLACE FUNCTION get_story_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  story_id UUID,
  title TEXT,
  language TEXT,
  style TEXT,
  tone TEXT,
  word_count INTEGER,
  duration INTEGER,
  play_count INTEGER,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_preferences AS (
    SELECT
      jsonb_object_agg(language, count) as language_prefs,
      jsonb_object_agg(style, count) as style_prefs,
      jsonb_object_agg(tone, count) as tone_prefs
    FROM (
      SELECT
        language,
        style,
        tone,
        count(*)
      FROM voice_stories
      WHERE user_id = p_user_id
      GROUP BY language, style, tone
    ) prefs
  ),
  story_scores AS (
    SELECT
      vs.id,
      vs.story_text as title,
      vs.language,
      vs.style,
      vs.tone,
      vs.word_count,
      vs.duration,
      vs.play_count,
      (
        COALESCE((up.language_prefs->>vs.language)::float, 0) * 0.4 +
        COALESCE((up.style_prefs->>vs.style)::float, 0) * 0.3 +
        COALESCE((up.tone_prefs->>vs.tone)::float, 0) * 0.3
      ) as similarity_score
    FROM voice_stories vs
    CROSS JOIN user_preferences up
    WHERE vs.user_id != p_user_id
  )
  SELECT
    id::UUID,
    title,
    language,
    style,
    tone,
    word_count,
    duration,
    play_count,
    similarity_score
  FROM story_scores
  ORDER BY similarity_score DESC, play_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_voice_story_analytics()
RETURNS void AS $$
BEGIN
  -- Archive old play statistics
  INSERT INTO voice_story_analytics_archive
  SELECT *
  FROM voice_story_analytics
  WHERE last_played_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
  
  -- Reset counters for archived stories
  UPDATE voice_stories
  SET
    play_count = 0,
    play_duration = 0,
    last_played_at = NULL
  WHERE last_played_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
  
  -- Clean up old cache data
  UPDATE voice_stories
  SET
    cache_key = NULL,
    cache_hit_count = 0,
    cache_last_hit_at = NULL
  WHERE cache_last_hit_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for analytics cleanup
SELECT cron.schedule(
  'cleanup-voice-story-analytics',
  '0 0 * * 0', -- Run weekly on Sunday at midnight
  $$SELECT cleanup_voice_story_analytics()$$
);

-- Add RLS policies for analytics
ALTER TABLE voice_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own story analytics"
  ON voice_stories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can view all analytics"
  ON voice_stories
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to get analytics summary
CREATE OR REPLACE FUNCTION get_voice_story_analytics_summary(
  p_start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  total_stories BIGINT,
  total_plays BIGINT,
  avg_duration FLOAT,
  avg_word_count FLOAT,
  popular_languages JSONB,
  popular_styles JSONB,
  popular_tones JSONB,
  cache_hit_rate FLOAT,
  avg_generation_time FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total_stories,
      SUM(play_count) as total_plays,
      AVG(duration) as avg_duration,
      AVG(word_count) as avg_word_count,
      AVG(generation_time_ms) as avg_generation_time,
      SUM(cache_hit_count)::float / NULLIF(COUNT(*), 0) as cache_hit_rate
    FROM voice_stories
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  language_stats AS (
    SELECT jsonb_object_agg(language, count) as popular_languages
    FROM (
      SELECT language, COUNT(*) as count
      FROM voice_stories
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY language
      ORDER BY count DESC
      LIMIT 5
    ) lang
  ),
  style_stats AS (
    SELECT jsonb_object_agg(style, count) as popular_styles
    FROM (
      SELECT style, COUNT(*) as count
      FROM voice_stories
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY style
      ORDER BY count DESC
      LIMIT 5
    ) sty
  ),
  tone_stats AS (
    SELECT jsonb_object_agg(tone, count) as popular_tones
    FROM (
      SELECT tone, COUNT(*) as count
      FROM voice_stories
      WHERE created_at BETWEEN p_start_date AND p_end_date
      GROUP BY tone
      ORDER BY count DESC
      LIMIT 5
    ) ton
  )
  SELECT
    s.total_stories,
    s.total_plays,
    s.avg_duration,
    s.avg_word_count,
    l.popular_languages,
    st.popular_styles,
    t.popular_tones,
    s.cache_hit_rate,
    s.avg_generation_time
  FROM stats s
  CROSS JOIN language_stats l
  CROSS JOIN style_stats st
  CROSS JOIN tone_stats t;
END;
$$ LANGUAGE plpgsql; 