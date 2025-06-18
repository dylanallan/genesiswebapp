-- Advanced Analytics and Reporting Features

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  device_info jsonb,
  location jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user activity metrics
CREATE TABLE IF NOT EXISTS user_activity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric_date, metric_type)
);

-- Create research progress metrics
CREATE TABLE IF NOT EXISTS research_progress_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric_date, metric_type)
);

-- Create dna analysis metrics
CREATE TABLE IF NOT EXISTS dna_analysis_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  analysis_context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, metric_date, metric_type)
);

-- Create report templates
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL,
  query_template text NOT NULL,
  parameters jsonb DEFAULT '[]',
  visualization_config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES report_templates(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name text NOT NULL,
  parameters jsonb DEFAULT '{}',
  result_data jsonb,
  status text DEFAULT 'pending',
  error_message text,
  generated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES report_templates(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  parameters jsonb DEFAULT '{}',
  frequency text NOT NULL,
  next_run_at timestamptz,
  last_run_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to track user activity
CREATE OR REPLACE FUNCTION track_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert analytics event
  INSERT INTO analytics_events (
    user_id,
    event_type,
    event_data,
    session_id,
    device_info,
    location
  )
  VALUES (
    NEW.user_id,
    NEW.event_type,
    NEW.event_data,
    NEW.session_id,
    NEW.device_info,
    NEW.location
  );

  -- Update daily metrics
  INSERT INTO user_activity_metrics (
    user_id,
    metric_date,
    metric_type,
    metric_value,
    metadata
  )
  VALUES (
    NEW.user_id,
    current_date,
    'daily_events',
    1,
    jsonb_build_object(
      'event_type', NEW.event_type,
      'session_id', NEW.session_id
    )
  )
  ON CONFLICT (user_id, metric_date, metric_type)
  DO UPDATE SET
    metric_value = user_activity_metrics.metric_value + 1,
    metadata = user_activity_metrics.metadata || 
      jsonb_build_object(
        'last_event_type', NEW.event_type,
        'last_session_id', NEW.session_id
      ),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user activity tracking
CREATE TRIGGER track_user_activity_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION track_user_activity();

-- Create function to update research progress
CREATE OR REPLACE FUNCTION update_research_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update research progress metrics based on event type
  CASE NEW.event_type
    WHEN 'record_added' THEN
      INSERT INTO research_progress_metrics (
        user_id,
        metric_date,
        metric_type,
        metric_value,
        context
      )
      VALUES (
        NEW.user_id,
        current_date,
        'records_added',
        1,
        jsonb_build_object(
          'record_type', NEW.event_data->>'record_type',
          'record_id', NEW.event_data->>'record_id'
        )
      )
      ON CONFLICT (user_id, metric_date, metric_type)
      DO UPDATE SET
        metric_value = research_progress_metrics.metric_value + 1,
        context = research_progress_metrics.context || 
          jsonb_build_object(
            'last_record_type', NEW.event_data->>'record_type',
            'last_record_id', NEW.event_data->>'record_id'
          ),
        updated_at = now();

    WHEN 'family_member_added' THEN
      INSERT INTO research_progress_metrics (
        user_id,
        metric_date,
        metric_type,
        metric_value,
        context
      )
      VALUES (
        NEW.user_id,
        current_date,
        'family_members_added',
        1,
        jsonb_build_object(
          'member_id', NEW.event_data->>'member_id'
        )
      )
      ON CONFLICT (user_id, metric_date, metric_type)
      DO UPDATE SET
        metric_value = research_progress_metrics.metric_value + 1,
        context = research_progress_metrics.context || 
          jsonb_build_object(
            'last_member_id', NEW.event_data->>'member_id'
          ),
        updated_at = now();

    -- Add more cases for other event types
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for research progress updates
CREATE TRIGGER update_research_progress_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  WHEN (NEW.event_type IN ('record_added', 'family_member_added', 'dna_match_found'))
  EXECUTE FUNCTION update_research_progress();

-- Create function to generate report
CREATE OR REPLACE FUNCTION generate_report()
RETURNS TRIGGER AS $$
DECLARE
  query_result jsonb;
BEGIN
  -- Get report template
  SELECT query_template, parameters
  INTO NEW.query_template, NEW.parameters
  FROM report_templates
  WHERE id = NEW.template_id;

  -- Execute report query
  EXECUTE format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (%s) t',
    NEW.query_template
  ) INTO query_result;

  -- Update report status
  UPDATE generated_reports
  SET 
    status = 'completed',
    result_data = query_result,
    generated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for report generation
CREATE TRIGGER generate_report_trigger
  AFTER INSERT ON generated_reports
  FOR EACH ROW
  EXECUTE FUNCTION generate_report();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_metrics_user ON user_activity_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_metrics_date ON user_activity_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_research_progress_metrics_user ON research_progress_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_research_progress_metrics_date ON research_progress_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_metrics_user ON dna_analysis_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_dna_analysis_metrics_date ON dna_analysis_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_user ON report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_analysis_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity metrics"
  ON user_activity_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own research progress"
  ON research_progress_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own DNA analysis metrics"
  ON dna_analysis_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view active report templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own generated reports"
  ON generated_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own report schedules"
  ON report_schedules FOR ALL
  USING (auth.uid() = user_id);

-- Insert sample report templates
INSERT INTO report_templates (
  name,
  description,
  template_type,
  query_template,
  parameters,
  visualization_config
)
VALUES
  (
    'Research Progress Summary',
    'Summary of research progress including records, family members, and DNA matches',
    'progress_summary',
    'SELECT 
      date_trunc(''day'', created_at) as date,
      count(*) as total_records,
      count(distinct user_id) as active_users,
      sum(case when event_type = ''record_added'' then 1 else 0 end) as records_added,
      sum(case when event_type = ''family_member_added'' then 1 else 0 end) as members_added,
      sum(case when event_type = ''dna_match_found'' then 1 else 0 end) as dna_matches
    FROM analytics_events
    WHERE created_at >= $1::date
    AND created_at < $2::date
    GROUP BY date
    ORDER BY date',
    '[
      {"name": "start_date", "type": "date", "required": true},
      {"name": "end_date", "type": "date", "required": true}
    ]'::jsonb,
    '{
      "chart_type": "line",
      "x_axis": "date",
      "y_axis": ["total_records", "records_added", "members_added", "dna_matches"],
      "title": "Research Progress Over Time",
      "description": "Tracking research activity and discoveries"
    }'::jsonb
  ),
  (
    'DNA Analysis Overview',
    'Overview of DNA analysis results and matches',
    'dna_analysis',
    'SELECT 
      user_id,
      count(*) as total_matches,
      avg(cast(event_data->>''confidence_score'' as numeric)) as avg_confidence,
      count(distinct event_data->>''ethnicity'') as unique_ethnicities,
      sum(case when cast(event_data->>''shared_dna'' as numeric) > 100 then 1 else 0 end) as close_matches
    FROM analytics_events
    WHERE event_type = ''dna_match_found''
    AND created_at >= $1::date
    AND created_at < $2::date
    GROUP BY user_id',
    '[
      {"name": "start_date", "type": "date", "required": true},
      {"name": "end_date", "type": "date", "required": true}
    ]'::jsonb,
    '{
      "chart_type": "bar",
      "x_axis": "user_id",
      "y_axis": ["total_matches", "avg_confidence", "unique_ethnicities", "close_matches"],
      "title": "DNA Analysis Results",
      "description": "Overview of DNA matches and analysis"
    }'::jsonb
  );

-- Insert sample report schedules
INSERT INTO report_schedules (
  template_id,
  user_id,
  schedule_name,
  parameters,
  frequency,
  next_run_at
)
SELECT
  t.id,
  u.id,
  'Weekly Research Progress',
  '{
    "start_date": "current_date - interval ''7 days''",
    "end_date": "current_date"
  }'::jsonb,
  'weekly',
  date_trunc('week', now()) + interval '1 week'
FROM report_templates t
CROSS JOIN auth.users u
WHERE t.name = 'Research Progress Summary'
LIMIT 1; 