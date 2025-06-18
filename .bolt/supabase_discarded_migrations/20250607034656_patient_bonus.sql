-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test user with specified credentials (idempotent)
DO $$
DECLARE
  v_user_id uuid;
  v_existing_user_id uuid;
  v_user_exists boolean := false;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = 'dylltoamill@gmail.com';

  IF v_existing_user_id IS NOT NULL THEN
    v_user_exists := true;
    v_user_id := v_existing_user_id;
    RAISE NOTICE 'User with email dylltoamill@gmail.com already exists with ID: %', v_user_id;
  ELSE
    -- Generate new user ID
    v_user_id := gen_random_uuid();
    
    -- Insert new user into auth.users table
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'dylltoamill@gmail.com',
      crypt('Latino@1992', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{
        "name": "Dylan Allan",
        "cultural_background": "Latino",
        "business_focus": "automation_consulting"
      }'::jsonb,
      now(),
      now(),
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Created new user with email dylltoamill@gmail.com and ID: %', v_user_id;
  END IF;

  -- Add or update user preferences (upsert)
  INSERT INTO public.user_data (
    user_id,
    preferences,
    settings,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '{
      "theme": "light",
      "notifications": true,
      "language": "en",
      "cultural_context": "Latino",
      "business_preferences": {
        "focus_areas": ["automation", "consulting", "workflow_optimization"],
        "preferred_communication": "email"
      }
    }'::jsonb,
    '{
      "timezone": "UTC",
      "dateFormat": "MM/DD/YYYY",
      "business_hours": "9AM-5PM",
      "consultation_availability": true
    }'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferences = EXCLUDED.preferences,
    settings = EXCLUDED.settings,
    updated_at = now();

  -- Add or update user security metadata (upsert)
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
    0.85, -- High security score for business consultant
    now(),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_security_check = now(),
    security_score = GREATEST(EXCLUDED.security_score, user_security_metadata.security_score),
    updated_at = now();

  -- Log the creation or update (avoid duplicates)
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
    CASE 
      WHEN v_user_exists THEN 'account_updated'
      ELSE 'account_created'
    END,
    jsonb_build_object(
      'method', 'migration',
      'timestamp', now(),
      'email', 'dylltoamill@gmail.com',
      'user_type', 'business_consultant',
      'action', CASE WHEN v_user_exists THEN 'updated_existing' ELSE 'created_new' END
    ),
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_activity_log 
    WHERE user_id = v_user_id 
    AND activity_type IN ('account_created', 'account_updated')
    AND (metadata->>'method') = 'migration'
  );

  -- Add sample business contact (Dylan's business network)
  INSERT INTO public.family_contacts (
    id,
    user_id,
    name,
    relationship,
    contact_info,
    location,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Maria Gonzalez',
    'Business Partner',
    '{
      "email": "maria.gonzalez@dylanallan.io",
      "phone": "+1-555-0123",
      "linkedin": "linkedin.com/in/mariagonzalez",
      "company": "DylanAllan.io"
    }'::jsonb,
    'Austin, Texas',
    'Co-founder and automation specialist at DylanAllan.io. Expert in Latino business culture integration.',
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Add sample business automation recipe/template
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
    'Business Automation Workflow Template',
    'DylanAllan.io Methodology',
    'This template represents the fusion of traditional Latino business values with modern automation techniques, emphasizing relationship-building and community-focused growth.',
    '[
      {"name": "Client Discovery Process", "amount": "1 comprehensive session", "cultural_note": "Built on Latino values of personal connection and trust"},
      {"name": "Workflow Analysis", "amount": "2-3 mapping sessions", "cultural_note": "Incorporates family business traditions and hierarchy respect"},
      {"name": "Automation Implementation", "amount": "Phased approach", "cultural_note": "Gradual adoption respecting traditional methods"},
      {"name": "Community Integration", "amount": "Ongoing support", "cultural_note": "Emphasis on collective success and mutual support"}
    ]'::jsonb,
    [
      "Begin with relationship building and trust establishment",
      "Conduct thorough discovery of current business processes",
      "Map workflows with cultural sensitivity and respect for traditions",
      "Design automation that enhances rather than replaces human connections",
      "Implement in phases with continuous feedback and adjustment",
      "Provide ongoing support and community building",
      "Measure success through both efficiency and relationship metrics"
    ],
    120, -- 2 hours prep
    480, -- 8 hours implementation
    1, -- One business at a time
    'Medium',
    'This business automation methodology was developed by Dylan Allan, combining his expertise in workflow optimization with deep respect for Latino business culture. The approach emphasizes that automation should strengthen community bonds and cultural values, not replace them. Each implementation is customized to honor the unique cultural context of the business while achieving maximum efficiency.',
    ['business', 'automation', 'latino', 'consulting', 'workflow', 'cultural-integration'],
    5,
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

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
    '{
      "browser": "Migration Setup",
      "os": "Server",
      "device_type": "system"
    }'::jsonb,
    '127.0.0.1',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Successfully set up user profile for dylltoamill@gmail.com';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Security Score: 0.85';
  RAISE NOTICE 'Business Focus: Automation Consulting';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred during user setup: %', SQLERRM;
    RAISE NOTICE 'Continuing with migration...';
END;
$$;