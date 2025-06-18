/*
  # Database Functions and Views

  1. New Functions
    - User management functions
    - Analytics functions
    - Business automation functions
    - Heritage data functions
  
  2. New Views
    - User activity summary
    - Business metrics dashboard
    - Heritage insights
*/

-- Create function to get user profile with preferences
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'ancestry', p.ancestry,
      'business_goals', p.business_goals,
      'cultural_background', p.cultural_background,
      'location', p.location,
      'timezone', p.timezone,
      'language', p.language,
      'preferences', p.preferences,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'onboarding_completed', p.onboarding_completed
    ) INTO v_result
  FROM 
    auth.users u
    LEFT JOIN user_profiles p ON u.id = p.id
  WHERE 
    u.id = p_user_id;
    
  RETURN v_result;
END;
$$;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  p_display_name text DEFAULT NULL,
  p_ancestry text DEFAULT NULL,
  p_business_goals text DEFAULT NULL,
  p_cultural_background text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_preferences jsonb DEFAULT NULL,
  p_onboarding_completed boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  -- Insert or update user profile
  INSERT INTO user_profiles (
    id,
    display_name,
    ancestry,
    business_goals,
    cultural_background,
    location,
    timezone,
    language,
    preferences,
    onboarding_completed
  )
  VALUES (
    v_user_id,
    COALESCE(p_display_name, ''),
    p_ancestry,
    p_business_goals,
    p_cultural_background,
    p_location,
    p_timezone,
    COALESCE(p_language, 'en'),
    COALESCE(p_preferences, '{}'::jsonb),
    COALESCE(p_onboarding_completed, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(p_display_name, user_profiles.display_name),
    ancestry = COALESCE(p_ancestry, user_profiles.ancestry),
    business_goals = COALESCE(p_business_goals, user_profiles.business_goals),
    cultural_background = COALESCE(p_cultural_background, user_profiles.cultural_background),
    location = COALESCE(p_location, user_profiles.location),
    timezone = COALESCE(p_timezone, user_profiles.timezone),
    language = COALESCE(p_language, user_profiles.language),
    preferences = COALESCE(p_preferences, user_profiles.preferences),
    onboarding_completed = COALESCE(p_onboarding_completed, user_profiles.onboarding_completed),
    updated_at = now();
    
  -- Log the profile update
  PERFORM track_user_activity(
    v_user_id,
    'profile_update',
    'user_profiles',
    jsonb_build_object(
      'display_name_updated', p_display_name IS NOT NULL,
      'ancestry_updated', p_ancestry IS NOT NULL,
      'business_goals_updated', p_business_goals IS NOT NULL,
      'cultural_background_updated', p_cultural_background IS NOT NULL,
      'location_updated', p_location IS NOT NULL,
      'timezone_updated', p_timezone IS NOT NULL,
      'language_updated', p_language IS NOT NULL,
      'preferences_updated', p_preferences IS NOT NULL,
      'onboarding_completed_updated', p_onboarding_completed IS NOT NULL
    )
  );
  
  -- Return the updated profile
  SELECT get_user_profile(v_user_id) INTO v_result;
  RETURN v_result;
END;
$$;

-- Create function to get user heritage data
CREATE OR REPLACE FUNCTION get_user_heritage_data(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'regions', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'connection_strength', uh.connection_strength,
            'notes', uh.notes
          )
        )
        FROM 
          user_heritage uh
          JOIN heritage_regions r ON uh.region_id = r.id
        WHERE 
          uh.user_id = p_user_id
      ),
      'dna_analysis', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', da.id,
            'analysis_type', da.analysis_type,
            'provider', da.provider,
            'ethnicity_breakdown', da.ethnicity_breakdown,
            'analyzed_at', da.analyzed_at
          )
        )
        FROM 
          dna_analysis da
        WHERE 
          da.user_id = p_user_id
      ),
      'family_members', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', fm.id,
            'name', fm.name,
            'birth_date', fm.birth_date,
            'is_living', fm.is_living
          )
        )
        FROM 
          family_members fm
        WHERE 
          fm.user_id = p_user_id
      )
    ) INTO v_result;
    
  RETURN v_result;
END;
$$;

-- Create function to get user business data
CREATE OR REPLACE FUNCTION get_user_business_data(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'workflows', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', w.id,
            'name', w.name,
            'is_active', w.is_active,
            'execution_count', w.execution_count,
            'last_executed', w.last_executed,
            'step_count', (
              SELECT COUNT(*) FROM workflow_steps WHERE workflow_id = w.id
            )
          )
        )
        FROM 
          automation_workflows w
        WHERE 
          w.user_id = p_user_id
      ),
      'integrations', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', bi.id,
            'service_name', bi.service_name,
            'service_type', bi.service_type,
            'is_active', bi.is_active,
            'last_used', bi.last_used
          )
        )
        FROM 
          business_integrations bi
        WHERE 
          bi.user_id = p_user_id
      ),
      'marketing', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', mc.id,
            'name', mc.name,
            'campaign_type', mc.campaign_type,
            'status', mc.status,
            'contact_count', (
              SELECT COUNT(*) FROM marketing_contacts WHERE user_id = p_user_id
            )
          )
        )
        FROM 
          marketing_campaigns mc
        WHERE 
          mc.user_id = p_user_id
      )
    ) INTO v_result;
    
  RETURN v_result;
END;
$$;

-- Create function to execute workflow
CREATE OR REPLACE FUNCTION execute_workflow(p_workflow_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_workflow_exists boolean;
  v_execution_id uuid;
  v_result jsonb;
BEGIN
  -- Check if workflow exists and belongs to user
  SELECT EXISTS (
    SELECT 1 FROM automation_workflows 
    WHERE id = p_workflow_id AND user_id = v_user_id
  ) INTO v_workflow_exists;
  
  IF NOT v_workflow_exists THEN
    RAISE EXCEPTION 'Workflow not found or access denied';
  END IF;
  
  -- Create execution record
  INSERT INTO workflow_executions (
    workflow_id,
    user_id,
    status,
    started_at,
    context
  )
  VALUES (
    p_workflow_id,
    v_user_id,
    'running',
    now(),
    jsonb_build_object('triggered_by', 'user', 'trigger_time', now())
  )
  RETURNING id INTO v_execution_id;
  
  -- Update workflow execution count
  UPDATE automation_workflows
  SET 
    execution_count = execution_count + 1,
    last_executed = now(),
    updated_at = now()
  WHERE id = p_workflow_id;
  
  -- In a real implementation, this would trigger an async process
  -- For now, we'll simulate a successful execution
  UPDATE workflow_executions
  SET 
    status = 'completed',
    completed_at = now(),
    duration_ms = (EXTRACT(EPOCH FROM now()) - EXTRACT(EPOCH FROM started_at)) * 1000,
    result = jsonb_build_object('success', true, 'message', 'Workflow executed successfully')
  WHERE id = v_execution_id;
  
  -- Log the execution
  PERFORM track_user_activity(
    v_user_id,
    'workflow_execution',
    'automation_workflows',
    jsonb_build_object(
      'workflow_id', p_workflow_id,
      'execution_id', v_execution_id,
      'status', 'completed'
    )
  );
  
  -- Return the result
  SELECT 
    jsonb_build_object(
      'execution_id', v_execution_id,
      'status', 'completed',
      'started_at', started_at,
      'completed_at', completed_at,
      'duration_ms', duration_ms,
      'result', result
    ) INTO v_result
  FROM workflow_executions
  WHERE id = v_execution_id;
  
  RETURN v_result;
END;
$$;

-- Create user activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_id,
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_type) AS unique_event_types,
  MIN(created_at) AS first_activity,
  MAX(created_at) AS last_activity,
  COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') AS events_last_30_days,
  jsonb_object_agg(
    event_type, 
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')
  ) AS event_type_counts
FROM
  analytics_events
GROUP BY
  user_id;

-- Create business metrics dashboard view
CREATE OR REPLACE VIEW business_metrics_dashboard AS
SELECT
  user_id,
  COUNT(DISTINCT aw.id) AS workflow_count,
  SUM(aw.execution_count) AS total_workflow_executions,
  COUNT(DISTINCT bi.id) AS integration_count,
  COUNT(DISTINCT mc.id) AS campaign_count,
  COUNT(DISTINCT mk.id) AS contact_count,
  (
    SELECT COUNT(*) 
    FROM workflow_executions we 
    WHERE we.user_id = aw.user_id AND we.status = 'completed'
  ) AS successful_executions,
  (
    SELECT COUNT(*) 
    FROM workflow_executions we 
    WHERE we.user_id = aw.user_id AND we.status = 'failed'
  ) AS failed_executions
FROM
  automation_workflows aw
  LEFT JOIN business_integrations bi ON aw.user_id = bi.user_id
  LEFT JOIN marketing_campaigns mc ON aw.user_id = mc.user_id
  LEFT JOIN marketing_contacts mk ON aw.user_id = mk.user_id
GROUP BY
  aw.user_id;

-- Create heritage insights view
CREATE OR REPLACE VIEW heritage_insights AS
SELECT
  user_id,
  COUNT(DISTINCT uh.region_id) AS connected_regions,
  (
    SELECT jsonb_agg(DISTINCT r.name)
    FROM user_heritage uh2
    JOIN heritage_regions r ON uh2.region_id = r.id
    WHERE uh2.user_id = uh.user_id
  ) AS region_names,
  COUNT(DISTINCT fm.id) AS family_member_count,
  COUNT(DISTINCT fe.id) AS family_event_count,
  COUNT(DISTINCT fd.id) AS document_count,
  EXISTS (
    SELECT 1 FROM dna_analysis da WHERE da.user_id = uh.user_id
  ) AS has_dna_analysis
FROM
  user_heritage uh
  LEFT JOIN family_members fm ON uh.user_id = fm.user_id
  LEFT JOIN family_events fe ON uh.user_id = fe.user_id
  LEFT JOIN family_documents fd ON uh.user_id = fd.user_id
GROUP BY
  uh.user_id;