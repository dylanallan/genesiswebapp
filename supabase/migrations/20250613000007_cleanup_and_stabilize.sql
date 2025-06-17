-- Cleanup and stabilize database for Bolt.new integration
BEGIN;

-- Drop unnecessary tables and functions
DROP TABLE IF EXISTS voice_story_analytics CASCADE;
DROP TABLE IF EXISTS voice_story_metrics CASCADE;
DROP TABLE IF EXISTS voice_story_cache CASCADE;
DROP TABLE IF EXISTS voice_story_errors CASCADE;
DROP TABLE IF EXISTS voice_story_recommendations CASCADE;
DROP TABLE IF EXISTS voice_story_playback_stats CASCADE;
DROP TABLE IF EXISTS voice_story_feedback CASCADE;
DROP TABLE IF EXISTS voice_story_versions CASCADE;
DROP TABLE IF EXISTS voice_story_processing_queue CASCADE;
DROP TABLE IF EXISTS voice_story_processing_logs CASCADE;
DROP TABLE IF EXISTS voice_story_processing_errors CASCADE;
DROP TABLE IF EXISTS voice_story_processing_metrics CASCADE;
DROP TABLE IF EXISTS voice_story_processing_cache CASCADE;
DROP TABLE IF EXISTS voice_story_processing_recommendations CASCADE;
DROP TABLE IF EXISTS voice_story_processing_feedback CASCADE;
DROP TABLE IF EXISTS voice_story_processing_versions CASCADE;

-- Drop unnecessary functions
DROP FUNCTION IF EXISTS update_voice_story_error CASCADE;
DROP FUNCTION IF EXISTS track_voice_story_errors CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_voice_stories CASCADE;
DROP FUNCTION IF EXISTS get_story_recommendations CASCADE;
DROP FUNCTION IF EXISTS analyze_story_content CASCADE;
DROP FUNCTION IF EXISTS update_play_statistics CASCADE;
DROP FUNCTION IF EXISTS update_cache_hit_statistics CASCADE;
DROP FUNCTION IF EXISTS get_analytics_summary CASCADE;

-- Drop unnecessary views
DROP VIEW IF EXISTS voice_story_statistics CASCADE;
DROP VIEW IF EXISTS voice_story_analytics_view CASCADE;

-- Drop unnecessary triggers
DROP TRIGGER IF EXISTS track_voice_story_errors ON voice_stories CASCADE;
DROP TRIGGER IF EXISTS update_play_statistics_trigger ON voice_stories CASCADE;
DROP TRIGGER IF EXISTS update_cache_hit_statistics_trigger ON voice_stories CASCADE;

-- Drop unnecessary indexes
DROP INDEX IF EXISTS idx_voice_stories_play_count CASCADE;
DROP INDEX IF EXISTS idx_voice_stories_last_played_at CASCADE;
DROP INDEX IF EXISTS idx_voice_stories_topic_tags CASCADE;
DROP INDEX IF EXISTS idx_voice_stories_voice_config CASCADE;
DROP INDEX IF EXISTS idx_voice_stories_story_analysis CASCADE;

-- Clean up voice_stories table to essential columns
ALTER TABLE voice_stories
  DROP COLUMN IF EXISTS voice_config,
  DROP COLUMN IF EXISTS voice_characteristics,
  DROP COLUMN IF EXISTS audio_processing_metadata,
  DROP COLUMN IF EXISTS audio_quality_metrics,
  DROP COLUMN IF EXISTS story_analysis,
  DROP COLUMN IF EXISTS sentiment_analysis,
  DROP COLUMN IF EXISTS topic_tags,
  DROP COLUMN IF EXISTS play_count,
  DROP COLUMN IF EXISTS last_played_at,
  DROP COLUMN IF EXISTS play_duration,
  DROP COLUMN IF EXISTS user_feedback,
  DROP COLUMN IF EXISTS cache_key,
  DROP COLUMN IF EXISTS cache_hit_count,
  DROP COLUMN IF EXISTS cache_last_hit_at,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS previous_versions;

-- Keep only essential columns in voice_stories
ALTER TABLE voice_stories
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS voice_name TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS audio_format TEXT NOT NULL DEFAULT 'mp3',
  ADD COLUMN IF NOT EXISTS audio_quality TEXT NOT NULL DEFAULT 'high',
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_voice_stories_user_id ON voice_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_stories_created_at ON voice_stories(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_stories_status ON voice_stories(status);
CREATE INDEX IF NOT EXISTS idx_voice_stories_language ON voice_stories(language);

-- Create essential function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_voice_stories_updated_at ON voice_stories;
CREATE TRIGGER update_voice_stories_updated_at
    BEFORE UPDATE ON voice_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create essential RLS policies
ALTER TABLE voice_stories ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own stories
CREATE POLICY "Users can view their own stories"
    ON voice_stories FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own stories
CREATE POLICY "Users can insert their own stories"
    ON voice_stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own stories
CREATE POLICY "Users can update their own stories"
    ON voice_stories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own stories
CREATE POLICY "Users can delete their own stories"
    ON voice_stories FOR DELETE
    USING (auth.uid() = user_id);

-- Create essential function for voice story generation
CREATE OR REPLACE FUNCTION generate_voice_story(
    p_title TEXT,
    p_content TEXT,
    p_language TEXT DEFAULT 'en-US',
    p_voice_name TEXT DEFAULT 'en-US-Standard-A',
    p_audio_format TEXT DEFAULT 'mp3',
    p_audio_quality TEXT DEFAULT 'high'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_story_id UUID;
BEGIN
    INSERT INTO voice_stories (
        user_id,
        title,
        content,
        language,
        voice_name,
        audio_format,
        audio_quality,
        status,
        word_count
    )
    VALUES (
        auth.uid(),
        p_title,
        p_content,
        p_language,
        p_voice_name,
        p_audio_format,
        p_audio_quality,
        'pending',
        length(p_content) - length(replace(p_content, ' ', '')) + 1
    )
    RETURNING id INTO v_story_id;
    
    RETURN v_story_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON voice_stories TO authenticated;
GRANT EXECUTE ON FUNCTION generate_voice_story TO authenticated;

COMMIT; 