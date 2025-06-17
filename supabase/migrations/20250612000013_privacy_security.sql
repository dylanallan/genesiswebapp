-- Advanced Privacy and Security Features

-- Create privacy settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_type text NOT NULL,
  setting_value jsonb NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, setting_type)
);

-- Create data access logs
CREATE TABLE IF NOT EXISTS data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  location jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create consent records
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  granted boolean NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL,
  data_type text NOT NULL,
  retention_period interval NOT NULL,
  retention_conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  data_types text[] NOT NULL,
  format text NOT NULL,
  status text DEFAULT 'pending',
  file_url text,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data deletion requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  data_types text[] NOT NULL,
  status text DEFAULT 'pending',
  deletion_reason text,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_details jsonb NOT NULL,
  ip_address inet,
  user_agent text,
  location jsonb,
  severity text DEFAULT 'info',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create two-factor authentication settings
CREATE TABLE IF NOT EXISTS two_factor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL,
  is_enabled boolean DEFAULT false,
  secret_key text,
  backup_codes text[],
  last_used_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to handle data access logging
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log data access
  INSERT INTO data_access_logs (
    user_id,
    access_type,
    resource_type,
    resource_id,
    action,
    ip_address,
    user_agent,
    location,
    metadata
  )
  VALUES (
    auth.uid(),
    TG_ARGV[0],
    TG_ARGV[1],
    NEW.id,
    TG_OP,
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->'location',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to enforce privacy settings
CREATE OR REPLACE FUNCTION enforce_privacy_settings()
RETURNS TRIGGER AS $$
DECLARE
  privacy_setting jsonb;
BEGIN
  -- Get user's privacy settings
  SELECT setting_value INTO privacy_setting
  FROM privacy_settings
  WHERE user_id = NEW.user_id
  AND setting_type = 'data_visibility';

  -- Apply privacy settings
  IF privacy_setting IS NOT NULL THEN
    -- Example: Check if data should be anonymized
    IF privacy_setting->>'anonymize_data' = 'true' THEN
      -- Anonymize sensitive data
      NEW.first_name := 'Anonymous';
      NEW.last_name := 'User';
      NEW.email := 'anonymous@example.com';
    END IF;

    -- Add more privacy checks as needed
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle data retention
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS TRIGGER AS $$
DECLARE
  retention_policy interval;
BEGIN
  -- Get retention policy for data type
  SELECT retention_period INTO retention_policy
  FROM data_retention_policies
  WHERE data_type = TG_ARGV[0]
  AND is_active = true;

  -- If policy exists and data is older than retention period
  IF retention_policy IS NOT NULL AND 
     NEW.created_at < now() - retention_policy THEN
    -- Mark data for deletion
    INSERT INTO data_deletion_requests (
      user_id,
      request_type,
      data_types,
      deletion_reason,
      metadata
    )
    VALUES (
      NEW.user_id,
      'retention_policy',
      ARRAY[TG_ARGV[0]],
      'Data retention policy expired',
      jsonb_build_object(
        'original_id', NEW.id,
        'retention_policy', retention_policy,
        'created_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user ON privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_type ON data_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_type ON data_retention_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_two_factor_settings_user ON two_factor_settings(user_id);

-- Enable Row Level Security
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own privacy settings"
  ON privacy_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own data access logs"
  ON data_access_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consent records"
  ON consent_records FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data export requests"
  ON data_export_requests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data deletion requests"
  ON data_deletion_requests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own 2FA settings"
  ON two_factor_settings FOR ALL
  USING (auth.uid() = user_id);

-- Insert default privacy settings
INSERT INTO privacy_settings (
  user_id,
  setting_type,
  setting_value
)
SELECT
  id,
  'data_visibility',
  '{
    "anonymize_data": false,
    "share_dna_results": true,
    "share_family_tree": true,
    "share_research_notes": false,
    "allow_data_export": true,
    "allow_data_deletion": true,
    "notification_preferences": {
      "email": true,
      "in_app": true,
      "push": false
    }
  }'::jsonb
FROM auth.users;

-- Insert default data retention policies
INSERT INTO data_retention_policies (
  policy_type,
  data_type,
  retention_period,
  retention_conditions
)
VALUES
  (
    'user_data',
    'profile_data',
    interval '5 years',
    '{
      "conditions": [
        "user_active",
        "has_consent"
      ]
    }'::jsonb
  ),
  (
    'research_data',
    'dna_results',
    interval '10 years',
    '{
      "conditions": [
        "has_consent",
        "not_deleted"
      ]
    }'::jsonb
  ),
  (
    'activity_data',
    'access_logs',
    interval '1 year',
    '{
      "conditions": [
        "not_deleted",
        "not_exported"
      ]
    }'::jsonb
  );

-- Insert default consent records
INSERT INTO consent_records (
  user_id,
  consent_type,
  consent_version,
  granted,
  granted_at,
  metadata
)
SELECT
  id,
  'data_processing',
  '1.0',
  true,
  now(),
  '{
    "consent_text": "I agree to the processing of my personal data for genealogy research purposes",
    "consent_date": "2024-01-01",
    "consent_method": "registration"
  }'::jsonb
FROM auth.users; 