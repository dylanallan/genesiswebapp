/*
  # User Security Metadata and Monitoring

  1. New Tables
    - `user_security_metadata` - Stores user security information
  
  2. Security
    - Enable RLS on user security metadata
    - Add admin-only policy for user security metadata
  
  3. Functions
    - Add enhanced security score calculation
    - Add updated timestamp trigger
*/

-- Create user security metadata table
CREATE TABLE IF NOT EXISTS user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for user security metadata
CREATE INDEX IF NOT EXISTS idx_user_security_metadata
ON user_security_metadata(security_score);

-- Enable RLS on user security metadata
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy for user security metadata if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_security_metadata' 
    AND policyname = 'Admins can manage user security metadata'
  ) THEN
    CREATE POLICY "Admins can manage user security metadata"
      ON user_security_metadata
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
  END IF;
END
$$;

-- Create function to calculate enhanced security score
CREATE OR REPLACE FUNCTION calculate_enhanced_security_score(user_id uuid)
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

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user security metadata if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_security_metadata_updated_at'
  ) THEN
    CREATE TRIGGER update_user_security_metadata_updated_at
      BEFORE UPDATE ON user_security_metadata
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;