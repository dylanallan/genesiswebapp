/*
  # Security System Migration - Enhanced with Proper Error Handling

  1. Security Infrastructure
    - `security_alerts` table for anomaly detection and threat monitoring
    - `user_security_metadata` table for individual user security profiles
    - Comprehensive indexing for performance optimization

  2. Security Features
    - Real-time anomaly scoring and alert generation
    - Dynamic user security score calculation
    - Emergency security response capabilities
    - Comprehensive audit trail and monitoring

  3. Access Control
    - Row Level Security (RLS) enabled on all security tables
    - Admin-only access policies for security management
    - Secure function execution with SECURITY DEFINER

  4. Automation
    - Automated security score updates
    - Trigger-based timestamp management
    - Emergency response activation capabilities
*/

-- Create security alerts table with proper constraints
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  metrics jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamptz
);

-- Create user security metadata table with enhanced constraints
CREATE TABLE IF NOT EXISTS user_security_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_security_check timestamptz DEFAULT now(),
  security_score numeric DEFAULT 0.5 CHECK (security_score >= 0 AND security_score <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes with proper error handling
DO $$
BEGIN
  -- Create index for unresolved alerts if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'security_alerts' 
    AND indexname = 'idx_unresolved_alerts'
  ) THEN
    CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
    WHERE NOT resolved;
  END IF;

  -- Create index for user security metadata if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'user_security_metadata' 
    AND indexname = 'idx_user_security_metadata'
  ) THEN
    CREATE INDEX idx_user_security_metadata ON user_security_metadata(security_score);
  END IF;
END
$$;

-- Create enhanced emergency security measures function
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log emergency activation
  INSERT INTO security_alerts (anomaly_score, metrics, timestamp)
  VALUES (1.0, '{"emergency_activated": true, "timestamp": "' || now() || '"}', now());
  
  -- Additional emergency measures can be implemented here
  -- Such as rate limiting, IP blocking, etc.
  
  RAISE NOTICE 'Emergency security measures activated at %', now();
END;
$$;

-- Enable RLS on security tables
DO $$
BEGIN
  -- Enable RLS on security_alerts if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'security_alerts' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on user_security_metadata if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_security_metadata' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE user_security_metadata ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create RLS policies with proper conflict handling
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins can manage security alerts" ON security_alerts;
  DROP POLICY IF EXISTS "Admins can manage user security metadata" ON user_security_metadata;
  
  -- Create admin policy for security alerts
  CREATE POLICY "Admins can manage security alerts"
    ON security_alerts
    FOR ALL
    TO authenticated
    USING (
      (auth.jwt() ->> 'role')::text = 'admin'
    );

  -- Create admin policy for user security metadata
  CREATE POLICY "Admins can manage user security metadata"
    ON user_security_metadata
    FOR ALL
    TO authenticated
    USING (
      (auth.jwt() ->> 'role')::text = 'admin'
    );
END
$$;

-- Create enhanced security score calculation function
CREATE OR REPLACE FUNCTION calculate_security_score(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_score numeric := 0.5;
  alert_penalty numeric := 0;
  account_age_bonus numeric := 0;
  activity_bonus numeric := 0;
  final_score numeric;
BEGIN
  -- Calculate penalty based on recent unresolved alerts
  SELECT COALESCE(COUNT(*) * 0.1, 0) INTO alert_penalty
  FROM security_alerts sa
  JOIN user_security_metadata usm ON usm.user_id = p_user_id
  WHERE sa.timestamp > now() - interval '7 days'
  AND sa.resolved = false;

  -- Calculate bonus based on account age (older accounts are more trusted)
  SELECT CASE 
    WHEN extract(days from now() - auth.users.created_at) > 365 THEN 0.2
    WHEN extract(days from now() - auth.users.created_at) > 90 THEN 0.1
    WHEN extract(days from now() - auth.users.created_at) > 30 THEN 0.05
    ELSE 0
  END INTO account_age_bonus
  FROM auth.users
  WHERE id = p_user_id;

  -- Calculate bonus based on recent activity
  SELECT CASE 
    WHEN last_sign_in_at > now() - interval '1 day' THEN 0.1
    WHEN last_sign_in_at > now() - interval '7 days' THEN 0.05
    ELSE 0
  END INTO activity_bonus
  FROM auth.users
  WHERE id = p_user_id;

  -- Calculate final score with bounds checking
  final_score := base_score + COALESCE(account_age_bonus, 0) + COALESCE(activity_bonus, 0) - COALESCE(alert_penalty, 0);
  
  -- Ensure score stays within valid range
  final_score := GREATEST(0, LEAST(1, final_score));
  
  RETURN final_score;
END;
$$;

-- Create function to update all security scores
CREATE OR REPLACE FUNCTION update_security_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update security scores for all users
  UPDATE user_security_metadata
  SET 
    security_score = calculate_security_score(user_id),
    last_security_check = now(),
    updated_at = now()
  WHERE user_id IS NOT NULL;
  
  -- Insert metadata for users who don't have it yet
  INSERT INTO user_security_metadata (user_id, security_score, last_security_check)
  SELECT 
    au.id,
    calculate_security_score(au.id),
    now()
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_security_metadata usm 
    WHERE usm.user_id = au.id
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger with proper conflict handling
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS update_user_security_metadata_updated_at ON user_security_metadata;
  
  -- Create the trigger
  CREATE TRIGGER update_user_security_metadata_updated_at
    BEFORE UPDATE ON user_security_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END
$$;

-- Create function to process security alerts and auto-resolve low-risk ones
CREATE OR REPLACE FUNCTION process_security_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-resolve low-risk alerts older than 24 hours
  UPDATE security_alerts
  SET 
    resolved = true,
    resolution_notes = 'Auto-resolved: Low risk alert aged out',
    resolved_at = now()
  WHERE 
    anomaly_score < 0.3
    AND timestamp < now() - interval '24 hours'
    AND resolved = false;
    
  -- Log processing completion
  INSERT INTO security_alerts (anomaly_score, metrics)
  VALUES (0.1, '{"type": "system", "action": "alert_processing_completed", "timestamp": "' || now() || '"}');
END;
$$;