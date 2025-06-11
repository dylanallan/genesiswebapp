/*
  # Create AI Custom Instructions Table
  
  1. New Tables
    - `ai_custom_instructions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `instructions` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on `ai_custom_instructions` table
    - Add policy for authenticated users to manage their own instructions
  
  3. Indexes
    - Create index on user_id and is_active for faster queries
*/

-- Create the ai_custom_instructions table
CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own instructions
CREATE POLICY "Users can manage their own instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ai_custom_instructions_user_active
  ON ai_custom_instructions (user_id, is_active);

-- Add trigger for updating the updated_at column
CREATE TRIGGER update_ai_custom_instructions_updated_at
  BEFORE UPDATE ON ai_custom_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();