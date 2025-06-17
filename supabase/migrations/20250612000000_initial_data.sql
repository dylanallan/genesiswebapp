-- Initial data population for essential tables

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', '"Genesis LMS"', 'The name of the application', true),
('site_description', '"A comprehensive learning management system for cultural heritage preservation"', 'The description of the application', true),
('default_language', '"en"', 'Default language for the application', true),
('maintenance_mode', 'false', 'Whether the application is in maintenance mode', true),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "application/pdf", "audio/mpeg", "video/mp4"]', 'Allowed file types for uploads', true),
('max_file_size', '10485760', 'Maximum file size in bytes (10MB)', true),
('ai_settings', '{
  "default_model": "gpt-4",
  "max_tokens": 2000,
  "temperature": 0.7,
  "available_models": ["gpt-4", "gpt-3.5-turbo", "claude-3-opus"]
}', 'Default AI model settings', false);

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_type, capabilities, max_tokens, token_cost, is_active, configuration) VALUES
('gpt-4', 'openai', 'chat', ARRAY['text', 'code', 'analysis'], 8192, 0.03, true, '{"temperature": 0.7, "top_p": 1}'),
('gpt-3.5-turbo', 'openai', 'chat', ARRAY['text', 'code'], 4096, 0.002, true, '{"temperature": 0.7, "top_p": 1}'),
('claude-3-opus', 'anthropic', 'chat', ARRAY['text', 'code', 'analysis'], 100000, 0.015, true, '{"temperature": 0.7}');

-- Insert default categories for cultural artifacts
INSERT INTO cultural_artifacts (user_id, title, description, category, media_type, tags)
SELECT 
  auth.uid(),
  'Welcome to Genesis LMS',
  'This is your first cultural artifact. Use this space to store and organize your cultural heritage.',
  'introduction',
  'text',
  ARRAY['welcome', 'getting-started']
FROM auth.users
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert default user preferences for existing users
INSERT INTO user_preferences_enhanced (user_id, theme, color_scheme, notifications, ai_preferences, heritage_preferences, business_preferences)
SELECT 
  id,
  'light',
  '{
    "primary": "#ffffff",
    "secondary": "#f1f5f9",
    "accent": "#3b82f6",
    "background": "#f8fafc",
    "text": "#1e293b",
    "border": "#e2e8f0"
  }'::jsonb,
  '{
    "email": true,
    "push": true,
    "marketing": false,
    "system": true
  }'::jsonb,
  '{
    "preferred_model": "auto",
    "response_length": "balanced",
    "creativity": "balanced",
    "save_history": true
  }'::jsonb,
  '{
    "ancestry": [],
    "cultural_interests": [],
    "family_history_privacy": "private"
  }'::jsonb,
  '{
    "industry": null,
    "company_size": null,
    "automation_goals": []
  }'::jsonb
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert default community group
INSERT INTO community_groups (name, description, group_type, is_public, owner_id)
SELECT 
  'Genesis Community',
  'Welcome to the Genesis LMS community! This is a space for sharing cultural heritage and learning together.',
  'general',
  true,
  id
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert welcome post in the community group
INSERT INTO community_posts (group_id, user_id, title, content, post_type, is_announcement)
SELECT 
  cg.id,
  cg.owner_id,
  'Welcome to Genesis LMS Community',
  'Welcome to our community! This is a space for sharing cultural heritage, learning, and connecting with others. Feel free to introduce yourself and share your cultural background.',
  'text',
  true
FROM community_groups cg
WHERE cg.name = 'Genesis Community'
ON CONFLICT DO NOTHING;

-- Insert default marketing funnel stages
INSERT INTO marketing_funnels (user_id, name, description, stages, metrics, settings)
SELECT 
  id,
  'Default Onboarding Funnel',
  'Default funnel for new user onboarding',
  '[
    {"name": "awareness", "description": "User discovers the platform"},
    {"name": "interest", "description": "User explores features"},
    {"name": "consideration", "description": "User evaluates value"},
    {"name": "conversion", "description": "User creates account"},
    {"name": "retention", "description": "User engages regularly"}
  ]'::jsonb,
  '{
    "conversion_rate": 0,
    "total_users": 0,
    "active_users": 0
  }'::jsonb,
  '{
    "auto_assign": true,
    "notify_on_stage_change": true
  }'::jsonb
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert default email sequence for welcome
INSERT INTO email_sequences (user_id, name, trigger_type, emails, metrics)
SELECT 
  id,
  'Welcome Sequence',
  'on_signup',
  '[
    {
      "subject": "Welcome to Genesis LMS",
      "content": "Welcome to Genesis LMS! We''re excited to help you preserve and share your cultural heritage.",
      "delay_days": 0
    },
    {
      "subject": "Getting Started with Genesis LMS",
      "content": "Here are some tips to help you get started with preserving your cultural heritage.",
      "delay_days": 2
    },
    {
      "subject": "Explore Cultural Heritage Features",
      "content": "Discover how to use our features to document and share your cultural heritage.",
      "delay_days": 5
    }
  ]'::jsonb,
  '{
    "sent_count": 0,
    "open_rate": 0,
    "click_rate": 0
  }'::jsonb
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING; 