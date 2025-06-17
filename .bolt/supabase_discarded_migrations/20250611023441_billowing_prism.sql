/*
  # AI Custom Instructions Helper Functions
  
  1. New Functions
    - `get_user_custom_instructions` - Retrieves active custom instructions for a user
    - `update_user_custom_instructions` - Updates or creates custom instructions for a user
    - `toggle_custom_instructions` - Enables or disables custom instructions
  
  2. Security
    - All functions are secured with `SECURITY DEFINER`
    - Proper permission checks ensure users can only access their own data
*/

-- Function to get a user's active custom instructions
CREATE OR REPLACE FUNCTION get_user_custom_instructions(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instructions TEXT;
BEGIN
  -- Check if the user is trying to access their own data
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only access your own custom instructions';
  END IF;

  -- Get the active instructions
  SELECT instructions INTO v_instructions
  FROM ai_custom_instructions
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN v_instructions;
END;
$$;

-- Function to update or create custom instructions
CREATE OR REPLACE FUNCTION update_user_custom_instructions(
  p_instructions TEXT,
  p_is_active BOOLEAN DEFAULT true,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instruction_id UUID;
BEGIN
  -- Check if the user is trying to modify their own data
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only update your own custom instructions';
  END IF;

  -- First, deactivate all existing instructions for this user
  IF p_is_active THEN
    UPDATE ai_custom_instructions
    SET is_active = false
    WHERE user_id = p_user_id AND is_active = true;
  END IF;

  -- Check if there's an existing record to update
  SELECT id INTO v_instruction_id
  FROM ai_custom_instructions
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Update existing or insert new
  IF v_instruction_id IS NOT NULL THEN
    UPDATE ai_custom_instructions
    SET 
      instructions = p_instructions,
      is_active = p_is_active,
      updated_at = now()
    WHERE id = v_instruction_id
    RETURNING id INTO v_instruction_id;
  ELSE
    INSERT INTO ai_custom_instructions (
      user_id,
      instructions,
      is_active
    ) VALUES (
      p_user_id,
      p_instructions,
      p_is_active
    )
    RETURNING id INTO v_instruction_id;
  END IF;

  RETURN v_instruction_id;
END;
$$;

-- Function to toggle custom instructions on/off
CREATE OR REPLACE FUNCTION toggle_custom_instructions(
  p_is_active BOOLEAN,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_success BOOLEAN := false;
BEGIN
  -- Check if the user is trying to modify their own data
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only toggle your own custom instructions';
  END IF;

  -- Update all instructions for this user
  UPDATE ai_custom_instructions
  SET is_active = p_is_active, updated_at = now()
  WHERE user_id = p_user_id;

  v_success := true;
  RETURN v_success;
END;
$$;