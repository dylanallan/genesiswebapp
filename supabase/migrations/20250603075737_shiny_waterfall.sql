/*
  # Security System Enhancement

  1. New Tables
    - security_alerts: Tracks security anomalies and incidents
      - id (uuid, primary key)
      - anomaly_score (numeric)
      - metrics (jsonb)
      - timestamp (timestamptz)
      - resolved (boolean)
      - resolution_notes (text)
      - resolved_at (timestamptz)

  2. Security Features
    - Index for quick access to unresolved alerts
    - Emergency security measures function
    - RLS policy for admin-only access to security alerts
    - Security score tracking for users
    - Functions for security score calculation and updates

  3. Changes
    - Added security-related columns to auth.users
    - Created security alert management system
    - Implemented security scoring system
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

-- Create index for unresolved alerts
CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
WHERE NOT resolved;

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

-- Create RLS policies for security tables
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy using auth.jwt() for admin access
CREATE POLICY "Admins can manage security alerts"
  ON security_alerts
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Add security-related columns to auth.users
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS
  last_security_check timestamptz;

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS
  security_score numeric DEFAULT 0.5;

-- Create function to update security scores
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET 
    security_score = calculate_security_score(id),
    last_security_check = now();
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