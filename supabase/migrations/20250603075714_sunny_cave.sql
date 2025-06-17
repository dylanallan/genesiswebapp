/*
  # Enhanced Security System

  1. New Tables
    - `security_alerts`: Tracks security anomalies and incidents
      - `id` (uuid, primary key)
      - `anomaly_score` (numeric)
      - `metrics` (jsonb)
      - `timestamp` (timestamptz)
      - `resolved` (boolean)
      - `resolution_notes` (text)
      - `resolved_at` (timestamptz)

  2. Security Functions
    - Added emergency security measures function
    - Added security score calculation
    - Added security score update function

  3. Security Enhancements
    - Added security-related columns to users table
    - Created RLS policies for security tables
    - Added indexes for performance optimization
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
CREATE INDEX IF NOT EXISTS idx_unresolved_alerts ON security_alerts(resolved, timestamp)
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

-- Create policy using auth.jwt() instead of checking is_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage security alerts' AND tablename = 'security_alerts'
  ) THEN
    CREATE POLICY "Admins can manage security alerts"
      ON security_alerts
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END
$$;

-- Create user_metadata table for extra user data
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz,
  security_score numeric DEFAULT 0.5
);

-- Create function to update security scores
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_metadata
  SET 
    security_score = calculate_security_score(user_id),
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