-- Consolidated Backend Services Migration

-- Create consolidated API endpoints table
CREATE TABLE IF NOT EXISTS api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  method TEXT NOT NULL,
  handler_type TEXT NOT NULL,
  description TEXT,
  rate_limit INTEGER DEFAULT 100,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  CONSTRAINT valid_handler_type CHECK (handler_type IN ('llm', 'workflow', 'edge_function'))
);

-- Create consolidated edge functions table
CREATE TABLE IF NOT EXISTS edge_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL UNIQUE,
  description TEXT,
  runtime TEXT NOT NULL DEFAULT 'nodejs',
  timeout INTEGER DEFAULT 300,
  memory_limit INTEGER DEFAULT 1024,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create consolidated request logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES api_endpoints(id),
  function_id UUID REFERENCES edge_functions(id),
  request_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create consolidated service results tables
CREATE TABLE IF NOT EXISTS service_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  request_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_service_type CHECK (service_type IN (
    'dna_analysis',
    'document_analysis',
    'record_matching',
    'voice_story'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  ))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_path_method ON api_endpoints(path, method);
CREATE INDEX IF NOT EXISTS idx_edge_functions_path ON edge_functions(path);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_function ON request_logs(function_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_user ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_service_results_type ON service_results(service_type);
CREATE INDEX IF NOT EXISTS idx_service_results_user ON service_results(user_id);
CREATE INDEX IF NOT EXISTS idx_service_results_created_at ON service_results(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edge_functions_updated_at
  BEFORE UPDATE ON edge_functions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle API requests
CREATE OR REPLACE FUNCTION handle_api_request(
  p_endpoint_id UUID,
  p_request_id TEXT,
  p_user_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_headers JSONB,
  p_body JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
  v_endpoint_record api_endpoints;
  v_response_body JSONB;
  v_status_code INTEGER;
  v_error_message TEXT;
BEGIN
  -- Get endpoint configuration
  SELECT * INTO v_endpoint_record
  FROM api_endpoints
  WHERE id = p_endpoint_id
  AND is_active = true;

  IF v_endpoint_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive endpoint';
  END IF;

  -- Record start time
  v_start_time := now();

  -- Process request based on handler type
  BEGIN
    CASE v_endpoint_record.handler_type
      WHEN 'llm' THEN
        -- Handle LLM request
        v_response_body := handle_llm_request(
          p_body,
          v_endpoint_record.config
        );
        v_status_code := 200;
      WHEN 'workflow' THEN
        -- Handle workflow request
        v_response_body := handle_workflow_request(
          p_body,
          v_endpoint_record.config
        );
        v_status_code := 200;
      WHEN 'edge_function' THEN
        -- Handle edge function request
        v_response_body := handle_edge_function_request(
          p_body,
          v_endpoint_record.config
        );
        v_status_code := 200;
      ELSE
        RAISE EXCEPTION 'Unsupported handler type: %', v_endpoint_record.handler_type;
    END CASE;
  EXCEPTION WHEN OTHERS THEN
    v_status_code := 500;
    v_error_message := SQLERRM;
    v_response_body := jsonb_build_object(
      'error', v_error_message
    );
  END;

  -- Log the request
  INSERT INTO request_logs (
    endpoint_id,
    request_id,
    user_id,
    method,
    path,
    status_code,
    response_time,
    request_headers,
    request_body,
    response_body,
    error_message,
    metadata
  )
  VALUES (
    p_endpoint_id,
    p_request_id,
    p_user_id,
    p_method,
    p_path,
    v_status_code,
    EXTRACT(EPOCH FROM (now() - v_start_time)) * 1000,
    p_headers,
    p_body,
    v_response_body,
    v_error_message,
    jsonb_build_object(
      'handler_type', v_endpoint_record.handler_type,
      'processing_time', EXTRACT(EPOCH FROM (now() - v_start_time)) * 1000
    )
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Create function to handle service results
CREATE OR REPLACE FUNCTION handle_service_result(
  p_service_type TEXT,
  p_request_id TEXT,
  p_user_id UUID,
  p_input_data JSONB,
  p_output_data JSONB,
  p_processing_time INTEGER,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id UUID;
BEGIN
  INSERT INTO service_results (
    service_type,
    request_id,
    user_id,
    input_data,
    output_data,
    processing_time,
    status,
    error_message,
    metadata
  )
  VALUES (
    p_service_type,
    p_request_id,
    p_user_id,
    p_input_data,
    p_output_data,
    p_processing_time,
    p_status,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$;

-- Enable Row Level Security
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "API endpoints are viewable by authenticated users"
  ON api_endpoints FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "API endpoints are manageable by service role"
  ON api_endpoints FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Edge functions are viewable by authenticated users"
  ON edge_functions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Edge functions are manageable by service role"
  ON edge_functions FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Request logs are viewable by service role"
  ON request_logs FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service results are viewable by owner and service role"
  ON service_results FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service results are manageable by service role"
  ON service_results FOR ALL
  TO service_role
  USING (true);

-- Insert default API endpoints
INSERT INTO api_endpoints (name, path, method, handler_type, description, rate_limit)
VALUES
  ('DNA Analysis', '/api/dna/analyze', 'POST', 'llm', 'Process DNA analysis requests', 50),
  ('Document Analysis', '/api/document/analyze', 'POST', 'llm', 'Process document analysis requests', 50),
  ('Record Matching', '/api/records/match', 'POST', 'llm', 'Process record matching requests', 50),
  ('Voice Story Generation', '/api/stories/generate', 'POST', 'llm', 'Generate voice stories', 20)
ON CONFLICT (path) DO UPDATE
SET
  name = EXCLUDED.name,
  method = EXCLUDED.method,
  handler_type = EXCLUDED.handler_type,
  description = EXCLUDED.description,
  rate_limit = EXCLUDED.rate_limit;

-- Insert default edge functions
INSERT INTO edge_functions (name, path, description, timeout)
VALUES
  ('DNA Analysis Processor', '/dna-analysis-processor', 'Process DNA analysis requests', 300),
  ('Document Analysis Processor', '/document-analysis-processor', 'Process document analysis requests', 300),
  ('Record Matching Processor', '/record-matching-processor', 'Process record matching requests', 300),
  ('Voice Story Generator', '/voice-story-generator', 'Generate voice stories', 600)
ON CONFLICT (path) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  timeout = EXCLUDED.timeout;

-- Create function to verify backend setup
CREATE OR REPLACE FUNCTION verify_backend_setup()
RETURNS TABLE (
  check_name text,
  status text,
  details text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  -- Check API endpoints
  SELECT 
    'API Endpoints' as check_name,
    CASE 
      WHEN COUNT(*) = 4 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' API endpoints' as details
  FROM api_endpoints
  UNION ALL
  -- Check edge functions
  SELECT 
    'Edge Functions' as check_name,
    CASE 
      WHEN COUNT(*) = 4 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' edge functions' as details
  FROM edge_functions
  UNION ALL
  -- Check RLS policies
  SELECT 
    'RLS Policies' as check_name,
    CASE 
      WHEN COUNT(*) = 8 THEN 'OK'
      ELSE 'ERROR'
    END as status,
    'Found ' || COUNT(*) || ' RLS policies' as details
  FROM pg_policies
  WHERE tablename IN (
    'api_endpoints',
    'edge_functions',
    'request_logs',
    'service_results'
  );
END $$; 