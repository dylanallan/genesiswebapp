-- Genesis Heritage Pro: Optimized RPC Functions
-- Run this script in your Supabase SQL editor to add high-performance functions to your database.

-- Function: get_paginated_timeline_events
-- Description: Retrieves a paginated list of timeline events for the currently authenticated user.
-- This is more secure and performant than client-side filtering and pagination.

CREATE OR REPLACE FUNCTION get_paginated_timeline_events(page_number int, page_size int)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  event_date date,
  category text,
  media_urls text[],
  created_at timestamptz
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id,
    te.title,
    te.description,
    te.event_date,
    te.category,
    te.media_urls,
    te.created_at
  FROM
    public.timeline_events te
  WHERE
    te.user_id = auth.uid() -- RLS is implicitly applied, but this makes it explicit.
  ORDER BY
    te.event_date DESC
  LIMIT
    page_size
  OFFSET
    (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- To call this function from the client:
-- const { data, error } = await supabase.rpc('get_paginated_timeline_events', { page_number: 1, page_size: 10 }); 