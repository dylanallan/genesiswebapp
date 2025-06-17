-- RPC STUBS FOR GENESIS WEB APP - FIXED VERSION
-- Drops existing functions first to avoid return type conflicts

-- User Profile Functions
DROP FUNCTION IF EXISTS get_user_profile(UUID);
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'user_id', um.user_id,
      'role', um.role,
      'profile_data', um.profile_data,
      'preferences', um.preferences
    )
    FROM user_metadata um
    WHERE um.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_profile_batch(UUID, JSONB);
CREATE OR REPLACE FUNCTION update_user_profile_batch(user_uuid UUID, profile_updates JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_metadata 
  SET 
    profile_data = COALESCE(profile_updates->'profile_data', profile_data),
    preferences = COALESCE(profile_updates->'preferences', preferences),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_user_profile_history(UUID);
CREATE OR REPLACE FUNCTION get_user_profile_history(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  -- Stub: Return empty array for now
  RETURN '[]'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AI Conversation Functions
DROP FUNCTION IF EXISTS get_conversation_context(UUID, UUID);
CREATE OR REPLACE FUNCTION get_conversation_context(user_uuid UUID, conversation_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ach.id,
        'message', ach.message,
        'role', ach.role,
        'created_at', ach.created_at
      )
    )
    FROM ai_conversation_history ach
    WHERE ach.user_id = user_uuid
    AND (conversation_id IS NULL OR ach.conversation_id = conversation_id)
    ORDER BY ach.created_at DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS track_ai_usage(UUID, INTEGER);
CREATE OR REPLACE FUNCTION track_ai_usage(user_uuid UUID, tokens_used INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO ai_usage_quotas (user_id, tokens_used, period_start, period_end)
  VALUES (user_uuid, tokens_used, NOW(), NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id) 
  DO UPDATE SET tokens_used = ai_usage_quotas.tokens_used + EXCLUDED.tokens_used;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS analyze_conversation(UUID, UUID);
CREATE OR REPLACE FUNCTION analyze_conversation(user_uuid UUID, conversation_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Stub: Return basic analysis
  RETURN jsonb_build_object(
    'message_count', 0,
    'sentiment', 'neutral',
    'topics', '[]'::JSONB
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database Performance Functions
DROP FUNCTION IF EXISTS get_database_performance();
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'active_connections', 0,
    'cache_hit_ratio', 0.95,
    'slow_queries', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS create_analytics_optimizations();
CREATE OR REPLACE FUNCTION create_analytics_optimizations()
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub: Log optimization attempt
  INSERT INTO system_optimization_logs (log_type, details)
  VALUES ('analytics_optimization', '{"status": "completed"}'::JSONB);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS optimize_database_performance();
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub: Log optimization attempt
  INSERT INTO system_optimization_logs (log_type, details)
  VALUES ('database_optimization', '{"status": "completed"}'::JSONB);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automation Functions
DROP FUNCTION IF EXISTS process_automation_rules(UUID);
CREATE OR REPLACE FUNCTION process_automation_rules(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  -- Stub: Return empty results
  RETURN '[]'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_journey_stage(UUID, TEXT);
CREATE OR REPLACE FUNCTION update_journey_stage(user_uuid UUID, new_stage TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub: Log stage update
  INSERT INTO user_activity_log (user_id, activity_type, details)
  VALUES (user_uuid, 'journey_stage_update', jsonb_build_object('stage', new_stage));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Custom Instructions Functions
DROP FUNCTION IF EXISTS get_user_custom_instructions(UUID);
CREATE OR REPLACE FUNCTION get_user_custom_instructions(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'instructions', aci.instructions,
      'is_active', aci.is_active
    )
    FROM ai_custom_instructions aci
    WHERE aci.user_id = user_uuid AND aci.is_active = TRUE
    ORDER BY aci.created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_custom_instructions(UUID, TEXT);
CREATE OR REPLACE FUNCTION update_user_custom_instructions(user_uuid UUID, instructions TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO ai_custom_instructions (user_id, instructions)
  VALUES (user_uuid, instructions)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS toggle_custom_instructions(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION toggle_custom_instructions(user_uuid UUID, is_active BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE ai_custom_instructions 
  SET is_active = is_active, updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search Functions
DROP FUNCTION IF EXISTS find_similar_messages(UUID, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION find_similar_messages(user_uuid UUID, message TEXT, limit_count INTEGER DEFAULT 5)
RETURNS JSONB AS $$
BEGIN
  -- Stub: Return empty results
  RETURN '[]'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS find_similar_content(UUID, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION find_similar_content(user_uuid UUID, content TEXT, limit_count INTEGER DEFAULT 5)
RETURNS JSONB AS $$
BEGIN
  -- Stub: Return empty results
  RETURN '[]'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Database Stats Functions
DROP FUNCTION IF EXISTS get_database_stats();
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM user_metadata),
    'total_conversations', (SELECT COUNT(DISTINCT conversation_id) FROM ai_conversation_history),
    'total_voice_generations', (SELECT COUNT(*) FROM voice_generations),
    'total_dna_analyses', (SELECT COUNT(*) FROM dna_analysis_results)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AI Request Logging
DROP FUNCTION IF EXISTS log_ai_request(UUID, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION log_ai_request(user_uuid UUID, provider TEXT, tokens_used INTEGER, response_time_ms INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO system_performance_logs (operation_name, execution_time_ms, success, metadata)
  VALUES (
    'ai_request_' || provider,
    response_time_ms,
    TRUE,
    jsonb_build_object('user_id', user_uuid, 'tokens_used', tokens_used)
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_ai_provider_metrics();
CREATE OR REPLACE FUNCTION get_ai_provider_metrics()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'openai', jsonb_build_object('requests', 0, 'avg_response_time', 0),
      'anthropic', jsonb_build_object('requests', 0, 'avg_response_time', 0),
      'google', jsonb_build_object('requests', 0, 'avg_response_time', 0)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- System Functions
DROP FUNCTION IF EXISTS create_system_alert(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION create_system_alert(alert_type TEXT, message TEXT, severity TEXT DEFAULT 'info')
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO system_health_metrics (metric_name, metric_value)
  VALUES (
    'system_alert',
    jsonb_build_object(
      'type', alert_type,
      'message', message,
      'severity', severity,
      'timestamp', NOW()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS log_system_performance(TEXT, INTEGER, BOOLEAN, JSONB);
CREATE OR REPLACE FUNCTION log_system_performance(operation_name TEXT, execution_time_ms INTEGER, success BOOLEAN, metadata JSONB DEFAULT '{}')
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO system_performance_logs (operation_name, execution_time_ms, success, metadata)
  VALUES (operation_name, execution_time_ms, success, metadata);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS analyze_system_health();
CREATE OR REPLACE FUNCTION analyze_system_health()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'status', 'healthy',
    'last_check', NOW(),
    'metrics', jsonb_build_object(
      'active_users', 0,
      'system_load', 0.5,
      'error_rate', 0.01
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS enable_emergency_security_measures();
CREATE OR REPLACE FUNCTION enable_emergency_security_measures()
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO system_health_metrics (metric_name, metric_value)
  VALUES (
    'emergency_security',
    jsonb_build_object(
      'enabled', TRUE,
      'timestamp', NOW(),
      'reason', 'manual_activation'
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_security_scores(UUID, INTEGER);
CREATE OR REPLACE FUNCTION update_security_scores(user_uuid UUID, score_change INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub: Log security score update
  INSERT INTO user_activity_log (user_id, activity_type, details)
  VALUES (user_uuid, 'security_score_update', jsonb_build_object('score_change', score_change));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS calculate_security_score(UUID);
CREATE OR REPLACE FUNCTION calculate_security_score(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Stub: Return default security score
  RETURN 85;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API Key Management Functions
DROP FUNCTION IF EXISTS add_encrypted_api_key(TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION add_encrypted_api_key(provider TEXT, encrypted_key TEXT, config JSONB DEFAULT '{}')
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO ai_service_config (provider, api_key, config, created_by)
  VALUES (provider::ai_provider, encrypted_key, config, auth.uid())
  ON CONFLICT (provider) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    config = EXCLUDED.config;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_api_key(TEXT);
CREATE OR REPLACE FUNCTION get_api_key(provider TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT api_key 
    FROM ai_service_config 
    WHERE ai_service_config.provider = provider::ai_provider
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 