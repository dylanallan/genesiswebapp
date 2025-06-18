-- Backend API and Edge Function Integration

-- Create API endpoints table
CREATE TABLE IF NOT EXISTS api_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  method text NOT NULL,
  description text,
  handler_type text NOT NULL,
  handler_config jsonb NOT NULL,
  rate_limits jsonb,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(path, method)
);

-- Create Edge Functions table
CREATE TABLE IF NOT EXISTS edge_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  function_name text NOT NULL,
  description text,
  runtime text NOT NULL,
  handler_code text NOT NULL,
  environment_variables jsonb,
  secrets jsonb,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(function_name)
);

-- Create API request logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_method text NOT NULL,
  request_path text NOT NULL,
  request_headers jsonb,
  request_body jsonb,
  response_status integer,
  response_body jsonb,
  processing_time interval,
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create Edge Function logs
CREATE TABLE IF NOT EXISTS edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_id uuid REFERENCES edge_functions(id) ON DELETE CASCADE,
  execution_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  error_details jsonb,
  execution_time interval,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create function to handle API requests
CREATE OR REPLACE FUNCTION handle_api_request()
RETURNS TRIGGER AS $$
DECLARE
  endpoint_record api_endpoints;
  processing_start timestamptz;
  response_data jsonb;
BEGIN
  -- Get endpoint configuration
  SELECT * INTO endpoint_record
  FROM api_endpoints
  WHERE id = NEW.endpoint_id
  AND is_active = true;

  IF endpoint_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive endpoint';
  END IF;

  -- Record processing start time
  processing_start := now();

  -- Process request based on handler type
  CASE endpoint_record.handler_type
    WHEN 'llm' THEN
      -- Handle LLM request
      response_data := handle_llm_request(
        NEW.request_body,
        endpoint_record.handler_config
      );
    WHEN 'workflow' THEN
      -- Handle workflow request
      response_data := handle_workflow_request(
        NEW.request_body,
        endpoint_record.handler_config
      );
    WHEN 'edge_function' THEN
      -- Handle edge function request
      response_data := handle_edge_function_request(
        NEW.request_body,
        endpoint_record.handler_config
      );
    ELSE
      RAISE EXCEPTION 'Unsupported handler type: %', endpoint_record.handler_type;
  END CASE;

  -- Update request log
  NEW.response_status := 200;
  NEW.response_body := response_data;
  NEW.processing_time := now() - processing_start;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle edge function execution
CREATE OR REPLACE FUNCTION execute_edge_function()
RETURNS TRIGGER AS $$
DECLARE
  function_record edge_functions;
  execution_start timestamptz;
  execution_result jsonb;
BEGIN
  -- Get function configuration
  SELECT * INTO function_record
  FROM edge_functions
  WHERE id = NEW.function_id
  AND is_active = true;

  IF function_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive edge function';
  END IF;

  -- Record execution start time
  execution_start := now();

  -- Execute function based on runtime
  CASE function_record.runtime
    WHEN 'nodejs' THEN
      -- Execute Node.js function
      execution_result := execute_nodejs_function(
        function_record.handler_code,
        NEW.input_data,
        function_record.environment_variables,
        function_record.secrets
      );
    WHEN 'python' THEN
      -- Execute Python function
      execution_result := execute_python_function(
        function_record.handler_code,
        NEW.input_data,
        function_record.environment_variables,
        function_record.secrets
      );
    ELSE
      RAISE EXCEPTION 'Unsupported runtime: %', function_record.runtime;
  END CASE;

  -- Update execution log
  NEW.status := 'completed';
  NEW.output_data := execution_result;
  NEW.execution_time := now() - execution_start;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_path ON api_endpoints(path);
CREATE INDEX IF NOT EXISTS idx_edge_functions_name ON edge_functions(function_name);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_endpoint ON api_request_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_user ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_function ON edge_function_logs(function_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_user ON edge_function_logs(user_id);

-- Enable Row Level Security
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service accounts can manage endpoints"
  ON api_endpoints FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_account');

CREATE POLICY "Service accounts can manage edge functions"
  ON edge_functions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_account');

CREATE POLICY "Users can view their own request logs"
  ON api_request_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own function logs"
  ON edge_function_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default API endpoints
INSERT INTO api_endpoints (
  name,
  path,
  method,
  description,
  handler_type,
  handler_config,
  rate_limits
)
VALUES
  (
    'DNA Analysis',
    '/api/v1/dna/analyze',
    'POST',
    'Analyze DNA results using LLM',
    'llm',
    '{
      "model": "claude-3-opus",
      "prompt_template": "dna_analysis_expert",
      "max_tokens": 4096,
      "temperature": 0.7
    }'::jsonb,
    '{
      "requests_per_minute": 60,
      "requests_per_day": 1000
    }'::jsonb
  ),
  (
    'Record Matching',
    '/api/v1/records/match',
    'POST',
    'Match historical records using LLM',
    'llm',
    '{
      "model": "gpt-4-turbo",
      "prompt_template": "record_matching_expert",
      "max_tokens": 4096,
      "temperature": 0.7
    }'::jsonb,
    '{
      "requests_per_minute": 60,
      "requests_per_day": 1000
    }'::jsonb
  ),
  (
    'Workflow Trigger',
    '/api/v1/workflows/trigger',
    'POST',
    'Trigger n8n workflow',
    'workflow',
    '{
      "workflow_type": "dna_analysis",
      "timeout": 300,
      "retry_count": 3
    }'::jsonb,
    '{
      "requests_per_minute": 30,
      "requests_per_day": 500
    }'::jsonb
  );

-- Insert default edge functions
INSERT INTO edge_functions (
  name,
  function_name,
  description,
  runtime,
  handler_code,
  environment_variables,
  secrets
)
VALUES
  (
    'DNA Analysis Processor',
    'dna-analysis-processor',
    'Process and analyze DNA data',
    'nodejs',
    'async function handler(event) {
      const { dna_data, research_context } = event.body;
      
      // Process DNA data
      const processed_data = await processDNAData(dna_data);
      
      // Get LLM analysis
      const analysis = await getLLMAnalysis(processed_data, research_context);
      
      // Store results
      await storeAnalysisResults(analysis);
      
      return {
        statusCode: 200,
        body: analysis
      };
    }',
    '{
      "API_URL": "https://api.example.com",
      "ENVIRONMENT": "production"
    }'::jsonb,
    '{
      "LLM_API_KEY": "encrypted_key_here"
    }'::jsonb
  ),
  (
    'Record Matching Processor',
    'record-matching-processor',
    'Process and match historical records',
    'nodejs',
    'async function handler(event) {
      const { records, criteria } = event.body;
      
      // Process records
      const processed_records = await processRecords(records);
      
      // Get LLM matching
      const matches = await getLLMMatching(processed_records, criteria);
      
      // Store results
      await storeMatchingResults(matches);
      
      return {
        statusCode: 200,
        body: matches
      };
    }',
    '{
      "API_URL": "https://api.example.com",
      "ENVIRONMENT": "production"
    }'::jsonb,
    '{
      "LLM_API_KEY": "encrypted_key_here"
    }'::jsonb
  );

-- Create triggers
CREATE TRIGGER on_api_request
  BEFORE INSERT
  ON api_request_logs
  FOR EACH ROW
  EXECUTE FUNCTION handle_api_request();

CREATE TRIGGER on_edge_function_execution
  BEFORE INSERT
  ON edge_function_logs
  FOR EACH ROW
  EXECUTE FUNCTION execute_edge_function(); 