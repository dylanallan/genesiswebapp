-- Advanced Collaboration and Sharing Features

-- Create collaboration workspaces
CREATE TABLE IF NOT EXISTS collaboration_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_type text NOT NULL,
  settings jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb DEFAULT '{}',
  invitation_status text DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create shared resources
CREATE TABLE IF NOT EXISTS shared_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  shared_by uuid REFERENCES auth.users(id),
  sharing_settings jsonb DEFAULT '{}',
  access_level text DEFAULT 'view',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research tasks
CREATE TABLE IF NOT EXISTS research_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date timestamptz,
  tags text[],
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES research_tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research notes
CREATE TABLE IF NOT EXISTS research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  tags text[],
  related_resources jsonb DEFAULT '[]',
  visibility text DEFAULT 'workspace',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create note versions
CREATE TABLE IF NOT EXISTS note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES research_notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  version_number integer NOT NULL,
  change_summary text,
  created_at timestamptz DEFAULT now()
);

-- Create research discussions
CREATE TABLE IF NOT EXISTS research_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'active',
  tags text[],
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create discussion messages
CREATE TABLE IF NOT EXISTS discussion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES research_discussions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  parent_message_id uuid REFERENCES discussion_messages(id),
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research events
CREATE TABLE IF NOT EXISTS research_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES collaboration_workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location jsonb,
  organizer_id uuid REFERENCES auth.users(id),
  participants jsonb DEFAULT '[]',
  status text DEFAULT 'scheduled',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to handle workspace member invitations
CREATE OR REPLACE FUNCTION handle_workspace_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to invited user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    metadata
  )
  VALUES (
    NEW.user_id,
    'workspace_invitation',
    'Workspace Invitation',
    'You have been invited to join a workspace',
    jsonb_build_object(
      'workspace_id', NEW.workspace_id,
      'role', NEW.role,
      'invited_by', NEW.invited_by
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workspace invitations
CREATE TRIGGER workspace_invitation_trigger
  AFTER INSERT ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_workspace_invitation();

-- Create function to handle task assignments
CREATE OR REPLACE FUNCTION handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    -- Send notification to assigned user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      metadata
    )
    VALUES (
      NEW.assigned_to,
      'task_assignment',
      'New Research Task Assigned',
      NEW.title,
      jsonb_build_object(
        'task_id', NEW.id,
        'workspace_id', NEW.workspace_id,
        'due_date', NEW.due_date,
        'priority', NEW.priority
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task assignments
CREATE TRIGGER task_assignment_trigger
  AFTER INSERT OR UPDATE ON research_tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_assignment();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shared_resources_workspace ON shared_resources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_workspace ON research_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_research_tasks_assigned ON research_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_workspace ON research_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_note ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_research_discussions_workspace ON research_discussions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_discussion ON discussion_messages(discussion_id);
CREATE INDEX IF NOT EXISTS idx_research_events_workspace ON research_events(workspace_id);

-- Enable Row Level Security
ALTER TABLE collaboration_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workspaces"
  ON collaboration_workspaces FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage workspaces"
  ON collaboration_workspaces FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Workspace members can view shared resources"
  ON shared_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = shared_resources.workspace_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their assigned tasks"
  ON research_tasks FOR SELECT
  USING (
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = research_tasks.workspace_id
      AND user_id = auth.uid()
    )
  );

-- Insert sample workspace templates
INSERT INTO collaboration_workspaces (
  name,
  description,
  workspace_type,
  settings,
  is_public
)
VALUES
  (
    'Family History Research Group',
    'Collaborative workspace for researching the Smith family history',
    'family_research',
    '{
      "default_visibility": "workspace",
      "allowed_roles": ["owner", "admin", "researcher", "viewer"],
      "notification_settings": {
        "task_assignments": true,
        "new_members": true,
        "resource_sharing": true,
        "discussion_updates": true
      }
    }'::jsonb,
    false
  ),
  (
    'Canadian Immigration Research',
    'Research group focusing on Canadian immigration records',
    'specialized_research',
    '{
      "default_visibility": "workspace",
      "allowed_roles": ["owner", "admin", "researcher", "viewer"],
      "notification_settings": {
        "task_assignments": true,
        "new_members": true,
        "resource_sharing": true,
        "discussion_updates": true
      },
      "specialized_focus": ["immigration_records", "ship_manifests", "naturalization_records"]
    }'::jsonb,
    true
  );

-- Insert sample research tasks
INSERT INTO research_tasks (
  workspace_id,
  title,
  description,
  assigned_to,
  created_by,
  status,
  priority,
  due_date,
  tags
)
SELECT
  w.id,
  'Research 1851 Census Records',
  'Search and analyze 1851 census records for the Smith family in Ontario',
  m.user_id,
  w.owner_id,
  'pending',
  'high',
  now() + interval '7 days',
  ARRAY['census', 'ontario', '1851']
FROM collaboration_workspaces w
JOIN workspace_members m ON m.workspace_id = w.id
WHERE w.name = 'Family History Research Group'
LIMIT 1;

-- Insert sample research discussion
INSERT INTO research_discussions (
  workspace_id,
  title,
  description,
  created_by,
  tags
)
SELECT
  w.id,
  'DNA Match Analysis',
  'Discussion about recent DNA matches and their potential connections',
  w.owner_id,
  ARRAY['dna', 'matches', 'analysis']
FROM collaboration_workspaces w
WHERE w.name = 'Family History Research Group'
LIMIT 1; 