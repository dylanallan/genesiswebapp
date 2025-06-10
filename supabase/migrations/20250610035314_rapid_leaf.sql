/*
  # Security Alerts and Monitoring

  1. New Tables
    - `security_alerts` - Stores security anomalies and alerts
  
  2. Security
    - Enable RLS on security_alerts table
    - Add admin-only policy for security alerts
  
  3. Functions
    - Add emergency security measures function
*/

-- Create security alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL,
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

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

-- Enable RLS on security alerts table
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for security alerts
CREATE POLICY "Only admins can manage security alerts"
  ON security_alerts
  FOR ALL
  TO authenticated
  USING (
    (jwt() ->> 'role'::text) = 'admin'::text
  );

-- Add security-related columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  last_security_check timestamptz;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  security_score numeric DEFAULT 0.5;

-- Create function to update security scores
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
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

-- Create index for unresolved alerts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_unresolved_alerts'
  ) THEN
    CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
    WHERE NOT resolved;
  END IF;
END
$$;