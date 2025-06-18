/*
  # Security Alerts and Monitoring

  1. New Tables
    - `security_alerts` - Stores security anomalies and alerts
  
  2. Security
    - RLS policies for security tables
    - Admin-only access to security data
  
  3. Functions
    - Emergency security measures function
    - Security score calculation
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

-- Create index for unresolved alerts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_unresolved_alerts'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_unresolved_alerts ON security_alerts(resolved, timestamp)
    WHERE NOT resolved;
  END IF;
END $$;

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

-- Add security-related columns to existing tables if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_security_check') THEN
      ALTER TABLE users ADD COLUMN last_security_check timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'security_score') THEN
      ALTER TABLE users ADD COLUMN security_score numeric DEFAULT 0.5;
    END IF;
  END IF;
END $$;

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