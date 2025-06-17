-- Create security alerts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'security_alerts'
  ) THEN
    CREATE TABLE security_alerts (
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

    -- Enable RLS on security alerts table
    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

    -- Create policy for security alerts
    CREATE POLICY "Admins can manage security alerts"
      ON security_alerts
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END
$$;

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

-- Add security-related columns to auth.users if they don't exist
DO $$
BEGIN
  -- Check if last_security_check column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
    AND column_name = 'last_security_check'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN last_security_check timestamptz;
  END IF;

  -- Check if security_score column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
    AND column_name = 'security_score'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN security_score numeric DEFAULT 0.5;
  END IF;
END
$$;

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