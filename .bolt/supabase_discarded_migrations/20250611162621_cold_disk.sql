/*
  # Fix Security Tables and Indices

  1. New Tables
    - `security_alerts` - Stores system security anomalies and alerts
    - `user_security_metadata` - Stores user-specific security information
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
  
  3. Changes
    - Add proper IF NOT EXISTS clauses to prevent duplicate errors
    - Create indices with proper error handling
    - Add security functions and triggers
*/

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
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
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indices with IF NOT EXISTS to prevent errors
DO $$ 
BEGIN
  -- Check if index exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_unresolved_alerts'
  ) THEN
    CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
    WHERE NOT resolved;
  END IF;

  -- Check if index exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_user_security_metadata'
  ) THEN
    CREATE INDEX idx_user_security_metadata ON user_security_metadata(security_score);
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

-- Enable RLS on all tables
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy using auth.jwt() for admin access to security alerts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_alerts' AND policyname = 'Admins can manage security alerts'
  ) THEN
    CREATE POLICY "Admins can manage security alerts"
      ON security_alerts
      FOR ALL
      TO authenticated
      USING (
        (auth.jwt() ->> 'role')::text = 'admin'
      );
  END IF;
END $$;

-- Create policy for user security metadata
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_security_metadata' AND policyname = 'Admins can manage user security metadata'
  ) THEN
    CREATE POLICY "Admins can manage user security metadata"
      ON user_security_metadata
      FOR ALL
      TO authenticated
      USING (
        (auth.jwt() ->> 'role')::text = 'admin'
      );
  END IF;
END $$;

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

-- Create or replace the updated_at column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_security_metadata_updated_at'
  ) THEN
    CREATE TRIGGER update_user_security_metadata_updated_at
      BEFORE UPDATE ON user_security_metadata
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;