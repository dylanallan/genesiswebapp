/*
  # Business Automation Schema

  1. New Tables
    - `automation_workflows` - Workflow definitions
    - `workflow_steps` - Individual steps in workflows
    - `workflow_executions` - Execution history of workflows
    - `workflow_triggers` - Trigger conditions for workflows
    - `business_integrations` - External service integrations
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create automation_workflows table
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_template boolean DEFAULT false,
  execution_count integer DEFAULT 0,
  last_executed timestamptz,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES automation_workflows(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  step_type text NOT NULL,
  step_order integer NOT NULL,
  configuration jsonb NOT NULL,
  is_required boolean DEFAULT true,
  timeout_seconds integer DEFAULT 30,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES automation_workflows(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  result jsonb,
  error_message text,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create workflow_triggers table
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES automation_workflows(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  configuration jsonb NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_integrations table
CREATE TABLE IF NOT EXISTS business_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  service_type text NOT NULL,
  credentials jsonb,
  configuration jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Enable Row Level Security
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Automation workflows: users can manage their own
CREATE POLICY "Users can view their own workflows" 
  ON automation_workflows FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workflows" 
  ON automation_workflows FOR ALL 
  USING (auth.uid() = user_id);

-- Workflow steps: users can manage steps for their workflows
CREATE POLICY "Users can view steps for their workflows" 
  ON workflow_steps FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM automation_workflows 
    WHERE automation_workflows.id = workflow_steps.workflow_id 
    AND automation_workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage steps for their workflows" 
  ON workflow_steps FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM automation_workflows 
    WHERE automation_workflows.id = workflow_steps.workflow_id 
    AND automation_workflows.user_id = auth.uid()
  ));

-- Workflow executions: users can view executions for their workflows
CREATE POLICY "Users can view executions for their workflows" 
  ON workflow_executions FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM automation_workflows 
      WHERE automation_workflows.id = workflow_executions.workflow_id 
      AND automation_workflows.user_id = auth.uid()
    )
  );

-- Workflow triggers: users can manage triggers for their workflows
CREATE POLICY "Users can view triggers for their workflows" 
  ON workflow_triggers FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM automation_workflows 
    WHERE automation_workflows.id = workflow_triggers.workflow_id 
    AND automation_workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage triggers for their workflows" 
  ON workflow_triggers FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM automation_workflows 
    WHERE automation_workflows.id = workflow_triggers.workflow_id 
    AND automation_workflows.user_id = auth.uid()
  ));

-- Business integrations: users can manage their own
CREATE POLICY "Users can view their own integrations" 
  ON business_integrations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations" 
  ON business_integrations FOR ALL 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON workflow_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_integrations_updated_at
  BEFORE UPDATE ON business_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_automation_workflows_changes
  AFTER INSERT OR UPDATE OR DELETE ON automation_workflows
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_workflow_steps_changes
  AFTER INSERT OR UPDATE OR DELETE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_workflow_executions_changes
  AFTER INSERT OR UPDATE OR DELETE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_workflow_triggers_changes
  AFTER INSERT OR UPDATE OR DELETE ON workflow_triggers
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_business_integrations_changes
  AFTER INSERT OR UPDATE OR DELETE ON business_integrations
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX idx_automation_workflows_user_id ON automation_workflows(user_id);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_business_integrations_user_id ON business_integrations(user_id);
CREATE INDEX idx_business_integrations_service_type ON business_integrations(service_type);