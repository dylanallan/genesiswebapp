/*
  # Marketing and Community Schema

  1. New Tables
    - `marketing_campaigns` - Marketing campaign definitions
    - `marketing_contacts` - Marketing contact list
    - `marketing_messages` - Marketing messages and templates
    - `community_groups` - Community groups and circles
    - `community_posts` - Community posts and discussions
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL,
  status text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  budget numeric,
  target_audience jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketing_contacts table
CREATE TABLE IF NOT EXISTS marketing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  status text NOT NULL,
  source text,
  tags text[] DEFAULT '{}'::text[],
  custom_fields jsonb DEFAULT '{}'::jsonb,
  consent_given boolean DEFAULT false,
  consent_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Create marketing_messages table
CREATE TABLE IF NOT EXISTS marketing_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  message_type text NOT NULL,
  subject text,
  content text NOT NULL,
  template_variables jsonb DEFAULT '{}'::jsonb,
  is_template boolean DEFAULT false,
  scheduled_for timestamptz,
  sent_at timestamptz,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_groups table
CREATE TABLE IF NOT EXISTS community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  group_type text NOT NULL,
  is_public boolean DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rules text,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_group_members table
CREATE TABLE IF NOT EXISTS community_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  post_type text DEFAULT 'text',
  media_urls text[] DEFAULT '{}'::text[],
  is_pinned boolean DEFAULT false,
  is_announcement boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Marketing campaigns: users can manage their own
CREATE POLICY "Users can view their own marketing campaigns" 
  ON marketing_campaigns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing campaigns" 
  ON marketing_campaigns FOR ALL 
  USING (auth.uid() = user_id);

-- Marketing contacts: users can manage their own
CREATE POLICY "Users can view their own marketing contacts" 
  ON marketing_contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing contacts" 
  ON marketing_contacts FOR ALL 
  USING (auth.uid() = user_id);

-- Marketing messages: users can manage their own
CREATE POLICY "Users can view their own marketing messages" 
  ON marketing_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing messages" 
  ON marketing_messages FOR ALL 
  USING (auth.uid() = user_id);

-- Community groups: public groups are viewable by all, members can view private groups
CREATE POLICY "Public community groups are viewable by everyone" 
  ON community_groups FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Members can view their private groups" 
  ON community_groups FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM community_group_members 
    WHERE community_group_members.group_id = community_groups.id 
    AND community_group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group owners can manage their groups" 
  ON community_groups FOR ALL 
  USING (owner_id = auth.uid());

-- Community group members: members can view their own memberships
CREATE POLICY "Users can view group memberships" 
  ON community_group_members FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM community_groups 
      WHERE community_groups.id = community_group_members.group_id 
      AND community_groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can manage memberships" 
  ON community_group_members FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM community_groups 
    WHERE community_groups.id = community_group_members.group_id 
    AND community_groups.owner_id = auth.uid()
  ));

CREATE POLICY "Users can join public groups" 
  ON community_group_members FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM community_groups 
      WHERE community_groups.id = community_group_members.group_id 
      AND community_groups.is_public = true
    )
  );

CREATE POLICY "Users can leave groups" 
  ON community_group_members FOR DELETE 
  USING (user_id = auth.uid());

-- Community posts: users can view posts in their groups
CREATE POLICY "Users can view posts in public groups" 
  ON community_posts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM community_groups 
    WHERE community_groups.id = community_posts.group_id 
    AND community_groups.is_public = true
  ));

CREATE POLICY "Users can view posts in their groups" 
  ON community_posts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM community_group_members 
    WHERE community_group_members.group_id = community_posts.group_id 
    AND community_group_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create posts in their groups" 
  ON community_posts FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM community_group_members 
      WHERE community_group_members.group_id = community_posts.group_id 
      AND community_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own posts" 
  ON community_posts FOR UPDATE OR DELETE 
  USING (auth.uid() = user_id);

-- Community comments: users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts" 
  ON community_comments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM community_posts 
    WHERE community_posts.id = community_comments.post_id 
    AND (
      EXISTS (
        SELECT 1 FROM community_groups 
        WHERE community_groups.id = community_posts.group_id 
        AND community_groups.is_public = true
      ) OR 
      EXISTS (
        SELECT 1 FROM community_group_members 
        WHERE community_group_members.group_id = community_posts.group_id 
        AND community_group_members.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can create comments on visible posts" 
  ON community_comments FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM community_posts 
      WHERE community_posts.id = community_comments.post_id 
      AND (
        EXISTS (
          SELECT 1 FROM community_groups 
          WHERE community_groups.id = community_posts.group_id 
          AND community_groups.is_public = true
        ) OR 
        EXISTS (
          SELECT 1 FROM community_group_members 
          WHERE community_group_members.group_id = community_posts.group_id 
          AND community_group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage their own comments" 
  ON community_comments FOR UPDATE OR DELETE 
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_contacts_updated_at
  BEFORE UPDATE ON marketing_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_messages_updated_at
  BEFORE UPDATE ON marketing_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_groups_updated_at
  BEFORE UPDATE ON community_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit log triggers
CREATE TRIGGER audit_marketing_campaigns_changes
  AFTER INSERT OR UPDATE OR DELETE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_marketing_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON marketing_contacts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_marketing_messages_changes
  AFTER INSERT OR UPDATE OR DELETE ON marketing_messages
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_community_groups_changes
  AFTER INSERT OR UPDATE OR DELETE ON community_groups
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_community_posts_changes
  AFTER INSERT OR UPDATE OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_community_comments_changes
  AFTER INSERT OR UPDATE OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create indexes for better performance
CREATE INDEX idx_marketing_campaigns_user_id ON marketing_campaigns(user_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_contacts_user_id ON marketing_contacts(user_id);
CREATE INDEX idx_marketing_contacts_email ON marketing_contacts(email);
CREATE INDEX idx_marketing_contacts_tags ON marketing_contacts USING gin(tags);
CREATE INDEX idx_marketing_messages_user_id ON marketing_messages(user_id);
CREATE INDEX idx_marketing_messages_campaign_id ON marketing_messages(campaign_id);
CREATE INDEX idx_community_groups_owner_id ON community_groups(owner_id);
CREATE INDEX idx_community_groups_is_public ON community_groups(is_public);
CREATE INDEX idx_community_group_members_group_id ON community_group_members(group_id);
CREATE INDEX idx_community_group_members_user_id ON community_group_members(user_id);
CREATE INDEX idx_community_posts_group_id ON community_posts(group_id);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_parent_id ON community_comments(parent_id);