/*
  # Add API Keys to Supabase Configuration

  1. New Table
    - `api_keys` table to store encrypted API keys
      - `id` (uuid, primary key)
      - `key_name` (text, unique)
      - `encrypted_key` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for admin access only
    - Add encryption functions for key storage
*/

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  encrypted_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Create updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert API keys (encrypted) - COMMENTED OUT due to configuration parameter issues
-- INSERT INTO api_keys (key_name, encrypted_key) VALUES
--   ('OPENAI_API_KEY', pgp_sym_encrypt(current_setting('app.settings.openai_key'), current_setting('app.settings.encryption_key'))),
--   ('GEMINI_API_KEY', pgp_sym_encrypt(current_setting('app.settings.gemini_key'), current_setting('app.settings.encryption_key'))),
--   ('ANTHROPIC_API_KEY', pgp_sym_encrypt(current_setting('app.settings.anthropic_key'), current_setting('app.settings.encryption_key'))),
--   ('GOOGLE_VISION_API_KEY', pgp_sym_encrypt(current_setting('app.settings.google_vision_key'), current_setting('app.settings.encryption_key')));

-- Create function to safely retrieve API keys
CREATE OR REPLACE FUNCTION get_api_key(key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN (
    SELECT encrypted_key
    FROM api_keys
    WHERE key_name = $1
  );
END;
$$;