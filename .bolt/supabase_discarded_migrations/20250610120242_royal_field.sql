/*
  # Analytics and Security Schema

  1. New Tables
    - `analytics_events` - User activity and system events
    - `analytics_metrics` - Aggregated metrics and KPIs
    - `security_alerts` - Security-related alerts and issues
    - `security_settings` - User and system security settings
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_source text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_metrics table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  dimension text,
  dimension_value text,
  time_period text,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create security_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled boolean DEFAULT false,
  login_notifications boolean DEFAULT true,
  allowed_ip_ranges text[],
  failed_login_attempts integer DEFAULT 0,
  last_password_change timestamptz,
  password_expiry_days integer DEFAULT 90,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Analytics events: users can view their own, admins can view all
CREATE POLICY "Users can view their own analytics events" 
  ON analytics_events FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics events" 
  ON analytics_events FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Analytics metrics: admins can view all
CREATE POLICY "Admins can view all analytics metrics" 
  ON analytics_metrics FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Security alerts: admins can view and manage
CREATE POLICY "Admins can view and manage security alerts" 
  ON security_alerts FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Security settings: users can view and manage their own
CREATE POLICY "Users can view their own security settings" 
  ON security_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own security settings" 
  ON security_settings FOR ALL 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON security_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_security_alerts_changes
  AFTER INSERT OR UPDATE OR DELETE ON security_alerts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_security_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON security_settings
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_metric_name ON analytics_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_dimension ON analytics_metrics(dimension, dimension_value);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_alert_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_is_resolved ON security_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);

-- Create function to track user activity
CREATE OR REPLACE FUNCTION track_user_activity(
  p_user_id uuid,
  p_event_type text,
  p_event_source text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_source,
    event_data,
    session_id,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_event_type,
    p_event_source,
    p_event_data,
    current_setting('request.headers', true)::json->>'x-session-id',
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Create function to log security alert
CREATE OR REPLACE FUNCTION log_security_alert(
  p_alert_type text,
  p_severity text,
  p_user_id uuid,
  p_description text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id uuid;
BEGIN
  INSERT INTO security_alerts (
    alert_type,
    severity,
    user_id,
    description,
    details
  )
  VALUES (
    p_alert_type,
    p_severity,
    p_user_id,
    p_description,
    p_details
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;