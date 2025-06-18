/*
  # Security Monitoring Functions

  1. Functions
    - `check_security_anomalies`: Function to detect security anomalies
    - `create_security_alert`: Function to create security alerts
  
  2. Security
    - Functions are security definer to ensure proper access to security data
*/

-- Create function to check security anomalies
CREATE OR REPLACE FUNCTION check_security_anomalies()
RETURNS TABLE (
  anomaly_detected boolean,
  anomaly_score numeric,
  anomaly_type text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_failures integer;
  v_suspicious_ips integer;
  v_unusual_activity boolean;
  v_anomaly_score numeric := 0;
  v_anomaly_details jsonb := '{}'::jsonb;
BEGIN
  -- Check for authentication failures
  SELECT count(*) INTO v_auth_failures
  FROM user_activity_log
  WHERE activity_type = 'login_failed'
  AND created_at > now() - interval '1 hour';
  
  -- Check for suspicious IPs
  SELECT count(DISTINCT metadata->>'ip_address') INTO v_suspicious_ips
  FROM user_activity_log
  WHERE activity_type = 'login_failed'
  AND created_at > now() - interval '1 hour'
  AND (metadata->>'ip_address') IN (
    SELECT metadata->>'ip_address'
    FROM user_activity_log
    WHERE activity_type = 'login_failed'
    GROUP BY metadata->>'ip_address'
    HAVING count(*) > 5
  );
  
  -- Check for unusual activity patterns
  SELECT EXISTS (
    SELECT 1
    FROM user_activity_log
    WHERE created_at > now() - interval '1 hour'
    GROUP BY user_id
    HAVING count(*) > 100
  ) INTO v_unusual_activity;
  
  -- Calculate anomaly score
  v_anomaly_score := 
    LEAST(1.0, (v_auth_failures::numeric / 10) * 0.4 + 
               (v_suspicious_ips::numeric / 3) * 0.4 + 
               (v_unusual_activity::integer) * 0.2);
  
  -- Build anomaly details
  v_anomaly_details := jsonb_build_object(
    'auth_failures', v_auth_failures,
    'suspicious_ips', v_suspicious_ips,
    'unusual_activity', v_unusual_activity,
    'timestamp', now()
  );
  
  -- Return results
  anomaly_detected := v_anomaly_score > 0.5;
  anomaly_score := v_anomaly_score;
  anomaly_type := CASE
    WHEN v_auth_failures > 10 THEN 'authentication_attack'
    WHEN v_suspicious_ips > 3 THEN 'suspicious_ip_activity'
    WHEN v_unusual_activity THEN 'unusual_user_activity'
    ELSE 'low_level_anomaly'
  END;
  details := v_anomaly_details;
  
  RETURN NEXT;
END;
$$;

-- Create function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_anomaly_score numeric,
  p_metrics jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id uuid;
BEGIN
  INSERT INTO security_alerts (
    anomaly_score,
    metrics,
    timestamp,
    resolved
  ) VALUES (
    p_anomaly_score,
    p_metrics,
    now(),
    false
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Create function to enable emergency security measures
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create security alert
  PERFORM create_security_alert(
    0.9,
    jsonb_build_object(
      'emergency_measures', true,
      'triggered_by', current_user,
      'timestamp', now()
    )
  );
  
  -- Log the action
  INSERT INTO system_health_metrics (
    metric_name,
    metric_value,
    metadata
  ) VALUES (
    'emergency_security_measures',
    1,
    jsonb_build_object(
      'triggered_by', current_user,
      'timestamp', now()
    )
  );
END;
$$;