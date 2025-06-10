/*
  # Fix Security Alerts Table

  This migration fixes the security_alerts table that was causing errors in previous migrations.
  It checks if the table exists before creating it and ensures constraints are properly defined.
*/

-- Check if security_alerts table exists and create it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'security_alerts'
  ) THEN
    -- Create security_alerts table
    CREATE TABLE security_alerts (
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

    -- Add constraint for anomaly score
    ALTER TABLE security_alerts 
    ADD CONSTRAINT security_alerts_anomaly_score_check 
    CHECK ((anomaly_score >= 0) AND (anomaly_score <= 1));

    -- Enable RLS
    ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

    -- Create policy for admins
    CREATE POLICY "Admins can manage security alerts" 
      ON security_alerts FOR ALL 
      TO authenticated
      USING ((jwt() ->> 'role'::text) = 'admin'::text);
  ELSE
    -- Table exists, check if index exists and create if needed
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'security_alerts' AND indexname = 'idx_unresolved_alerts'
    ) THEN
      CREATE INDEX idx_unresolved_alerts ON security_alerts(resolved, timestamp)
      WHERE NOT resolved;
    END IF;

    -- Check if constraint exists and add if needed
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'security_alerts_anomaly_score_check' AND conrelid = 'security_alerts'::regclass
    ) THEN
      ALTER TABLE security_alerts 
      ADD CONSTRAINT security_alerts_anomaly_score_check 
      CHECK ((anomaly_score >= 0) AND (anomaly_score <= 1));
    END IF;

    -- Check if RLS is enabled
    IF NOT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'security_alerts' AND rowsecurity = true
    ) THEN
      ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Check if policy exists and create if needed
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'security_alerts' AND policyname = 'Admins can manage security alerts'
    ) THEN
      CREATE POLICY "Admins can manage security alerts" 
        ON security_alerts FOR ALL 
        TO authenticated
        USING ((jwt() ->> 'role'::text) = 'admin'::text);
    END IF;
  END IF;
END
$$;