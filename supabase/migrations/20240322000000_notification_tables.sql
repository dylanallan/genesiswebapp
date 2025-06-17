-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  subject TEXT,
  body TEXT,
  blocks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification channels table
CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('email', 'slack', 'webhook')),
  config JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB NOT NULL,
  result JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_channels_name ON notification_channels(name);
CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON notification_channels(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template ON notification_logs(template);
CREATE INDEX IF NOT EXISTS idx_notification_logs_timestamp ON notification_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage templates"
  ON notification_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage channels"
  ON notification_channels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read channels"
  ON notification_channels
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage logs"
  ON notification_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notification_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Create scheduled job to clean up old logs
SELECT cron.schedule(
  'cleanup-notification-logs',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT cleanup_old_notification_logs()$$
);

-- Create views for notification analytics
CREATE OR REPLACE VIEW notification_analytics AS
WITH diffs AS (
  SELECT
    date_trunc('hour', timestamp) as hour,
    channel,
    template,
    timestamp,
    result,
    EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (PARTITION BY channel ORDER BY timestamp))) as time_diff
  FROM notification_logs
)
SELECT
  hour,
  channel,
  template,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE result->>'success' = 'true') as successful_notifications,
  COUNT(*) FILTER (WHERE result->>'success' = 'false') as failed_notifications,
  AVG(time_diff) as avg_time_between_notifications
FROM diffs
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- Create view for channel health
CREATE OR REPLACE VIEW notification_channel_health AS
WITH recent_logs AS (
  SELECT
    channel,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE result->>'success' = 'true') as successful_notifications,
    COUNT(*) FILTER (WHERE result->>'success' = 'false') as failed_notifications,
    MAX(timestamp) as last_notification
  FROM notification_logs
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY channel
)
SELECT
  c.name as channel_name,
  c.type as channel_type,
  c.is_active,
  COALESCE(l.total_notifications, 0) as notifications_24h,
  COALESCE(l.successful_notifications, 0) as successful_24h,
  COALESCE(l.failed_notifications, 0) as failed_24h,
  COALESCE(l.successful_notifications::float / NULLIF(l.total_notifications, 0), 1) as success_rate,
  l.last_notification,
  CASE
    WHEN l.last_notification IS NULL THEN 'no_activity'
    WHEN l.last_notification < NOW() - INTERVAL '1 hour' THEN 'inactive'
    WHEN l.failed_notifications::float / NULLIF(l.total_notifications, 0) > 0.1 THEN 'degraded'
    ELSE 'healthy'
  END as status
FROM notification_channels c
LEFT JOIN recent_logs l ON c.name = l.channel;

-- Grant access to views
GRANT SELECT ON notification_analytics TO authenticated;
GRANT SELECT ON notification_channel_health TO authenticated;

-- Insert default templates
INSERT INTO notification_templates (name, description, subject, body, blocks)
VALUES
  (
    'alert_error',
    'Template for error alerts',
    '🚨 Alert: {{function_name}} Error',
    '<h1>Error Alert</h1><p>Function: {{function_name}}</p><p>Error: {{error_message}}</p><p>Timestamp: {{timestamp}}</p>',
    '[
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🚨 Error Alert"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Function:*\n{{function_name}}"
          },
          {
            "type": "mrkdwn",
            "text": "*Timestamp:*\n{{timestamp}}"
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Error:*\n{{error_message}}"
        }
      }
    ]'
  ),
  (
    'alert_warning',
    'Template for warning alerts',
    '⚠️ Warning: {{function_name}} Performance Issue',
    '<h1>Performance Warning</h1><p>Function: {{function_name}}</p><p>Issue: {{warning_message}}</p><p>Timestamp: {{timestamp}}</p>',
    '[
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "⚠️ Performance Warning"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Function:*\n{{function_name}}"
          },
          {
            "type": "mrkdwn",
            "text": "*Timestamp:*\n{{timestamp}}"
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Issue:*\n{{warning_message}}"
        }
      }
    ]'
  ),
  (
    'alert_recovery',
    'Template for recovery alerts',
    '✅ Recovery: {{function_name}} Back to Normal',
    '<h1>Recovery Alert</h1><p>Function: {{function_name}}</p><p>Status: {{recovery_message}}</p><p>Timestamp: {{timestamp}}</p>',
    '[
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "✅ Recovery Alert"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Function:*\n{{function_name}}"
          },
          {
            "type": "mrkdwn",
            "text": "*Timestamp:*\n{{timestamp}}"
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Status:*\n{{recovery_message}}"
        }
      }
    ]'
  )
ON CONFLICT (name) DO NOTHING; 