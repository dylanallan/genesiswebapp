-- Create exec_sql function for initialization
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create function to check if tables exist
CREATE OR REPLACE FUNCTION check_tables_exist(p_tables text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_table text;
  v_exists boolean;
BEGIN
  FOREACH v_table IN ARRAY p_tables
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = v_table
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Create function to initialize AI services
CREATE OR REPLACE FUNCTION initialize_ai_services()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize AI service configuration
  INSERT INTO ai_service_config (service_name, key_name, encrypted_key, is_active, config)
  VALUES
    ('openai-gpt4-turbo', 'OpenAI GPT-4 Turbo', 'encrypted-key-placeholder', true, '{"temperature": 0.7, "streamingSupported": true}'),
    ('anthropic-claude-3-opus', 'Anthropic Claude 3 Opus', 'encrypted-key-placeholder', true, '{"temperature": 0.7, "streamingSupported": true}'),
    ('google-gemini-15-pro', 'Google Gemini 1.5 Pro', 'encrypted-key-placeholder', true, '{"temperature": 0.7, "streamingSupported": true}'),
    ('dylanallan-business', 'DylanAllan.io Business', 'encrypted-key-placeholder', true, '{"context": "business_automation", "streamingSupported": true}'),
    ('deepseek-coder', 'DeepSeek Coder', 'encrypted-key-placeholder', true, '{"temperature": 0.1, "streamingSupported": true}')
  ON CONFLICT (service_name) 
  DO UPDATE SET
    is_active = EXCLUDED.is_active,
    config = EXCLUDED.config;

  -- Initialize AI models
  INSERT INTO ai_models (name, version, capabilities, context_window, api_endpoint)
  VALUES
    ('gpt-4-turbo', '1.0', ARRAY['chat', 'analysis', 'generation', 'coding', 'business', 'creative', 'technical'], 128000, 'https://api.openai.com/v1/chat/completions'),
    ('claude-3-opus', '1.0', ARRAY['chat', 'analysis', 'generation', 'business', 'cultural', 'creative', 'research'], 200000, 'https://api.anthropic.com/v1/messages'),
    ('gemini-1.5-pro', '1.0', ARRAY['chat', 'analysis', 'generation', 'coding', 'business', 'research'], 1048576, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'),
    ('dylanallan-business', '1.0', ARRAY['business', 'automation', 'consulting', 'strategy', 'workflow'], 8192, 'https://dylanallan.io/api/chat'),
    ('deepseek-coder', '1.0', ARRAY['coding', 'analysis', 'generation', 'technical'], 16384, 'https://api.deepseek.com/v1/chat/completions')
  ON CONFLICT (name, version) 
  DO UPDATE SET
    capabilities = EXCLUDED.capabilities,
    context_window = EXCLUDED.context_window,
    api_endpoint = EXCLUDED.api_endpoint;
    
  RETURN 'AI services initialized successfully';
END;
$$;