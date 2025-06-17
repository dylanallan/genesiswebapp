/*
  # API Keys Management System

  1. New Tables
    - `api_keys` - Securely stores encrypted API keys for various services
      - `id` (uuid, primary key)
      - `key_name` (text, unique)
      - `encrypted_key` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for admin access
    - Create secure function for retrieving decrypted keys
*/

-- Check if api_keys table exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys') THEN
    -- Create API keys table
    CREATE TABLE public.api_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key_name text UNIQUE NOT NULL,
      encrypted_key text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

    -- Create policy for admin access (with IF NOT EXISTS)
    CREATE POLICY "Admins can manage API keys"
      ON public.api_keys
      FOR ALL
      TO authenticated
      USING ((auth.jwt() ->> 'role')::text = 'admin');

    -- Create updated_at trigger
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON public.api_keys
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Create function to safely retrieve API keys (replace if exists)
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
    SELECT pgp_sym_decrypt(
      encrypted_key::bytea,
      current_setting('app.settings.encryption_key')
    )::text
    FROM api_keys
    WHERE key_name = $1
  );
END;
$$;