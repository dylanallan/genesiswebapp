-- LLM and Automation Integration Features

-- Create API key management
CREATE TABLE IF NOT EXISTS api_key_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  service_type text NOT NULL,
  api_key text NOT NULL,
  api_secret text,
  environment text NOT NULL,
  is_active boolean DEFAULT true,
  rate_limits jsonb,
  usage_metrics jsonb DEFAULT '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_name, environment)
);

-- Create LLM model configurations
CREATE TABLE IF NOT EXISTS llm_model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  provider text NOT NULL,
  model_type text NOT NULL,
  api_key_id uuid REFERENCES api_key_management(id) ON DELETE CASCADE,
  configuration jsonb NOT NULL,
  capabilities jsonb NOT NULL,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create LLM prompts and templates
CREATE TABLE IF NOT EXISTS llm_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  prompt_type text NOT NULL,
  template text NOT NULL,
  variables jsonb,
  model_config_id uuid REFERENCES llm_model_configs(id) ON DELETE CASCADE,
  context_requirements jsonb,
  example_outputs jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create LLM conversation sessions
CREATE TABLE IF NOT EXISTS llm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  model_config_id uuid REFERENCES llm_model_configs(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  context jsonb,
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create LLM conversation messages
CREATE TABLE IF NOT EXISTS llm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES llm_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  tokens_used integer,
  processing_time interval,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create n8n workflow configurations
CREATE TABLE IF NOT EXISTS n8n_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workflow_id text NOT NULL,
  api_key_id uuid REFERENCES api_key_management(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  configuration jsonb NOT NULL,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create n8n workflow executions
CREATE TABLE IF NOT EXISTS n8n_workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES n8n_workflows(id) ON DELETE CASCADE,
  execution_id text NOT NULL,
  status text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  error_details jsonb,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create automated tasks
CREATE TABLE IF NOT EXISTS automated_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  task_type text NOT NULL,
  schedule_type text NOT NULL,
  schedule_config jsonb,
  workflow_id uuid REFERENCES n8n_workflows(id) ON DELETE CASCADE,
  llm_prompt_id uuid REFERENCES llm_prompts(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task execution logs
CREATE TABLE IF NOT EXISTS task_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES automated_tasks(id) ON DELETE CASCADE,
  execution_id text NOT NULL,
  status text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  error_details jsonb,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create function to handle LLM API calls
CREATE OR REPLACE FUNCTION process_llm_request()
RETURNS TRIGGER AS $$
DECLARE
  model_config llm_model_configs;
  api_key_record api_key_management;
  response jsonb;
BEGIN
  -- Get model configuration
  SELECT * INTO model_config
  FROM llm_model_configs
  WHERE id = NEW.model_config_id
  AND is_active = true;

  IF model_config IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive model configuration';
  END IF;

  -- Get API key
  SELECT * INTO api_key_record
  FROM api_key_management
  WHERE id = model_config.api_key_id
  AND is_active = true;

  IF api_key_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive API key';
  END IF;

  -- Process request based on provider
  CASE model_config.provider
    WHEN 'anthropic' THEN
      -- Process Anthropic API request
      response := process_anthropic_request(
        api_key_record.api_key,
        NEW.content,
        model_config.configuration
      );
    WHEN 'openai' THEN
      -- Process OpenAI API request
      response := process_openai_request(
        api_key_record.api_key,
        NEW.content,
        model_config.configuration
      );
    WHEN 'google' THEN
      -- Process Google AI request
      response := process_google_request(
        api_key_record.api_key,
        NEW.content,
        model_config.configuration
      );
    ELSE
      RAISE EXCEPTION 'Unsupported LLM provider: %', model_config.provider;
  END CASE;

  -- Update message with response
  NEW.content := response->>'content';
  NEW.tokens_used := (response->>'tokens_used')::integer;
  NEW.processing_time := (response->>'processing_time')::interval;
  NEW.metadata := NEW.metadata || jsonb_build_object(
    'provider', model_config.provider,
    'model', model_config.model_name,
    'response_metadata', response->'metadata'
  );

  -- Update API key usage
  UPDATE api_key_management
  SET usage_metrics = usage_metrics || jsonb_build_object(
    'last_used_at', now(),
    'total_requests', COALESCE((usage_metrics->>'total_requests')::integer, 0) + 1,
    'total_tokens', COALESCE((usage_metrics->>'total_tokens')::integer, 0) + NEW.tokens_used
  )
  WHERE id = api_key_record.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle n8n workflow execution
CREATE OR REPLACE FUNCTION execute_n8n_workflow()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record n8n_workflows;
  api_key_record api_key_management;
  execution_id text;
BEGIN
  -- Get workflow configuration
  SELECT * INTO workflow_record
  FROM n8n_workflows
  WHERE id = NEW.workflow_id
  AND is_active = true;

  IF workflow_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive workflow';
  END IF;

  -- Get API key
  SELECT * INTO api_key_record
  FROM api_key_management
  WHERE id = workflow_record.api_key_id
  AND is_active = true;

  IF api_key_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive API key';
  END IF;

  -- Execute workflow
  execution_id := execute_n8n_workflow_request(
    api_key_record.api_key,
    workflow_record.workflow_id,
    NEW.input_data,
    workflow_record.configuration
  );

  -- Create execution record
  INSERT INTO n8n_workflow_executions (
    workflow_id,
    execution_id,
    status,
    input_data,
    started_at
  )
  VALUES (
    workflow_record.id,
    execution_id,
    'running',
    NEW.input_data,
    now()
  );

  -- Update task metadata
  NEW.metadata := NEW.metadata || jsonb_build_object(
    'execution_id', execution_id,
    'workflow_name', workflow_record.name
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_provider ON llm_model_configs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_type ON llm_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_llm_conversations_user ON llm_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_messages_conversation ON llm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_trigger ON n8n_workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_n8n_workflow_executions_workflow ON n8n_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automated_tasks_type ON automated_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_task_execution_logs_task ON task_execution_logs(task_id);

-- Enable Row Level Security
ALTER TABLE api_key_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service accounts can manage API keys"
  ON api_key_management FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_account');

CREATE POLICY "Users can view their own conversations"
  ON llm_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages"
  ON llm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM llm_conversations
      WHERE id = llm_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Insert default API keys (encrypted)
INSERT INTO api_key_management (
  service_name,
  service_type,
  api_key,
  environment,
  rate_limits
)
VALUES
  (
    'anthropic',
    'llm',
    encrypt('your-anthropic-key-here', 'your-encryption-key'),
    'production',
    '{
      "requests_per_minute": 60,
      "tokens_per_minute": 100000
    }'::jsonb
  ),
  (
    'openai',
    'llm',
    encrypt('your-openai-key-here', 'your-encryption-key'),
    'production',
    '{
      "requests_per_minute": 60,
      "tokens_per_minute": 90000
    }'::jsonb
  ),
  (
    'google-ai',
    'llm',
    encrypt('your-google-key-here', 'your-encryption-key'),
    'production',
    '{
      "requests_per_minute": 60,
      "tokens_per_minute": 120000
    }'::jsonb
  ),
  (
    'n8n',
    'automation',
    encrypt('your-n8n-key-here', 'your-encryption-key'),
    'production',
    '{
      "requests_per_minute": 120,
      "concurrent_workflows": 10
    }'::jsonb
  );

-- Insert default LLM model configurations
INSERT INTO llm_model_configs (
  model_name,
  provider,
  model_type,
  api_key_id,
  configuration,
  capabilities
)
SELECT
  'claude-3-opus',
  'anthropic',
  'chat',
  id,
  '{
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }'::jsonb,
  '{
    "tasks": [
      "genealogy_research",
      "dna_analysis",
      "record_matching",
      "relationship_inference",
      "content_generation"
    ],
    "languages": ["en", "fr"],
    "context_window": 200000
  }'::jsonb
FROM api_key_management
WHERE service_name = 'anthropic'
UNION ALL
SELECT
  'gpt-4-turbo',
  'openai',
  'chat',
  id,
  '{
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }'::jsonb,
  '{
    "tasks": [
      "genealogy_research",
      "dna_analysis",
      "record_matching",
      "relationship_inference",
      "content_generation"
    ],
    "languages": ["en", "fr"],
    "context_window": 128000
  }'::jsonb
FROM api_key_management
WHERE service_name = 'openai'
UNION ALL
SELECT
  'gemini-pro',
  'google',
  'chat',
  id,
  '{
    "temperature": 0.7,
    "max_tokens": 32768,
    "top_p": 1.0,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  }'::jsonb,
  '{
    "tasks": [
      "genealogy_research",
      "dna_analysis",
      "record_matching",
      "relationship_inference",
      "content_generation"
    ],
    "languages": ["en", "fr"],
    "context_window": 32768
  }'::jsonb
FROM api_key_management
WHERE service_name = 'google-ai';

-- Insert default LLM prompts
INSERT INTO llm_prompts (
  name,
  description,
  prompt_type,
  template,
  model_config_id,
  context_requirements,
  example_outputs
)
SELECT
  'DNA Analysis Expert',
  'Expert analysis of DNA results for genealogy research',
  'dna_analysis',
  'You are an expert genetic genealogist. Analyze the following DNA results and provide insights:
  
  DNA Results:
  {dna_results}
  
  Research Context:
  {research_context}
  
  Please provide:
  1. Ethnicity breakdown
  2. Genetic matches analysis
  3. Potential family connections
  4. Research recommendations',
  id,
  '{
    "required_fields": ["dna_results", "research_context"],
    "optional_fields": ["family_history", "research_goals"]
  }'::jsonb,
  '{
    "example_input": {
      "dna_results": "Sample DNA data...",
      "research_context": "Research context..."
    },
    "example_output": {
      "ethnicity_breakdown": "...",
      "genetic_matches": "...",
      "family_connections": "...",
      "recommendations": "..."
    }
  }'::jsonb
FROM llm_model_configs
WHERE model_name = 'claude-3-opus'
UNION ALL
SELECT
  'Record Matching Expert',
  'Expert analysis of historical records for matching',
  'record_matching',
  'You are an expert genealogist. Analyze the following historical records and identify potential matches:
  
  Records to Match:
  {records}
  
  Matching Criteria:
  {criteria}
  
  Please provide:
  1. Match confidence scores
  2. Matching evidence
  3. Potential discrepancies
  4. Recommendations for verification',
  id,
  '{
    "required_fields": ["records", "criteria"],
    "optional_fields": ["context", "previous_matches"]
  }'::jsonb,
  '{
    "example_input": {
      "records": "Sample records...",
      "criteria": "Matching criteria..."
    },
    "example_output": {
      "confidence_scores": "...",
      "matching_evidence": "...",
      "discrepancies": "...",
      "recommendations": "..."
    }
  }'::jsonb
FROM llm_model_configs
WHERE model_name = 'gpt-4-turbo';

-- Insert default n8n workflows
INSERT INTO n8n_workflows (
  name,
  description,
  workflow_id,
  api_key_id,
  trigger_type,
  configuration
)
SELECT
  'DNA Analysis Automation',
  'Automated DNA analysis workflow',
  'dna-analysis-workflow',
  id,
  'webhook',
  '{
    "nodes": [
      {
        "type": "webhook",
        "parameters": {
          "path": "dna-analysis",
          "responseMode": "lastNode"
        }
      },
      {
        "type": "function",
        "parameters": {
          "functionCode": "// Process DNA data"
        }
      },
      {
        "type": "httpRequest",
        "parameters": {
          "url": "{{$env.API_URL}}/dna/analyze",
          "method": "POST"
        }
      }
    ]
  }'::jsonb
FROM api_key_management
WHERE service_name = 'n8n'
UNION ALL
SELECT
  'Record Matching Automation',
  'Automated record matching workflow',
  'record-matching-workflow',
  id,
  'schedule',
  '{
    "nodes": [
      {
        "type": "schedule",
        "parameters": {
          "interval": "0 0 * * *"
        }
      },
      {
        "type": "function",
        "parameters": {
          "functionCode": "// Process records"
        }
      },
      {
        "type": "httpRequest",
        "parameters": {
          "url": "{{$env.API_URL}}/records/match",
          "method": "POST"
        }
      }
    ]
  }'::jsonb
FROM api_key_management
WHERE service_name = 'n8n';

-- Create triggers
CREATE TRIGGER on_llm_message
  BEFORE INSERT
  ON llm_messages
  FOR EACH ROW
  EXECUTE FUNCTION process_llm_request();

CREATE TRIGGER on_workflow_execution
  BEFORE INSERT
  ON n8n_workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION execute_n8n_workflow(); 