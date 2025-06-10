/*
  # Cultural Content Search Functions

  1. Functions
    - `search_cultural_content`: Function to search across all cultural content
    - `find_related_cultural_items`: Function to find related cultural items
  
  2. Security
    - Functions use RLS to ensure users can only access their own data
*/

-- Create function to search cultural content
CREATE OR REPLACE FUNCTION search_cultural_content(
  p_query text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  title text,
  content_preview text,
  relevance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data or is admin
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only search their own content';
  END IF;

  RETURN QUERY
  
  -- Search cultural artifacts
  SELECT
    'artifact' as item_type,
    id as item_id,
    title,
    CASE
      WHEN length(description) > 100 THEN substring(description, 1, 97) || '...'
      ELSE description
    END as content_preview,
    ts_rank(fts, to_tsquery('english', p_query)) as relevance
  FROM cultural_artifacts
  WHERE user_id = p_user_id
  AND fts @@ to_tsquery('english', p_query)
  
  UNION ALL
  
  -- Search traditions
  SELECT
    'tradition' as item_type,
    id as item_id,
    name as title,
    CASE
      WHEN length(description) > 100 THEN substring(description, 1, 97) || '...'
      ELSE description
    END as content_preview,
    ts_rank(
      setweight(to_tsvector('english', name), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B'),
      to_tsquery('english', p_query)
    ) as relevance
  FROM traditions
  WHERE user_id = p_user_id
  AND (
    to_tsvector('english', name) @@ to_tsquery('english', p_query) OR
    to_tsvector('english', COALESCE(description, '')) @@ to_tsquery('english', p_query)
  )
  
  UNION ALL
  
  -- Search cultural stories
  SELECT
    'story' as item_type,
    id as item_id,
    title,
    CASE
      WHEN length(content) > 100 THEN substring(content, 1, 97) || '...'
      ELSE content
    END as content_preview,
    ts_rank(
      setweight(to_tsvector('english', title), 'A') ||
      setweight(to_tsvector('english', content), 'B'),
      to_tsquery('english', p_query)
    ) as relevance
  FROM cultural_stories
  WHERE user_id = p_user_id
  AND (
    to_tsvector('english', title) @@ to_tsquery('english', p_query) OR
    to_tsvector('english', content) @@ to_tsquery('english', p_query)
  )
  
  UNION ALL
  
  -- Search celebrations
  SELECT
    'celebration' as item_type,
    id as item_id,
    name as title,
    CASE
      WHEN length(description) > 100 THEN substring(description, 1, 97) || '...'
      ELSE description
    END as content_preview,
    ts_rank(
      setweight(to_tsvector('english', name), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B'),
      to_tsquery('english', p_query)
    ) as relevance
  FROM celebrations
  WHERE user_id = p_user_id
  AND (
    to_tsvector('english', name) @@ to_tsquery('english', p_query) OR
    to_tsvector('english', COALESCE(description, '')) @@ to_tsquery('english', p_query)
  )
  
  ORDER BY relevance DESC
  LIMIT 20;
END;
$$;

-- Create function to find related cultural items
CREATE OR REPLACE FUNCTION find_related_cultural_items(
  p_item_type text,
  p_item_id uuid
)
RETURNS TABLE (
  related_type text,
  related_id uuid,
  related_title text,
  relationship_type text,
  relationship_strength numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_item_title text;
  v_item_content text;
BEGIN
  -- Get user ID for the item
  CASE p_item_type
    WHEN 'artifact' THEN
      SELECT user_id, title, description INTO v_user_id, v_item_title, v_item_content
      FROM cultural_artifacts WHERE id = p_item_id;
    WHEN 'tradition' THEN
      SELECT user_id, name, description INTO v_user_id, v_item_title, v_item_content
      FROM traditions WHERE id = p_item_id;
    WHEN 'story' THEN
      SELECT user_id, title, content INTO v_user_id, v_item_title, v_item_content
      FROM cultural_stories WHERE id = p_item_id;
    WHEN 'celebration' THEN
      SELECT user_id, name, description INTO v_user_id, v_item_title, v_item_content
      FROM celebrations WHERE id = p_item_id;
    ELSE
      RAISE EXCEPTION 'Invalid item type: %', p_item_type;
  END CASE;
  
  -- Check if user owns the item or is admin
  IF v_user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Users can only find relations for their own items';
  END IF;

  -- Find related items based on content similarity
  RETURN QUERY
  
  -- Related artifacts
  SELECT
    'artifact' as related_type,
    ca.id as related_id,
    ca.title as related_title,
    'content_similarity' as relationship_type,
    similarity(
      COALESCE(v_item_title, '') || ' ' || COALESCE(v_item_content, ''),
      ca.title || ' ' || COALESCE(ca.description, '')
    ) as relationship_strength
  FROM cultural_artifacts ca
  WHERE ca.user_id = v_user_id
  AND ca.id <> CASE WHEN p_item_type = 'artifact' THEN p_item_id ELSE uuid_nil() END
  
  UNION ALL
  
  -- Related traditions
  SELECT
    'tradition' as related_type,
    t.id as related_id,
    t.name as related_title,
    'content_similarity' as relationship_type,
    similarity(
      COALESCE(v_item_title, '') || ' ' || COALESCE(v_item_content, ''),
      t.name || ' ' || COALESCE(t.description, '')
    ) as relationship_strength
  FROM traditions t
  WHERE t.user_id = v_user_id
  AND t.id <> CASE WHEN p_item_type = 'tradition' THEN p_item_id ELSE uuid_nil() END
  
  UNION ALL
  
  -- Related stories
  SELECT
    'story' as related_type,
    cs.id as related_id,
    cs.title as related_title,
    'content_similarity' as relationship_type,
    similarity(
      COALESCE(v_item_title, '') || ' ' || COALESCE(v_item_content, ''),
      cs.title || ' ' || cs.content
    ) as relationship_strength
  FROM cultural_stories cs
  WHERE cs.user_id = v_user_id
  AND cs.id <> CASE WHEN p_item_type = 'story' THEN p_item_id ELSE uuid_nil() END
  
  UNION ALL
  
  -- Related celebrations
  SELECT
    'celebration' as related_type,
    c.id as related_id,
    c.name as related_title,
    'content_similarity' as relationship_type,
    similarity(
      COALESCE(v_item_title, '') || ' ' || COALESCE(v_item_content, ''),
      c.name || ' ' || COALESCE(c.description, '')
    ) as relationship_strength
  FROM celebrations c
  WHERE c.user_id = v_user_id
  AND c.id <> CASE WHEN p_item_type = 'celebration' THEN p_item_id ELSE uuid_nil() END
  
  ORDER BY relationship_strength DESC
  LIMIT 10;
END;
$$;