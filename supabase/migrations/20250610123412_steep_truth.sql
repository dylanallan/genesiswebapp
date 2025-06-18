/*
  # Create user_data table

  1. New Tables
    - `user_data` - Stores user preferences and settings
      - `user_id` (uuid, primary key)
      - `preferences` (jsonb)
      - `settings` (jsonb)
      - `last_login` (timestamptz)
      - `login_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `user_data` table
    - Add policy for users to manage their own data
*/

-- Create user_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz DEFAULT now(),
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'user_data' AND policyname = 'Users can manage their own data'
  ) THEN
    CREATE POLICY "Users can manage their own data"
      ON user_data
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_data table
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();