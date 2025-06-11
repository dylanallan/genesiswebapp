/*
  # Create AI Custom Instructions Table

  1. New Tables
    - `ai_custom_instructions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `instructions` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_custom_instructions` table
    - Add policy for users to manage their own custom instructions

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on is_active for filtering active instructions
*/

CREATE TABLE IF NOT EXISTS ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_custom_instructions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own custom instructions
CREATE POLICY "Users can manage their own AI custom instructions"
  ON ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_user_id 
  ON ai_custom_instructions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_active 
  ON ai_custom_instructions(is_active) 
  WHERE is_active = true;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_ai_custom_instructions_updated_at
  BEFORE UPDATE ON ai_custom_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();