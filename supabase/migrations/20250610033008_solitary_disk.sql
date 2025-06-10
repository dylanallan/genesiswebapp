/*
  # Marketing Funnel Performance Summary

  1. New Views
    - `funnel_performance_summary`: Materialized view for marketing funnel analytics
  
  2. Functions
    - `calculate_funnel_metrics`: Helper function to calculate conversion metrics
  
  3. Indexes
    - Added index on client journeys for efficient funnel analysis
*/

-- Create index for efficient funnel analysis
CREATE INDEX IF NOT EXISTS idx_client_journeys_funnel_user 
ON client_journeys(funnel_id, user_id);

-- Create function to calculate funnel metrics
CREATE OR REPLACE FUNCTION calculate_funnel_metrics(
  p_funnel_id uuid
) RETURNS TABLE (
  total_leads bigint,
  conversions bigint,
  conversion_rate numeric,
  avg_days_to_convert integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_leads bigint;
  v_conversions bigint;
  v_conversion_rate numeric;
  v_avg_days numeric;
BEGIN
  -- Count total leads
  SELECT count(*) INTO v_total_leads
  FROM client_journeys
  WHERE funnel_id = p_funnel_id;
  
  -- Count conversions
  SELECT count(*) INTO v_conversions
  FROM client_journeys
  WHERE funnel_id = p_funnel_id
  AND current_stage = 'converted';
  
  -- Calculate conversion rate
  IF v_total_leads > 0 THEN
    v_conversion_rate := (v_conversions::numeric / v_total_leads) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- Calculate average days to convert
  SELECT 
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (updated_at - started_at)) / 86400
      )::integer,
      0
    ) INTO v_avg_days
  FROM client_journeys
  WHERE funnel_id = p_funnel_id
  AND current_stage = 'converted';
  
  RETURN QUERY SELECT 
    v_total_leads, 
    v_conversions, 
    v_conversion_rate, 
    v_avg_days::integer;
END;
$$;

-- Create materialized view for funnel performance
CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_performance_summary AS
SELECT
  mf.id as funnel_id,
  mf.name as funnel_name,
  mf.user_id,
  cm.total_leads,
  cm.conversions,
  cm.conversion_rate,
  cm.avg_days_to_convert
FROM marketing_funnels mf
CROSS JOIN LATERAL calculate_funnel_metrics(mf.id) cm;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_funnel_performance_summary
ON funnel_performance_summary(funnel_id);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_funnel_performance_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW funnel_performance_summary;
END;
$$;