/*
  # Security Alerts System Fix

  1. Updates
    - Fix security alerts table and policies
    - Ensure no duplicate policies
  
  2. Security
    - Maintain RLS on security tables
    - Fix admin policies
*/

-- Check if security_alerts table exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_alerts') THEN
    -- Create security alerts table
    CREATE TABLE public.security_alerts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
      metrics jsonb NOT NULL,
      timestamp timestamptz DEFAULT now(),
      resolved boolean DEFAULT false,
      resolution_notes text,
      resolved_at timestamptz
    );

    -- Create index for unresolved alerts
    CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
    WHERE NOT resolved;

    -- Enable RLS
    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

    -- Create admin policy
    CREATE POLICY "Admins can manage security alerts"
      ON security_alerts
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;
END
$$;

-- Create user security metadata table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_security_metadata') THEN
    CREATE TABLE public.user_security_metadata (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      last_security_check timestamptz DEFAULT now(),
      security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Create index
    CREATE INDEX idx_user_security_metadata ON user_security_metadata(security_score);

    -- Enable RLS
    ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

    -- Create admin policy
    CREATE POLICY "Admins can manage user security metadata"
      ON user_security_metadata
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');

    -- Create trigger for updated_at
    CREATE TRIGGER update_user_security_metadata_updated_at
      BEFORE UPDATE ON user_security_metadata
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Create or replace emergency security functions
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lock down sensitive operations
  UPDATE auth.config
  SET enable_signup = false
  WHERE id = 1;
  
  -- Log emergency measure activation
  INSERT INTO security_alerts (
    anomaly_score,
    metrics,
    timestamp
  ) VALUES (
    1.0,
    jsonb_build_object(
      'type', 'emergency_measures',
      'trigger_time', now()
    ),
    now()
  );
END;
$$;

-- Create or replace security score functions
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_security_metadata
  SET 
    security_score = calculate_security_score(user_id),
    last_security_check = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION calculate_security_score(user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_score numeric := 0.5;
  alert_count integer;
  last_activity timestamptz;
BEGIN
  -- Get number of security alerts
  SELECT COUNT(*) INTO alert_count
  FROM security_alerts sa
  WHERE sa.metrics->>'user_id' = user_id::text
  AND sa.timestamp > now() - interval '30 days';
  
  -- Adjust score based on alerts
  IF alert_count > 0 THEN
    base_score := base_score - (alert_count * 0.1);
  END IF;
  
  -- Get last activity
  SELECT last_sign_in_at INTO last_activity
  FROM auth.users
  WHERE id = user_id;
  
  -- Adjust score based on activity
  IF last_activity > now() - interval '7 days' THEN
    base_score := base_score + 0.1;
  END IF;
  
  -- Ensure score stays within bounds
  RETURN GREATEST(LEAST(base_score, 1.0), 0.0);
END;
$$;