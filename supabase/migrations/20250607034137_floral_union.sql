/*
  # Create Test User with Conflict Handling

  1. User Creation
    - Creates test user with email 'Latino@1992'
    - Handles conflicts gracefully with UPSERT operations
    - Ensures idempotent migration execution

  2. User Data Setup
    - Creates user preferences and settings
    - Initializes user activity log
    - Uses conflict resolution to prevent duplicates

  3. Security
    - Proper password encryption
    - Email confirmation setup
    - Complete auth metadata
*/

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test user with conflict handling
DO $$
DECLARE
  v_user_id uuid;
  v_existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = 'Latino@1992';

  IF v_existing_user_id IS NOT NULL THEN
    -- User already exists, use existing ID
    v_user_id := v_existing_user_id;
    RAISE NOTICE 'Test user already exists with ID: %', v_user_id;
  ELSE
    -- Create new user
    v_user_id := gen_random_uuid();
    
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change,
      aud,
      role
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'Latino@1992',
      crypt('Latino@1992', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Test User", "cultural_background": "Latino"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    );
    
    RAISE NOTICE 'Created new test user with ID: %', v_user_id;
  END IF;

  -- Upsert user preferences (handles conflicts)
  INSERT INTO public.user_data (
    user_id,
    preferences,
    settings,
    last_login,
    login_count,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '{
      "theme": "light",
      "notifications": true,
      "language": "en",
      "culturalContext": "Latino"
    }'::jsonb,
    '{
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY",
      "currency": "USD"
    }'::jsonb,
    now(),
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferences = EXCLUDED.preferences,
    settings = EXCLUDED.settings,
    updated_at = now();

  -- Create user security metadata if it doesn't exist
  INSERT INTO public.user_security_metadata (
    user_id,
    last_security_check,
    security_score,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    now(),
    0.8,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    last_security_check = now(),
    updated_at = now();

  -- Log the creation/update (only if new activity)
  INSERT INTO public.user_activity_log (
    id,
    user_id,
    activity_type,
    metadata,
    created_at
  )
  SELECT 
    gen_random_uuid(),
    v_user_id,
    'account_setup',
    jsonb_build_object(
      'method', 'migration',
      'timestamp', now(),
      'action', CASE 
        WHEN v_existing_user_id IS NULL THEN 'created'
        ELSE 'updated'
      END
    ),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_activity_log 
    WHERE user_id = v_user_id 
    AND activity_type = 'account_setup'
  );

  -- Create initial user session
  INSERT INTO public.user_sessions (
    id,
    user_id,
    device_info,
    ip_address,
    last_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    '{"browser": "Migration Script", "platform": "Server"}'::jsonb,
    '127.0.0.1',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Verify user creation/update
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE NOTICE 'Test user setup completed successfully for: Latino@1992';
  ELSE
    RAISE EXCEPTION 'Failed to setup test user';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during test user setup: %', SQLERRM;
    RAISE NOTICE 'Continuing with migration...';
END;
$$;

-- Create sample family data for testing
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the test user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'Latino@1992';

  IF v_user_id IS NOT NULL THEN
    -- Create sample family contact
    INSERT INTO public.family_contacts (
      id,
      user_id,
      name,
      relationship,
      contact_info,
      birth_date,
      location,
      notes,
      related_names,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Maria Elena Rodriguez',
      'Grandmother',
      '{"phone": "+1-555-0123", "email": "maria@example.com"}'::jsonb,
      '1945-03-15',
      'Mexico City, Mexico',
      'Family matriarch, keeper of traditions',
      ARRAY['Maria', 'Elena', 'Rodriguez'],
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;

    -- Create sample cultural recipe
    INSERT INTO public.cultural_recipes (
      id,
      user_id,
      name,
      origin,
      cultural_significance,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      servings,
      difficulty,
      story,
      tags,
      rating,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'Abuela''s Mole Poblano',
      'Puebla, Mexico',
      'Traditional recipe passed down through generations, prepared for special celebrations',
      '[
        {"name": "Dried chiles", "amount": "6 pieces", "notes": "Ancho, mulato, and pasilla"},
        {"name": "Chocolate", "amount": "2 oz", "notes": "Mexican chocolate preferred"},
        {"name": "Chicken", "amount": "1 whole", "notes": "Free-range if possible"}
      ]'::jsonb,
      ARRAY[
        'Toast the chiles in a dry pan until fragrant',
        'Soak chiles in hot water for 30 minutes',
        'Blend chiles with spices and chocolate',
        'Simmer sauce for 2 hours, stirring frequently'
      ],
      60,
      180,
      8,
      'Hard',
      'This recipe was taught to me by my grandmother during Day of the Dead preparations. She would say that the secret ingredient was patience and love for family.',
      ARRAY['traditional', 'celebration', 'family recipe', 'Day of the Dead'],
      5,
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sample family data created for test user';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sample data: %', SQLERRM;
END;
$$;