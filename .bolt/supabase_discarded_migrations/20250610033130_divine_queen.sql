/*
  # Cultural Heritage Analysis Functions

  1. Functions
    - `analyze_cultural_artifacts`: Function to analyze cultural artifacts
    - `find_related_traditions`: Function to find related traditions
    - `generate_cultural_insights`: Function to generate cultural insights
  
  2. Security
    - Functions use RLS to ensure users can only access their own data
*/

-- Create function to analyze cultural artifacts
CREATE OR REPLACE FUNCTION analyze_cultural_artifacts(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  artifact_id uuid,
  title text,
  category text,
  related_traditions text[],
  cultural_significance numeric,
  preservation_priority text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only analyze their own artifacts';
  END IF;

  RETURN QUERY
  WITH artifact_analysis AS (
    SELECT
      ca.id,
      ca.title,
      ca.category,
      ca.metadata->>'cultural_significance' as significance_text,
      CASE
        WHEN ca.metadata->>'rarity' IS NOT NULL THEN (ca.metadata->>'rarity')::numeric
        ELSE 0.5
      END as rarity_score,
      CASE
        WHEN ca.metadata->>'age' IS NOT NULL THEN (ca.metadata->>'age')::numeric
        ELSE 0.5
      END as age_score,
      array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tradition_names
    FROM cultural_artifacts ca
    LEFT JOIN tradition_artifacts ta ON ca.id = ta.artifact_id
    LEFT JOIN traditions t ON ta.tradition_id = t.id
    WHERE ca.user_id = p_user_id
    GROUP BY ca.id, ca.title, ca.category, ca.metadata
  )
  SELECT
    aa.id,
    aa.title,
    aa.category,
    aa.tradition_names,
    (aa.rarity_score * 0.5 + aa.age_score * 0.5) as cultural_significance,
    CASE
      WHEN (aa.rarity_score * 0.5 + aa.age_score * 0.5) > 0.8 THEN 'High'
      WHEN (aa.rarity_score * 0.5 + aa.age_score * 0.5) > 0.5 THEN 'Medium'
      ELSE 'Low'
    END as preservation_priority
  FROM artifact_analysis aa;
END;
$$;

-- Create function to find related traditions
CREATE OR REPLACE FUNCTION find_related_traditions(
  p_tradition_id uuid
)
RETURNS TABLE (
  tradition_id uuid,
  name text,
  similarity_score numeric,
  common_artifacts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the tradition or is admin
  IF NOT EXISTS (
    SELECT 1 FROM traditions 
    WHERE id = p_tradition_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only find relations for their own traditions';
  END IF;

  RETURN QUERY
  WITH source_artifacts AS (
    SELECT artifact_id
    FROM tradition_artifacts
    WHERE tradition_id = p_tradition_id
  ),
  tradition_matches AS (
    SELECT
      t.id,
      t.name,
      count(ta.artifact_id) as common_count
    FROM traditions t
    JOIN tradition_artifacts ta ON t.id = ta.tradition_id
    WHERE ta.artifact_id IN (SELECT artifact_id FROM source_artifacts)
    AND t.id <> p_tradition_id
    GROUP BY t.id, t.name
  )
  SELECT
    tm.id,
    tm.name,
    (tm.common_count::numeric / 
      (SELECT count(*) FROM source_artifacts)) as similarity_score,
    tm.common_count
  FROM tradition_matches tm
  ORDER BY similarity_score DESC;
END;
$$;

-- Create function to generate cultural insights
CREATE OR REPLACE FUNCTION generate_cultural_insights(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  insight_type text,
  insight_text text,
  confidence numeric,
  related_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only generate insights for their own data';
  END IF;

  -- Return cultural insights based on user's data
  RETURN QUERY
  
  -- Tradition insights
  SELECT
    'tradition_patterns' as insight_type,
    'Common themes found across your traditions' as insight_text,
    0.85 as confidence,
    jsonb_build_object(
      'common_origins', (
        SELECT jsonb_agg(DISTINCT origin)
        FROM traditions
        WHERE user_id = p_user_id
        AND origin IS NOT NULL
      ),
      'tradition_count', (
        SELECT count(*)
        FROM traditions
        WHERE user_id = p_user_id
      )
    ) as related_items
  
  UNION ALL
  
  -- Celebration insights
  SELECT
    'celebration_patterns' as insight_type,
    'Seasonal patterns in your celebrations' as insight_text,
    0.75 as confidence,
    jsonb_build_object(
      'seasons', (
        SELECT jsonb_object_agg(
          date_or_season, count(*)
        )
        FROM celebrations
        WHERE user_id = p_user_id
        AND date_or_season IS NOT NULL
        GROUP BY date_or_season
      ),
      'celebration_count', (
        SELECT count(*)
        FROM celebrations
        WHERE user_id = p_user_id
      )
    ) as related_items
  
  UNION ALL
  
  -- Artifact insights
  SELECT
    'artifact_significance' as insight_type,
    'Most culturally significant artifacts' as insight_text,
    0.8 as confidence,
    jsonb_build_object(
      'top_artifacts', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', id,
            'title', title,
            'category', category
          )
        )
        FROM cultural_artifacts
        WHERE user_id = p_user_id
        ORDER BY (metadata->>'cultural_significance')::numeric DESC NULLS LAST
        LIMIT 5
      )
    ) as related_items;
END;
$$;