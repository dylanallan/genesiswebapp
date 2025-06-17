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

-- Initialize system health metrics
INSERT INTO system_health_metrics (metric_name, metric_value, metadata)
VALUES
  ('system_health', 0.95, '{"components": {"ai_router": 0.95, "database": 0.98, "authentication": 0.97, "ui": 0.94}}'),
  ('cpu_usage', 15.3, '{"cores": 4, "processes": 12}'),
  ('memory_usage', 42.7, '{"total": 16384, "used": 6998}'),
  ('error_rate', 0.02, '{"total_requests": 1000, "errors": 20}'),
  ('response_time', 187.5, '{"p50": 120, "p95": 350, "p99": 750}')
ON CONFLICT DO NOTHING;

-- Initialize knowledge sources
INSERT INTO knowledge_sources (name, type, url, reliability)
VALUES
  ('Cultural Heritage Database', 'database', 'https://heritage-db.example.com', 0.95),
  ('Business Automation API', 'api', 'https://automation-api.example.com', 0.92),
  ('Historical Records Archive', 'document', 'https://historical-records.example.com', 0.88),
  ('Market Trends Analysis', 'api', 'https://market-trends.example.com', 0.85)
ON CONFLICT DO NOTHING;