/*
  # Initial Schema Setup

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `system_settings` - Global system configuration
    - `audit_logs` - System-wide audit logging
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up audit logging triggers
*/

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  ancestry text,
  business_goals text,
  cultural_background text,
  location text,
  timezone text,
  language text DEFAULT 'en',
  onboarding_completed boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table for system-wide auditing
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- User profiles: users can read/write their own profiles
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- System settings: public settings are readable by all, only admins can modify
CREATE POLICY "Anyone can read public system settings" 
  ON system_settings FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Admins can read all system settings" 
  ON system_settings FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Only admins can modify system settings" 
  ON system_settings FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Audit logs: only admins can read, system can write
CREATE POLICY "Only admins can read audit logs" 
  ON audit_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid()
  ));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit log function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data jsonb := null;
  new_data jsonb := null;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    old_data = to_jsonb(OLD);
  ELSIF (TG_OP = 'INSERT') THEN
    new_data = to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN old_data->>'id'
      ELSE new_data->>'id'
    END,
    old_data,
    new_data,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize system settings with defaults
INSERT INTO system_settings (key, value, description, is_public)
VALUES 
  ('app_name', '"Genesis Heritage"', 'Application name', true),
  ('app_version', '"1.0.0"', 'Application version', true),
  ('maintenance_mode', 'false', 'Whether the application is in maintenance mode', true),
  ('ai_providers_enabled', 'true', 'Whether AI providers are enabled', true),
  ('default_user_preferences', '{"theme": "light", "notifications": true}', 'Default user preferences', true);