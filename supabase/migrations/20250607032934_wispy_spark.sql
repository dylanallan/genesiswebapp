/*
  # Security System Setup

  1. New Tables
    - `security_alerts`
      - `id` (uuid, primary key)
      - `anomaly_score` (numeric)
      - `metrics` (jsonb)
      - `timestamp` (timestamptz)
      - `resolved` (boolean)
      - `resolution_notes` (text)
      - `resolved_at` (timestamptz)
    
    - `user_security_metadata`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `last_security_check` (timestamptz)
      - `security_score` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only
    - Add constraints for security scores

  3. Functions
    - Emergency security measures function
    - Security score calculation
    - Automated security score updates
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

-- Create indexes with IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_unresolved_alerts 
ON security_alerts(resolved, timestamp)
WHERE NOT resolved;

CREATE INDEX IF NOT EXISTS idx_user_security_metadata 
ON user_security_metadata(security_score);

-- Create function for emergency security measures
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log emergency activation
  INSERT INTO security_alerts (anomaly_score, metrics, timestamp)
  VALUES (1.0, '{"emergency": true, "activated_at": "' || now() || '"}', now());
  
  -- Additional emergency measures can be implemented here
  -- For example: rate limiting, IP blocking, etc.
END;
$$;

-- Enable RLS on all tables
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage security alerts" ON security_alerts;
DROP POLICY IF EXISTS "Admins can manage user security metadata" ON user_security_metadata;

-- Create policy for admin access to security alerts
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

-- Create function to calculate security score
CREATE OR REPLACE FUNCTION calculate_security_score(input_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score numeric := 0.5;
  recent_alerts integer;
  last_login timestamptz;
  account_age interval;
BEGIN
  -- Get recent security alerts for this user
  SELECT COUNT(*) INTO recent_alerts
  FROM security_alerts sa
  WHERE sa.timestamp > now() - interval '7 days'
    AND sa.resolved = false;
  
  -- Get user's last login (if available)
  SELECT last_sign_in_at INTO last_login
  FROM auth.users
  WHERE id = input_user_id;
  
  -- Calculate account age
  SELECT age(now(), created_at) INTO account_age
  FROM auth.users
  WHERE id = input_user_id;
  
  -- Base score calculation
  score := 0.5;
  
  -- Adjust based on recent alerts
  IF recent_alerts > 0 THEN
    score := score - (recent_alerts * 0.1);
  END IF;
  
  -- Adjust based on account age (older accounts are more trusted)
  IF account_age > interval '30 days' THEN
    score := score + 0.1;
  END IF;
  
  -- Adjust based on recent activity
  IF last_login IS NOT NULL AND last_login > now() - interval '7 days' THEN
    score := score + 0.1;
  END IF;
  
  -- Ensure score is within bounds
  score := GREATEST(0.0, LEAST(1.0, score));
  
  RETURN score;
END;
$$;

-- Create function to update security scores
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update security scores for all users
  INSERT INTO user_security_metadata (user_id, security_score, last_security_check, updated_at)
  SELECT 
    u.id,
    calculate_security_score(u.id),
    now(),
    now()
  FROM auth.users u
  ON CONFLICT (user_id) 
  DO UPDATE SET
    security_score = calculate_security_score(user_security_metadata.user_id),
    last_security_check = now(),
    updated_at = now();
END;
$$;

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_security_metadata_updated_at ON user_security_metadata;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_security_metadata_updated_at
  BEFORE UPDATE ON user_security_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();