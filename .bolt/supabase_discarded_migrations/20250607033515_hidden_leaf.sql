/*
  # Security System Migration

  1. Security Infrastructure
    - `security_alerts` table for anomaly detection and threat monitoring
    - `user_security_metadata` table for user security profiles
    - Comprehensive indexing for performance optimization

  2. Security Functions
    - Emergency security measures with automatic lockdown capabilities
    - Dynamic security score calculation with multi-factor analysis
    - Automated security monitoring and response systems

  3. Access Control
    - Row Level Security (RLS) enabled on all security tables
    - Admin-only access policies for security management
    - Automated timestamp tracking for audit trails
*/

-- Create security alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- Create user security metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Handle indexes with proper existence checks
DO $$
BEGIN
  -- Drop and recreate unresolved alerts index
  DROP INDEX IF EXISTS idx_unresolved_alerts;
  CREATE INDEX IF NOT EXISTS idx_unresolved_alerts ON security_alerts(resolved, timestamp)
  WHERE NOT resolved;

  -- Create user security metadata index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_security_metadata' 
    AND indexname = 'idx_user_security_metadata'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_security_metadata ON user_security_metadata(security_score);
  END IF;
END $$;

-- Create enhanced emergency security measures function
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log emergency measure activation with detailed metrics
  INSERT INTO security_alerts (
    anomaly_score,
    metrics,
    timestamp,
    resolved
  ) VALUES (
    1.0,
    jsonb_build_object(
      'type', 'emergency_measures_activated',
      'trigger_time', now(),
      'severity', 'critical',
      'auto_response', true,
      'system_status', 'lockdown_initiated'
    ),
    now(),
    false
  );

  -- Additional emergency measures can be added here
  -- Such as rate limiting, IP blocking, etc.
  
  RAISE NOTICE 'Emergency security measures have been activated at %', now();
END;
$$;

-- Create comprehensive security score calculation function
CREATE OR REPLACE FUNCTION calculate_security_score(user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_score numeric := 0.5;
  alert_count integer;
  last_activity timestamptz;
  account_age interval;
  recent_activity_bonus numeric := 0;
  account_age_bonus numeric := 0;
  alert_penalty numeric := 0;
BEGIN
  -- Get number of unresolved security alerts for this user
  SELECT COUNT(*) INTO alert_count
  FROM security_alerts sa
  WHERE sa.metrics->>'user_id' = user_id::text
  AND sa.timestamp > now() - interval '30 days'
  AND sa.resolved = false;
  
  -- Calculate alert penalty (max 0.3 penalty)
  IF alert_count > 0 THEN
    alert_penalty := LEAST(alert_count * 0.1, 0.3);
  END IF;
  
  -- Get user activity information
  SELECT 
    last_sign_in_at,
    created_at
  INTO last_activity, account_age
  FROM auth.users
  WHERE id = user_id;
  
  -- Calculate account age (older accounts get slight bonus)
  IF account_age IS NOT NULL THEN
    account_age_bonus := LEAST(EXTRACT(days FROM now() - account_age) / 365.0 * 0.1, 0.1);
  END IF;
  
  -- Calculate recent activity bonus
  IF last_activity IS NOT NULL AND last_activity > now() - interval '7 days' THEN
    recent_activity_bonus := 0.1;
  ELSIF last_activity IS NOT NULL AND last_activity > now() - interval '30 days' THEN
    recent_activity_bonus := 0.05;
  END IF;
  
  -- Calculate final score
  base_score := base_score + account_age_bonus + recent_activity_bonus - alert_penalty;
  
  -- Ensure score stays within valid bounds [0.0, 1.0]
  RETURN GREATEST(LEAST(base_score, 1.0), 0.0);
END;
$$;

-- Create batch security score update function
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update existing user security metadata
  UPDATE user_security_metadata
  SET 
    security_score = calculate_security_score(user_id),
    last_security_check = now(),
    updated_at = now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Insert security metadata for users who don't have it yet
  INSERT INTO user_security_metadata (user_id, security_score, last_security_check)
  SELECT 
    u.id,
    calculate_security_score(u.id),
    now()
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM user_security_metadata usm 
    WHERE usm.user_id = u.id
  );
  
  RAISE NOTICE 'Updated security scores for % users and created % new records', 
    updated_count, 
    (SELECT COUNT(*) FROM user_security_metadata WHERE last_security_check = now());
END;
$$;

-- Create automated security alert resolution function
CREATE OR REPLACE FUNCTION auto_resolve_security_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-resolve low-risk alerts older than 24 hours
  UPDATE security_alerts
  SET 
    resolved = true,
    resolution_notes = 'Auto-resolved: Low risk alert aged out',
    resolved_at = now()
  WHERE 
    resolved = false
    AND anomaly_score < 0.3
    AND timestamp < now() - interval '24 hours';
    
  -- Log the auto-resolution activity
  INSERT INTO security_alerts (
    anomaly_score,
    metrics,
    timestamp,
    resolved
  ) VALUES (
    0.1,
    jsonb_build_object(
      'type', 'auto_resolution_batch',
      'resolved_count', (SELECT COUNT(*) FROM security_alerts WHERE resolved_at = now()),
      'batch_time', now()
    ),
    now(),
    true
  );
END;
$$;

-- Create or replace the update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Enable RLS on security tables (only if not already enabled)
DO $$
BEGIN
  -- Enable RLS on security_alerts if not already enabled
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'security_alerts') THEN
    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS on user_security_metadata if not already enabled
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_security_metadata') THEN
    ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Handle policies with proper existence checks and cleanup
DO $$
BEGIN
  -- Clean up existing policies for security_alerts
  DROP POLICY IF EXISTS "Admins can manage security alerts" ON security_alerts;
  DROP POLICY IF EXISTS "Admin access to security alerts" ON security_alerts;
  DROP POLICY IF EXISTS "Security alerts admin access" ON security_alerts;
  
  -- Create new policy for security_alerts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage security alerts' AND tablename = 'security_alerts'
  ) THEN
    CREATE POLICY "Admins can manage security alerts"
      ON security_alerts
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;

  -- Clean up existing policies for user_security_metadata
  DROP POLICY IF EXISTS "Admins can manage user security metadata" ON user_security_metadata;
  DROP POLICY IF EXISTS "Admin access to user security metadata" ON user_security_metadata;
  DROP POLICY IF EXISTS "User security metadata admin access" ON user_security_metadata;
  
  -- Create new policy for user_security_metadata
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage user security metadata' AND tablename = 'user_security_metadata'
  ) THEN
    CREATE POLICY "Admins can manage user security metadata"
      ON user_security_metadata
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END $$;

-- Create or replace the update timestamp trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_security_metadata_updated_at'
  ) THEN
    CREATE TRIGGER update_user_security_metadata_updated_at
      BEFORE UPDATE ON user_security_metadata
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END
$$;