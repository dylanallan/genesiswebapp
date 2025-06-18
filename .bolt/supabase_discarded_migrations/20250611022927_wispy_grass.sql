/*
  # Create AI Custom Instructions Table
  
  1. New Tables
    - `ai_custom_instructions` - Stores user-defined custom instructions for AI interactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `instructions` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `ai_custom_instructions` table
    - Add policy for users to manage their own instructions
*/

-- Create AI Custom Instructions table
CREATE TABLE IF NOT EXISTS public.ai_custom_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_custom_instructions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own instructions
CREATE POLICY "Users can manage their own custom instructions"
  ON public.ai_custom_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_ai_custom_instructions_updated_at
  BEFORE UPDATE ON public.ai_custom_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on user_id and is_active for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_custom_instructions_user_active ON public.ai_custom_instructions(user_id, is_active);