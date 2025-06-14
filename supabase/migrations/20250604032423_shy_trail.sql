/*
  # Security System Setup

  1. New Tables
    - security_alerts: Stores security-related alerts and incidents
    - user_security_metadata: Stores user-specific security information

  2. Functions
    - enable_emergency_security_measures: Implements emergency security protocols
    - update_security_scores: Updates user security scores
    - calculate_security_score: Calculates security scores based on user activity

  3. Security
    - RLS enabled on all tables
    - Admin-only access policies
    - Score validation constraints
*/

-- Drop existing objects if they exist
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS user_security_metadata CASCADE;

-- Create security alerts table
CREATE TABLE security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- Create user security metadata table
CREATE TABLE user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_unresolved_alerts 
ON security_alerts(resolved, timestamp) 
WHERE NOT resolved;

CREATE INDEX IF NOT EXISTS idx_user_security_metadata 
ON user_security_metadata(security_score);

-- Create security functions
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

-- Create function to calculate security score
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

-- Create function to update security scores
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

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage security alerts" ON security_alerts;
DROP POLICY IF EXISTS "Admins can manage user security metadata" ON user_security_metadata;

-- Create new policies
CREATE POLICY "Admins can manage security alerts"
  ON security_alerts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Admins can manage user security metadata"
  ON user_security_metadata
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_user_security_metadata_updated_at ON user_security_metadata;
CREATE TRIGGER update_user_security_metadata_updated_at
  BEFORE UPDATE ON user_security_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();