-- Create tables for backend services
CREATE TABLE IF NOT EXISTS ai_service_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL,
  handler_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  CONSTRAINT valid_handler_type CHECK (handler_type IN ('llm', 'workflow', 'edge_function'))
);

CREATE TABLE IF NOT EXISTS edge_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES api_endpoints(id),
  request_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id UUID REFERENCES edge_functions(id),
  request_id TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dna_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS record_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_request_logs_endpoint_id ON api_request_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_function_id ON edge_function_logs(function_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_created_at ON edge_function_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_results_created_at ON dna_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analysis_results_created_at ON document_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_record_matches_created_at ON record_matches(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_stories_created_at ON voice_stories(created_at);

-- Create functions for service management
CREATE OR REPLACE FUNCTION validate_ai_service_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate service name
  IF NEW.service_name NOT IN ('openai', 'anthropic', 'google') THEN
    RAISE EXCEPTION 'Invalid service name: %', NEW.service_name;
  END IF;

  -- Validate config structure
  IF NOT (
    NEW.config ? 'defaultModel' AND
    NEW.config ? 'maxTokens' AND
    NEW.config ? 'temperature' AND
    NEW.config ? 'availableModels'
  ) THEN
    RAISE EXCEPTION 'Invalid config structure for service: %', NEW.service_name;
  END IF;

  -- Validate that default model is in available models
  IF NOT (
    NEW.config->>'defaultModel' = ANY(
      ARRAY(SELECT jsonb_array_elements_text(NEW.config->'availableModels'))
    )
  ) THEN
    RAISE EXCEPTION 'Default model must be in available models for service: %', NEW.service_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ai_service_config_trigger
  BEFORE INSERT OR UPDATE ON ai_service_config
  FOR EACH ROW
  EXECUTE FUNCTION validate_ai_service_config();

CREATE OR REPLACE FUNCTION get_active_ai_services()
RETURNS TABLE (
  service_name TEXT,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai.service_name,
    ai.config
  FROM ai_service_config ai
  WHERE ai.is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_ai_service_usage(
  p_service_name TEXT,
  p_model TEXT,
  p_tokens_used INTEGER,
  p_processing_time INTEGER,
  p_success BOOLEAN,
  p_error_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_request_logs (
    endpoint_id,
    request_id,
    method,
    path,
    status_code,
    response_time,
    error_message,
    metadata
  )
  SELECT
    e.id,
    gen_random_uuid()::TEXT,
    'POST',
    '/ai/process',
    CASE WHEN p_success THEN 200 ELSE 500 END,
    p_processing_time,
    CASE WHEN NOT p_success THEN p_error_details->>'message' END,
    jsonb_build_object(
      'service', p_service_name,
      'model', p_model,
      'tokens_used', p_tokens_used,
      'error_details', p_error_details
    )
  FROM api_endpoints e
  WHERE e.path = '/ai/process'
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_stories ENABLE ROW LEVEL SECURITY;

-- Service configuration policies
CREATE POLICY "Service config is viewable by authenticated users"
  ON ai_service_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service config is manageable by service role"
  ON ai_service_config FOR ALL
  TO service_role
  USING (true);

-- API endpoint policies
CREATE POLICY "API endpoints are viewable by authenticated users"
  ON api_endpoints FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "API endpoints are manageable by service role"
  ON api_endpoints FOR ALL
  TO service_role
  USING (true);

-- Edge function policies
CREATE POLICY "Edge functions are viewable by authenticated users"
  ON edge_functions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Edge functions are manageable by service role"
  ON edge_functions FOR ALL
  TO service_role
  USING (true);

-- Log policies
CREATE POLICY "Logs are viewable by service role"
  ON api_request_logs FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Logs are insertable by service role"
  ON api_request_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Edge function logs are viewable by service role"
  ON edge_function_logs FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Edge function logs are insertable by service role"
  ON edge_function_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Result policies
CREATE POLICY "Results are viewable by authenticated users"
  ON dna_analysis_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Results are insertable by service role"
  ON dna_analysis_results FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Document analysis results are viewable by authenticated users"
  ON document_analysis_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Document analysis results are insertable by service role"
  ON document_analysis_results FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Record matches are viewable by authenticated users"
  ON record_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Record matches are insertable by service role"
  ON record_matches FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Voice stories are viewable by authenticated users"
  ON voice_stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Voice stories are insertable by service role"
  ON voice_stories FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Insert default API endpoints
INSERT INTO api_endpoints (name, path, method, handler_type, config)
VALUES
  ('DNA Analysis', '/api/dna/analyze', 'POST', 'llm', '{"rate_limit": 50}'),
  ('Document Analysis', '/api/document/analyze', 'POST', 'llm', '{"rate_limit": 50}'),
  ('Record Matching', '/api/records/match', 'POST', 'llm', '{"rate_limit": 50}'),
  ('Voice Story Generation', '/api/stories/generate', 'POST', 'llm', '{"rate_limit": 20}')
ON CONFLICT (path) DO UPDATE
SET
  name = EXCLUDED.name,
  method = EXCLUDED.method,
  handler_type = EXCLUDED.handler_type,
  config = EXCLUDED.config;

-- Insert default edge functions
INSERT INTO edge_functions (name, path, config)
VALUES
  ('DNA Analysis Processor', '/dna-analysis-processor', '{"timeout": 300}'),
  ('Document Analysis Processor', '/document-analysis-processor', '{"timeout": 300}'),
  ('Record Matching Processor', '/record-matching-processor', '{"timeout": 300}'),
  ('Voice Story Generator', '/voice-story-generator', '{"timeout": 600}')
ON CONFLICT (path) DO UPDATE
SET
  name = EXCLUDED.name,
  config = EXCLUDED.config; 