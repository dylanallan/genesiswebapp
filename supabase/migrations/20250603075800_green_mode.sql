/*
  # Security Enhancement Migration

  1. New Tables
    - security_alerts: Tracks security anomalies and incidents
    - user_security_metadata: Stores user security information
  2. Functions
    - enable_emergency_security_measures: Implements emergency security protocols
    - update_security_scores: Updates user security scores
    - calculate_security_score: Calculates individual user security scores
  3. Security
    - RLS enabled on all tables
    - Admin-only access policies
*/

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL,
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- Create user security metadata table
CREATE TABLE IF NOT EXISTS user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for unresolved alerts
CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
WHERE NOT resolved;

-- Create index for user security metadata
CREATE INDEX idx_user_security_metadata ON user_security_metadata(security_score);

-- Create function for emergency security measures
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implement emergency security measures
  -- This is a placeholder for actual implementation
  NULL;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy using auth.jwt() for admin access to security alerts
CREATE POLICY "Admins can manage security alerts"
  ON security_alerts
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Create policy for user security metadata
CREATE POLICY "Admins can manage user security metadata"
  ON user_security_metadata
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

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

-- Create function to calculate security score
CREATE OR REPLACE FUNCTION calculate_security_score(user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score numeric;
BEGIN
  -- Implement security score calculation
  -- This is a placeholder
  score := 0.5;
  RETURN score;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_security_metadata_updated_at
  BEFORE UPDATE ON user_security_metadata
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();