/*
  # API Keys Management System

  1. New Tables
    - `api_keys`: Secure storage for encrypted API keys
      - `id` (uuid, primary key)
      - `key_name` (text, unique)
      - `encrypted_key` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on api_keys table
    - Admin-only access policy
    - Secure key retrieval function

  3. Features
    - Automatic timestamps
    - Encryption for key storage
    - Secure key retrieval function
*/

-- Create extension for encryption if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Create policy for admin access (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_keys' 
    AND policyname = 'Admins can manage API keys'
  ) THEN
    CREATE POLICY "Admins can manage API keys"
      ON api_keys
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');
  END IF;
END $$;

-- Create updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create secure function to add encrypted API keys
CREATE OR REPLACE FUNCTION add_encrypted_api_key(
  p_key_name text,
  p_key_value text,
  p_encryption_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_keys (key_name, encrypted_key)
  VALUES (
    p_key_name,
    encode(
      encrypt(
        p_key_value::bytea,
        p_encryption_key::bytea,
        'aes'
      ),
      'base64'
    )
  );
END;
$$;

-- Create function to safely retrieve API keys
CREATE OR REPLACE FUNCTION get_api_key(
  p_key_name text,
  p_encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decrypted_key text;
BEGIN
  IF NOT (SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT convert_from(
    decrypt(
      decode(encrypted_key, 'base64'),
      p_encryption_key::bytea,
      'aes'
    ),
    'utf8'
  ) INTO v_decrypted_key
  FROM api_keys
  WHERE key_name = p_key_name;

  RETURN v_decrypted_key;
END;
$$;