/*
  # Security Alerts and User Security Features

  1. New Tables
    - security_alerts: Store security anomalies and incidents
  
  2. New Functions
    - enable_emergency_security_measures: Implement emergency security protocols
    - update_security_scores: Update user security scores
    - calculate_security_score: Calculate security score for a user
  
  3. Security
    - Add RLS policies for security tables
    - Add security-related columns to users table
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

-- Create index for unresolved alerts (with IF NOT EXISTS)
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

-- Check if policy exists before creating
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

-- Add security-related columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_security_check'
  ) THEN
    ALTER TABLE users ADD COLUMN last_security_check timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'security_score'
  ) THEN
    ALTER TABLE users ADD COLUMN security_score numeric DEFAULT 0.5;
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

-- Create user security metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on security score
CREATE INDEX IF NOT EXISTS idx_user_security_metadata 
ON user_security_metadata(security_score);

-- Enable RLS on user security metadata
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy for user security metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage user security metadata' AND tablename = 'user_security_metadata'
  ) THEN
    CREATE POLICY "Admins can manage user security metadata"
      ON user_security_metadata
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END
$$;

-- Create trigger for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to user_security_metadata
DROP TRIGGER IF EXISTS update_user_security_metadata_updated_at ON user_security_metadata;

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