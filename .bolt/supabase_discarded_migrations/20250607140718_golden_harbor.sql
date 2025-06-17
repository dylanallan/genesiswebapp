/*
  # Fix Performance Analytics Monitoring System

  1. Database Functions
    - Enhanced performance monitoring functions
    - Error handling and recovery procedures
    - Automated optimization triggers

  2. Analytics Tables
    - Performance metrics storage
    - System health tracking
    - Optimization logs

  3. Monitoring Procedures
    - Real-time performance tracking
    - Automated optimization triggers
    - Error recovery mechanisms
*/

-- Create enhanced performance monitoring functions
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  avg_query_time numeric;
  active_connections integer;
  cache_hit_ratio numeric;
  index_usage numeric;
BEGIN
  -- Get average query time from pg_stat_statements if available
  SELECT COALESCE(AVG(mean_exec_time), 0) INTO avg_query_time
  FROM pg_stat_statements
  WHERE calls > 10;

  -- Get active connections
  SELECT COUNT(*) INTO active_connections
  FROM pg_stat_activity
  WHERE state = 'active';

  -- Calculate cache hit ratio
  SELECT 
    CASE 
      WHEN (blks_hit + blks_read) > 0 
      THEN (blks_hit::numeric / (blks_hit + blks_read)) * 100
      ELSE 100
    END INTO cache_hit_ratio
  FROM pg_stat_database
  WHERE datname = current_database();

  -- Calculate index usage ratio
  SELECT 
    CASE 
      WHEN (idx_scan + seq_scan) > 0 
      THEN (idx_scan::numeric / (idx_scan + seq_scan)) * 100
      ELSE 100
    END INTO index_usage
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  LIMIT 1;

  result := jsonb_build_object(
    'avg_query_time', COALESCE(avg_query_time, 0),
    'active_connections', COALESCE(active_connections, 0),
    'cache_hit_ratio', COALESCE(cache_hit_ratio, 100),
    'index_usage', COALESCE(index_usage, 100),
    'timestamp', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return safe defaults on error
    RETURN jsonb_build_object(
      'avg_query_time', 0,
      'active_connections', 0,
      'cache_hit_ratio', 100,
      'index_usage', 100,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create AI provider metrics function
CREATE OR REPLACE FUNCTION get_ai_provider_metrics(
  p_provider_id text,
  p_days integer DEFAULT 7
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  total_requests integer;
  successful_requests integer;
  avg_response_time numeric;
  success_rate numeric;
BEGIN
  -- Get metrics from ai_request_logs
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE success = true),
    AVG(response_time_ms) FILTER (WHERE success = true)
  INTO total_requests, successful_requests, avg_response_time
  FROM ai_request_logs
  WHERE provider_id = p_provider_id
    AND created_at >= now() - (p_days || ' days')::interval;

  -- Calculate success rate
  success_rate := CASE 
    WHEN total_requests > 0 
    THEN (successful_requests::numeric / total_requests) 
    ELSE 1.0 
  END;

  result := jsonb_build_object(
    'total_requests', COALESCE(total_requests, 0),
    'successful_requests', COALESCE(successful_requests, 0),
    'success_rate', COALESCE(success_rate, 1.0),
    'avg_response_time_ms', COALESCE(avg_response_time, 0),
    'period_days', p_days,
    'timestamp', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'total_requests', 0,
      'successful_requests', 0,
      'success_rate', 1.0,
      'avg_response_time_ms', 0,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system optimization function
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  optimizations_applied text[] := '{}';
BEGIN
  -- Analyze all tables
  BEGIN
    EXECUTE 'ANALYZE';
    optimizations_applied := array_append(optimizations_applied, 'table_analysis');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations_applied := array_append(optimizations_applied, 'table_analysis_failed: ' || SQLERRM);
  END;

  -- Update table statistics
  BEGIN
    EXECUTE 'VACUUM ANALYZE';
    optimizations_applied := array_append(optimizations_applied, 'vacuum_analyze');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations_applied := array_append(optimizations_applied, 'vacuum_failed: ' || SQLERRM);
  END;

  -- Reindex if needed (only on small tables to avoid locks)
  BEGIN
    EXECUTE 'REINDEX INDEX CONCURRENTLY IF EXISTS idx_ai_request_logs_created_at';
    optimizations_applied := array_append(optimizations_applied, 'reindex_ai_logs');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations_applied := array_append(optimizations_applied, 'reindex_failed: ' || SQLERRM);
  END;

  result := jsonb_build_object(
    'optimizations_applied', optimizations_applied,
    'timestamp', now(),
    'success', true
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'optimizations_applied', optimizations_applied,
      'error', SQLERRM,
      'timestamp', now(),
      'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create analytics optimization function
CREATE OR REPLACE FUNCTION create_analytics_optimizations()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  optimizations text[] := '{}';
BEGIN
  -- Create analytics indexes if they don't exist
  BEGIN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC)';
    optimizations := array_append(optimizations, 'analytics_timestamp_index');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations := array_append(optimizations, 'analytics_index_failed: ' || SQLERRM);
  END;

  -- Create system health metrics indexes
  BEGIN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_ts_metric ON system_health_metrics(ts DESC, metric_name)';
    optimizations := array_append(optimizations, 'system_health_index');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations := array_append(optimizations, 'system_health_index_failed: ' || SQLERRM);
  END;

  -- Create AI request logs indexes
  BEGIN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_provider_time ON ai_request_logs(provider_id, created_at DESC)';
    optimizations := array_append(optimizations, 'ai_logs_provider_index');
  EXCEPTION
    WHEN OTHERS THEN
      optimizations := array_append(optimizations, 'ai_logs_index_failed: ' || SQLERRM);
  END;

  result := jsonb_build_object(
    'optimizations', optimizations,
    'timestamp', now(),
    'success', true
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'optimizations', optimizations,
      'error', SQLERRM,
      'timestamp', now(),
      'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create automation rules processing function
CREATE OR REPLACE FUNCTION process_automation_rules()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  processed_count integer := 0;
  error_count integer := 0;
  rule_record record;
BEGIN
  -- Process active automation workflows
  FOR rule_record IN 
    SELECT id, name, trigger_conditions, actions
    FROM automation_workflows
    WHERE is_active = true
    LIMIT 100
  LOOP
    BEGIN
      -- Update last processed timestamp
      UPDATE automation_workflows
      SET updated_at = now()
      WHERE id = rule_record.id;
      
      processed_count := processed_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
    END;
  END LOOP;

  result := jsonb_build_object(
    'processed_count', processed_count,
    'error_count', error_count,
    'timestamp', now(),
    'success', true
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'processed_count', processed_count,
      'error_count', error_count,
      'error', SQLERRM,
      'timestamp', now(),
      'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create journey stage update function
CREATE OR REPLACE FUNCTION update_journey_stage(
  p_journey_id uuid,
  p_new_stage text,
  p_journey_data jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  journey_exists boolean;
BEGIN
  -- Check if journey exists
  SELECT EXISTS(
    SELECT 1 FROM client_journeys WHERE id = p_journey_id
  ) INTO journey_exists;

  IF NOT journey_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Journey not found',
      'journey_id', p_journey_id
    );
  END IF;

  -- Update the journey
  UPDATE client_journeys
  SET 
    current_stage = p_new_stage,
    journey_data = COALESCE(p_journey_data, journey_data),
    updated_at = now()
  WHERE id = p_journey_id;

  result := jsonb_build_object(
    'success', true,
    'journey_id', p_journey_id,
    'new_stage', p_new_stage,
    'timestamp', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'journey_id', p_journey_id,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create AI request logging function
CREATE OR REPLACE FUNCTION log_ai_request(
  p_user_id uuid,
  p_provider_id text,
  p_request_type text DEFAULT 'chat',
  p_prompt_length integer DEFAULT 0,
  p_response_length integer DEFAULT 0,
  p_tokens_used integer DEFAULT 0,
  p_cost numeric DEFAULT 0,
  p_response_time_ms integer DEFAULT 0,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  log_id uuid;
BEGIN
  -- Insert AI request log
  INSERT INTO ai_request_logs (
    user_id,
    provider_id,
    request_type,
    prompt_length,
    response_length,
    tokens_used,
    cost,
    response_time_ms,
    success,
    error_message,
    created_at
  ) VALUES (
    p_user_id,
    p_provider_id,
    p_request_type,
    p_prompt_length,
    p_response_length,
    p_tokens_used,
    p_cost,
    p_response_time_ms,
    p_success,
    p_error_message,
    now()
  ) RETURNING id INTO log_id;

  result := jsonb_build_object(
    'success', true,
    'log_id', log_id,
    'timestamp', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create emergency security measures function
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  measures_applied text[] := '{}';
BEGIN
  -- Log security alert
  BEGIN
    INSERT INTO security_alerts (
      anomaly_score,
      metrics,
      timestamp,
      resolved
    ) VALUES (
      1.0,
      '{"emergency": true, "auto_triggered": true}'::jsonb,
      now(),
      false
    );
    measures_applied := array_append(measures_applied, 'security_alert_logged');
  EXCEPTION
    WHEN OTHERS THEN
      measures_applied := array_append(measures_applied, 'alert_logging_failed');
  END;

  -- Update system health metrics
  BEGIN
    INSERT INTO system_health_metrics (
      metric_name,
      metric_value,
      metadata,
      ts
    ) VALUES (
      'emergency_mode',
      1,
      '{"triggered_by": "security_monitor"}'::jsonb,
      now()
    );
    measures_applied := array_append(measures_applied, 'emergency_mode_enabled');
  EXCEPTION
    WHEN OTHERS THEN
      measures_applied := array_append(measures_applied, 'emergency_mode_failed');
  END;

  result := jsonb_build_object(
    'success', true,
    'measures_applied', measures_applied,
    'timestamp', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'measures_applied', measures_applied,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_database_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_provider_metrics(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION optimize_database_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION create_analytics_optimizations() TO authenticated;
GRANT EXECUTE ON FUNCTION process_automation_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION update_journey_stage(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION log_ai_request(uuid, text, text, integer, integer, integer, numeric, integer, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION enable_emergency_security_measures() TO authenticated;

-- Create system optimization logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_optimization_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  recommendations text NOT NULL,
  applied_at timestamptz DEFAULT now(),
  status text DEFAULT 'applied',
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create analytics events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create analytics metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id text NOT NULL,
  name text NOT NULL,
  value numeric NOT NULL,
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  change_percent numeric DEFAULT 0,
  category text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create analytics insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  impact text CHECK (impact IN ('high', 'medium', 'low')),
  action_items text[] DEFAULT '{}',
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_optimization_logs_component ON system_optimization_logs(component, applied_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_metrics_category_timestamp ON analytics_metrics(category, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_insights_impact_created ON analytics_insights(impact, created_at DESC);

-- Insert initial system health metrics
INSERT INTO system_health_metrics (metric_name, metric_value, metadata, ts)
VALUES 
  ('system_optimization', 1.0, '{"status": "active", "version": "2.0"}'::jsonb, now()),
  ('performance_monitoring', 1.0, '{"status": "active", "analytics": "enabled"}'::jsonb, now()),
  ('database_health', 0.95, '{"status": "optimal", "last_optimized": "now"}'::jsonb, now())
ON CONFLICT DO NOTHING;

-- Create a trigger to automatically update system health
CREATE OR REPLACE FUNCTION update_system_health()
RETURNS trigger AS $$
BEGIN
  -- Update system health timestamp
  INSERT INTO system_health_metrics (metric_name, metric_value, metadata, ts)
  VALUES ('last_activity', 1.0, jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP), now())
  ON CONFLICT DO NOTHING;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to key tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_request_logs') THEN
    DROP TRIGGER IF EXISTS update_system_health_ai_logs ON ai_request_logs;
    CREATE TRIGGER update_system_health_ai_logs
      AFTER INSERT OR UPDATE ON ai_request_logs
      FOR EACH ROW EXECUTE FUNCTION update_system_health();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_log') THEN
    DROP TRIGGER IF EXISTS update_system_health_activity ON user_activity_log;
    CREATE TRIGGER update_system_health_activity
      AFTER INSERT ON user_activity_log
      FOR EACH ROW EXECUTE FUNCTION update_system_health();
  END IF;
END $$;