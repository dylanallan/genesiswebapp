-- Advanced Notification and Communication Features

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  priority text DEFAULT 'normal',
  status text DEFAULT 'unread',
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL,
  is_enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type, channel)
);

-- Create communication channels
CREATE TABLE IF NOT EXISTS communication_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create channel subscriptions
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES communication_channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type text NOT NULL,
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES communication_channels(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  recipient_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  content_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'sent',
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id),
  recipient_id uuid REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create function to handle notification creation
CREATE OR REPLACE FUNCTION handle_notification_creation()
RETURNS TRIGGER AS $$
DECLARE
  user_preferences jsonb;
  channel_settings jsonb;
BEGIN
  -- Get user's notification preferences
  SELECT settings INTO user_preferences
  FROM notification_preferences
  WHERE user_id = NEW.user_id
  AND notification_type = NEW.type
  AND is_enabled = true;

  -- If user has preferences, process notification
  IF user_preferences IS NOT NULL THEN
    -- Check each enabled channel
    FOR channel_settings IN 
      SELECT settings 
      FROM notification_preferences 
      WHERE user_id = NEW.user_id 
      AND notification_type = NEW.type 
      AND is_enabled = true
    LOOP
      -- Process notification for each channel
      IF channel_settings->>'channel' = 'email' THEN
        -- Queue email notification
        INSERT INTO email_logs (
          recipient_id,
          recipient_email,
          subject,
          content,
          metadata
        )
        SELECT 
          NEW.user_id,
          email,
          NEW.title,
          NEW.content,
          jsonb_build_object(
            'notification_id', NEW.id,
            'notification_type', NEW.type,
            'metadata', NEW.metadata
          )
        FROM auth.users
        WHERE id = NEW.user_id;
      END IF;

      -- Add more channel processing as needed
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification creation
CREATE TRIGGER notification_creation_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_notification_creation();

-- Create function to handle message delivery
CREATE OR REPLACE FUNCTION handle_message_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message status
  IF NEW.status = 'sent' THEN
    NEW.delivered_at := now();
  END IF;

  -- Create notification for recipient
  IF NEW.recipient_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      metadata
    )
    VALUES (
      NEW.recipient_id,
      'new_message',
      'New Message',
      CASE 
        WHEN NEW.content_type = 'text' THEN NEW.content
        ELSE 'You have received a new message'
      END,
      jsonb_build_object(
        'message_id', NEW.id,
        'channel_id', NEW.channel_id,
        'sender_id', NEW.sender_id,
        'content_type', NEW.content_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message delivery
CREATE TRIGGER message_delivery_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_delivery();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_channels_type ON communication_channels(type);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_user ON channel_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view active communication channels"
  ON communication_channels FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = recipient_id);

-- Insert sample communication channels
INSERT INTO communication_channels (
  name,
  type,
  description,
  settings
)
VALUES
  (
    'Family Research Updates',
    'notification',
    'Channel for family research updates and discoveries',
    '{
      "allowed_notification_types": [
        "dna_match",
        "record_match",
        "family_tree_update",
        "research_task"
      ],
      "delivery_methods": ["email", "in_app"],
      "frequency": "immediate"
    }'::jsonb
  ),
  (
    'Research Collaboration',
    'collaboration',
    'Channel for research collaboration and discussions',
    '{
      "allowed_message_types": ["text", "file", "link"],
      "max_file_size": 10485760,
      "allowed_file_types": ["pdf", "jpg", "png", "doc", "docx"],
      "retention_period": 90
    }'::jsonb
  );

-- Insert sample email templates
INSERT INTO email_templates (
  name,
  subject,
  body_template,
  variables
)
VALUES
  (
    'dna_match_notification',
    'New DNA Match Found',
    'Hello {{user_name}},

We have found a new DNA match that might be relevant to your family research:

Match Details:
- Name: {{match_name}}
- Relationship: {{relationship}}
- Shared DNA: {{shared_dna}}
- Confidence: {{confidence_score}}

You can view the full details and explore the connection by clicking the link below:
{{match_url}}

Best regards,
The Genesis Team',
    '[
      "user_name",
      "match_name",
      "relationship",
      "shared_dna",
      "confidence_score",
      "match_url"
    ]'::jsonb
  ),
  (
    'research_task_assignment',
    'New Research Task Assigned',
    'Hello {{user_name}},

A new research task has been assigned to you:

Task Details:
- Title: {{task_title}}
- Description: {{task_description}}
- Due Date: {{due_date}}
- Priority: {{priority}}

You can view and manage this task by clicking the link below:
{{task_url}}

Best regards,
The Genesis Team',
    '[
      "user_name",
      "task_title",
      "task_description",
      "due_date",
      "priority",
      "task_url"
    ]'::jsonb
  );

-- Insert default notification preferences
INSERT INTO notification_preferences (
  user_id,
  notification_type,
  channel,
  settings
)
SELECT
  id,
  unnest(ARRAY[
    'dna_match',
    'record_match',
    'family_tree_update',
    'research_task',
    'workspace_invitation',
    'message_received'
  ]),
  'email',
  '{
    "enabled": true,
    "frequency": "immediate",
    "quiet_hours": {
      "start": "22:00",
      "end": "08:00"
    }
  }'::jsonb
FROM auth.users; 