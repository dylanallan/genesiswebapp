-- Fix system performance monitoring
CREATE TABLE IF NOT EXISTS system_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  component text NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create hypertable for performance logs
SELECT create_hypertable('system_performance_logs', 'timestamp',
  chunk_time_interval => interval '1 day',
  if_not_exists => TRUE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_perf_logs_component_ts 
ON system_performance_logs (component, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_perf_logs_metric_ts 
ON system_performance_logs (metric_type, timestamp DESC);

-- Create monitoring view
CREATE MATERIALIZED VIEW IF NOT EXISTS system_performance_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('5 minutes', timestamp) as bucket,
  component,
  metric_type,
  avg(value) as avg_value,
  min(value) as min_value,
  max(value) as max_value,
  count(*) as sample_count
FROM system_performance_logs
GROUP BY bucket, component, metric_type
WITH NO DATA;

-- Add retention policy
SELECT add_retention_policy('system_performance_logs',
  INTERVAL '7 days',
  if_not_exists => TRUE
);

-- Create function to log system performance
CREATE OR REPLACE FUNCTION log_system_performance(
  p_component text,
  p_metric_type text,
  p_value numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO system_performance_logs (
    component,
    metric_type,
    value,
    metadata
  ) VALUES (
    p_component,
    p_metric_type,
    p_value,
    p_metadata
  );
END;
$$;

-- Create function to analyze system health
CREATE OR REPLACE FUNCTION analyze_system_health()
RETURNS TABLE (
  component text,
  health_score numeric,
  issues jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH recent_metrics AS (
    SELECT 
      component,
      avg(value) as avg_value,
      stddev(value) as std_value
    FROM system_performance_logs
    WHERE timestamp > now() - interval '1 hour'
    GROUP BY component
  )
  SELECT 
    rm.component,
    CASE 
      WHEN rm.std_value = 0 THEN 1.0
      ELSE least(1.0, greatest(0.0, 1.0 - (rm.std_value / rm.avg_value)))
    END as health_score,
    jsonb_build_object(
      'average', rm.avg_value,
      'deviation', rm.std_value,
      'samples', count(*)
    ) as issues
  FROM recent_metrics rm;
END;
$$;

-- Create alert function
CREATE OR REPLACE FUNCTION create_system_alert(
  p_component text,
  p_severity text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO system_alerts (
    component,
    severity,
    message,
    metadata,
    created_at
  ) VALUES (
    p_component,
    p_severity,
    p_message,
    p_metadata,
    now()
  )
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$;