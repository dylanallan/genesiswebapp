-- Genesis Heritage Pro: application schema.
-- Creates every table and function the app and Edge Functions use, so a fresh Supabase project
-- works end to end. Idempotent: safe to run on a project that already has some of these objects.
--
-- Conventions
--   * user_id defaults to auth.uid(), so the UI never has to send it, and RLS keeps rows private.
--   * "System" tables (logs, metrics) are written by Edge Functions with the service role; only
--     admins (rows in admin_roles) may read them.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------------------------
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
drop policy if exists "Users can see their own admin role" on public.admin_roles;
create policy "Users can see their own admin role" on public.admin_roles for select using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;

-- Helper used below: owner-only CRUD policy for a user-owned table.
create or replace function public._owner_policy(tbl text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', tbl);
  execute format('drop policy if exists "Owner access" on public.%I', tbl);
  execute format('create policy "Owner access" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', tbl);
end;
$$;

-- Helper: system table, written by the service role, readable by admins only.
create or replace function public._admin_read_policy(tbl text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', tbl);
  execute format('drop policy if exists "Admins can read" on public.%I', tbl);
  execute format('create policy "Admins can read" on public.%I for select to authenticated using (public.is_admin())', tbl);
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  ancestry text,
  business_goals text,
  cultural_background text,
  location text,
  timezone text,
  language text,
  onboarding_completed boolean not null default false,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
drop policy if exists "Users manage their own profile" on public.user_profiles;
create policy "Users manage their own profile" on public.user_profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  last_login timestamptz,
  login_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('user_data');

create table if not exists public.user_profile_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  reason text,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists user_profile_history_user_idx on public.user_profile_history (user_id, created_at desc);
alter table public.user_profile_history enable row level security;
drop policy if exists "Users read their own history" on public.user_profile_history;
create policy "Users read their own history" on public.user_profile_history for select using (auth.uid() = user_id);

-- Create profile rows automatically for every new account.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name) values (new.id, split_part(new.email, '@', 1)) on conflict do nothing;
  insert into public.user_data (user_id) values (new.id) on conflict do nothing;
  -- Kept from the original signup trigger: the older family-tree tables hang off public.profiles.
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url') on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Backfill for accounts created before this migration.
insert into public.user_profiles (id, display_name) select id, split_part(email, '@', 1) from auth.users on conflict do nothing;
insert into public.user_data (user_id) select id from auth.users on conflict do nothing;

-- Signed-in users get their own profile; the service role may pass p_user_id.
create or replace function public.get_user_profile(p_user_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := coalesce(p_user_id, auth.uid());
begin
  if auth.uid() is not null and uid <> auth.uid() then
    raise exception 'You can only read your own profile' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'user_id', d.user_id, 'preferences', d.preferences, 'settings', d.settings,
      'last_login', d.last_login, 'login_count', d.login_count, 'created_at', d.created_at)
    from public.user_data d where d.user_id = uid
  );
end;
$$;

-- Merges changed profile fields into preferences and records each change in the history.
create or replace function public.update_user_profile_batch(p_updates jsonb, p_reason text default null, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := coalesce(p_user_id, auth.uid());
  k text;
  old_prefs jsonb;
begin
  if uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if auth.uid() is not null and uid <> auth.uid() then
    raise exception 'You can only update your own profile' using errcode = '42501';
  end if;
  insert into public.user_data (user_id) values (uid) on conflict do nothing;
  select preferences into old_prefs from public.user_data where user_id = uid for update;
  for k in select jsonb_object_keys(p_updates) loop
    if old_prefs->>k is distinct from p_updates->>k then
      insert into public.user_profile_history (user_id, field_name, old_value, new_value, reason)
      values (uid, k, old_prefs->>k, p_updates->>k, p_reason);
    end if;
  end loop;
  update public.user_data set preferences = coalesce(preferences, '{}'::jsonb) || p_updates, updated_at = now() where user_id = uid;
  return public.get_user_profile(uid);
end;
$$;

create or replace function public.get_user_profile_history(p_limit integer default 20, p_offset integer default 0)
returns setof public.user_profile_history language sql stable security invoker set search_path = public as $$
  select * from public.user_profile_history where user_id = auth.uid()
  order by created_at desc limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------------------------
-- Heritage data (all private to the owner)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.cultural_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  media_url text,
  media_type text,
  metadata jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('cultural_artifacts');

create table if not exists public.cultural_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  storyteller text,
  date_recorded timestamptz default now(),
  location text,
  themes text[] default '{}',
  language text,
  translation text,
  verification_status text not null default 'unverified',
  verification_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('cultural_stories');

create table if not exists public.traditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  origin text,
  historical_context text,
  modern_application text,
  frequency text,
  participants text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('traditions');

create table if not exists public.celebrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  date_or_season text,
  significance text,
  location text,
  participants text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('celebrations');

create table if not exists public.family_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  contact_info jsonb not null default '{}'::jsonb,
  birth_date date,
  location text,
  notes text,
  related_names text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('family_contacts');

-- Column names mirror the Recipe type in CulturalRecipeBook.tsx (quoted camelCase).
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  origin text,
  "culturalSignificance" text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  "prepTime" integer,
  "cookTime" integer,
  servings integer,
  difficulty text,
  story text,
  tags text[] default '{}',
  rating numeric,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('recipes');

-- Column names mirror the TimelineEvent type in TimelineBuilder.tsx.
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  description text,
  location text,
  people text[] not null default '{}',
  media jsonb not null default '[]'::jsonb,
  category text not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('timeline_events');

-- Results of analysing a user's own raw DNA file (see DNAInsights.tsx).
create table if not exists public.dna_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  insights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
select public._owner_policy('dna_insights');

create table if not exists public.photo_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  photo_path text not null,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
select public._owner_policy('photo_analyses');

create table if not exists public.face_names (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  face_id text not null,
  name text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, face_id)
);
select public._owner_policy('face_names');

-- ---------------------------------------------------------------------------------------------
-- Chat and AI
-- ---------------------------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_idx on public.conversations (user_id, updated_at desc);
select public._owner_policy('conversations');

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "Owner access via conversation" on public.messages;
create policy "Owner access via conversation" on public.messages for all to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- Keep the conversation list sorted by latest activity.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages for each row execute function public.touch_conversation();

create table if not exists public.conversation_summaries (
  session_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  summary text not null,
  summary_type text not null default 'brief',
  message_count integer,
  created_at timestamptz not null default now(),
  primary key (user_id, session_id, summary_type)
);
select public._owner_policy('conversation_summaries');

-- Used by the `chat` Edge Function (service role) and the AI Context Manager.
create table if not exists public.ai_conversation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  conversation_id uuid,
  session_id text,
  message text not null,
  role text not null,
  provider text,
  model text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_conversation_history_idx on public.ai_conversation_history (user_id, conversation_id, created_at);
select public._owner_policy('ai_conversation_history');

create table if not exists public.ai_custom_instructions (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  instructions text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
select public._owner_policy('ai_custom_instructions');

create table if not exists public.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null,
  content_id text,
  content_type text,
  source text,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
select public._owner_policy('ai_embeddings');

-- Semantic search over a user's own embedded content (memory-search function).
-- Older projects have a find_similar_messages with a different result shape; replace it.
drop function if exists public.find_similar_messages(vector, double precision, integer, uuid);
create or replace function public.find_similar_messages(
  p_embedding vector(1536), p_match_threshold float default 0.75, p_match_count integer default 10, p_user_id uuid default null)
returns table (id uuid, content text, content_type text, metadata jsonb, created_at timestamptz, similarity float)
language plpgsql stable security definer set search_path = public, extensions as $$
declare uid uuid := coalesce(p_user_id, auth.uid());
begin
  if auth.uid() is not null and uid <> auth.uid() then raise exception 'Forbidden' using errcode = '42501'; end if;
  return query
    select e.id, e.content, e.content_type, e.metadata, e.created_at, 1 - (e.embedding <=> p_embedding) as similarity
    from public.ai_embeddings e
    where e.user_id = uid and e.embedding is not null and 1 - (e.embedding <=> p_embedding) >= p_match_threshold
    order by e.embedding <=> p_embedding
    limit least(greatest(p_match_count, 1), 50);
end;
$$;

create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  content_length integer not null,
  content_tokens integer not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  source text,
  created_at timestamptz not null default now()
);
alter table public.knowledge_base enable row level security;
drop policy if exists "Signed-in users can read the knowledge base" on public.knowledge_base;
create policy "Signed-in users can read the knowledge base" on public.knowledge_base for select to authenticated using (true);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  response_id text,
  rating integer check (rating between 1 and 5),
  was_helpful boolean,
  categories text[] default '{}',
  comment text,
  created_at timestamptz not null default now()
);
select public._owner_policy('ai_feedback');

create table if not exists public.ai_usage_quotas (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  monthly_token_limit integer,
  tokens_used integer not null default 0,
  period_start date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);
alter table public.ai_usage_quotas enable row level security;
drop policy if exists "Users read their own quota" on public.ai_usage_quotas;
create policy "Users read their own quota" on public.ai_usage_quotas for select using (auth.uid() = user_id);

create or replace function public.track_ai_usage(p_user_id uuid, p_tokens_used integer, p_model text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and p_user_id <> auth.uid() then raise exception 'Forbidden' using errcode = '42501'; end if;
  insert into public.ai_usage_quotas (user_id, tokens_used) values (p_user_id, greatest(p_tokens_used, 0))
  on conflict (user_id) do update set tokens_used = public.ai_usage_quotas.tokens_used + greatest(excluded.tokens_used, 0), updated_at = now();
end;
$$;

create table if not exists public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider_id text,
  success boolean not null default true,
  prompt text,
  request_data jsonb,
  response_data jsonb,
  response_time_ms integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_request_logs_created_idx on public.ai_request_logs (created_at desc);
select public._admin_read_policy('ai_request_logs');

-- Older projects have a materialized view of this name; the app reads a live view instead.
do $$ begin
  if exists (select 1 from pg_matviews where schemaname = 'public' and matviewname = 'model_performance_summary') then
    drop materialized view public.model_performance_summary;
  end if;
end $$;
create or replace view public.model_performance_summary with (security_invoker = true) as
  select provider_id,
         count(*) as total_requests,
         avg(case when success then 1.0 else 0.0 end) as success_rate,
         avg(response_time_ms) as avg_response_time_ms,
         max(created_at) as last_request_at
  from public.ai_request_logs
  where created_at > now() - interval '30 days'
  group by provider_id;

create or replace function public.get_ai_provider_metrics(p_provider_id text, p_days integer default 7)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_admin() then null else jsonb_build_object(
    'total_requests', count(*),
    'success_rate', coalesce(avg(case when success then 1.0 else 0.0 end), 0),
    'avg_response_time', coalesce(avg(response_time_ms), 0))
  end
  from public.ai_request_logs
  where provider_id = p_provider_id and created_at > now() - make_interval(days => greatest(p_days, 1));
$$;

create or replace function public.analyze_conversation(p_session_id text, p_user_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := coalesce(p_user_id, auth.uid());
begin
  if auth.uid() is not null and uid <> auth.uid() then raise exception 'Forbidden' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'message_count', count(*),
      'user_messages', count(*) filter (where role = 'user'),
      'assistant_messages', count(*) filter (where role = 'assistant'),
      'first_message_at', min(created_at),
      'last_message_at', max(created_at))
    from public.ai_conversation_history
    where user_id = uid and (session_id = p_session_id or conversation_id::text = p_session_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Automation
-- ---------------------------------------------------------------------------------------------
-- Holds both the Automation Hub's fields (camelCase, mirroring the Workflow type) and the
-- orchestrator's execution fields (actions/trigger_conditions).
create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  tags text[] not null default '{}',
  "n8nUrl" text,
  "lastRun" timestamptz,
  "nextRun" timestamptz,
  "executionCount" integer not null default 0,
  "successRate" numeric not null default 0,
  "averageExecutionTime" numeric not null default 0,
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  trigger_conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('automation_workflows');

-- Older migrations may have created automation_workflows without the Automation Hub columns.
alter table public.automation_workflows
  add column if not exists description text,
  add column if not exists status text not null default 'draft',
  add column if not exists tags text[] not null default '{}',
  add column if not exists "n8nUrl" text,
  add column if not exists "lastRun" timestamptz,
  add column if not exists "nextRun" timestamptz,
  add column if not exists "executionCount" integer not null default 0,
  add column if not exists "successRate" numeric not null default 0,
  add column if not exists "averageExecutionTime" numeric not null default 0,
  add column if not exists "createdAt" timestamptz,
  add column if not exists "updatedAt" timestamptz;

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null,
  workflow_id uuid references public.automation_workflows(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null,
  results jsonb,
  error text,
  execution_time integer,
  steps_completed integer,
  total_steps integer,
  created_at timestamptz not null default now()
);
alter table public.workflow_executions enable row level security;
drop policy if exists "Users read their own executions" on public.workflow_executions;
create policy "Users read their own executions" on public.workflow_executions for select using (auth.uid() = user_id);

create table if not exists public.notification_templates (
  id text primary key,
  subject text,
  body text not null,
  channel text not null default 'email',
  created_at timestamptz not null default now()
);
alter table public.notification_templates enable row level security;  -- service role only

create table if not exists public.marketing_funnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text,
  stages jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  conversions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public._owner_policy('marketing_funnels');

create table if not exists public.integration_settings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  integration_type text not null,
  url text,
  webhook_url text,
  api_key text,  -- the user's OWN third-party key (e.g. their n8n instance); private to them by RLS
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, integration_type)
);
select public._owner_policy('integration_settings');

-- ---------------------------------------------------------------------------------------------
-- Settings (global, admin-managed)
-- ---------------------------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb,
  category text not null default 'general',
  data_type text not null default 'string',
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "Signed-in users can read settings" on public.app_settings;
create policy "Signed-in users can read settings" on public.app_settings for select to authenticated using (true);

create or replace function public.set_setting(
  setting_key text, setting_value jsonb, setting_category text default 'general',
  setting_data_type text default 'string', user_id_param uuid default null, description_param text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change settings' using errcode = '42501'; end if;
  insert into public.app_settings (key, value, category, data_type, description, updated_by, updated_at)
  values (setting_key, setting_value, setting_category, setting_data_type, description_param, auth.uid(), now())
  on conflict (key) do update set value = excluded.value, category = excluded.category, data_type = excluded.data_type,
    description = coalesce(excluded.description, public.app_settings.description), updated_by = auth.uid(), updated_at = now();
end;
$$;

-- Kept for older clients; provider API keys now live ONLY in Edge Function secrets.
create table if not exists public.ai_service_config (
  service_name text primary key,
  is_active boolean not null default true,
  api_key text,
  updated_at timestamptz not null default now()
);
alter table public.ai_service_config enable row level security;  -- no client access at all

-- ---------------------------------------------------------------------------------------------
-- Analytics, monitoring and logs
-- ---------------------------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id, timestamp desc);
select public._owner_policy('analytics_events');

create table if not exists public.analytics_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  impact text,
  confidence numeric,
  action_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
select public._owner_policy('analytics_insights');

create table if not exists public.error_recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  component text,
  error_message text,
  stack_trace text,
  recovery_strategy text,
  user_agent text,
  timestamp timestamptz not null default now()
);
alter table public.error_recovery_logs enable row level security;
drop policy if exists "Users can report errors" on public.error_recovery_logs;
create policy "Users can report errors" on public.error_recovery_logs for insert to authenticated with check (user_id is null or user_id = auth.uid());
drop policy if exists "Admins can read" on public.error_recovery_logs;
create policy "Admins can read" on public.error_recovery_logs for select to authenticated using (public.is_admin());

create table if not exists public.system_optimization_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  component text,
  status text,
  error text,
  recommendations jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.system_optimization_logs enable row level security;
drop policy if exists "Users can log optimizations" on public.system_optimization_logs;
create policy "Users can log optimizations" on public.system_optimization_logs for insert to authenticated with check (user_id is null or user_id = auth.uid());
drop policy if exists "Admins can read" on public.system_optimization_logs;
create policy "Admins can read" on public.system_optimization_logs for select to authenticated using (public.is_admin());

create table if not exists public.system_health_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text,
  metric_value numeric,
  ts timestamptz not null default now(),
  database_health numeric,
  ai_service_health numeric,
  performance_health numeric,
  user_activity_health numeric,
  active_users integer,
  total_activities integer,
  total_requests integer,
  success_rate numeric,
  avg_response_time numeric,
  connections integer,
  size bigint,
  tables integer,
  metadata jsonb not null default '{}'::jsonb
);
select public._admin_read_policy('system_health_metrics');

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  anomaly_score numeric not null,
  metrics jsonb not null,
  timestamp timestamptz not null default now(),
  resolved boolean not null default false,
  resolution_notes text,
  resolved_at timestamptz
);
select public._admin_read_policy('security_alerts');

create table if not exists public.user_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  activity_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.user_activity_log enable row level security;
drop policy if exists "Users log their own activity" on public.user_activity_log;
create policy "Users log their own activity" on public.user_activity_log for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Admins can read" on public.user_activity_log;
create policy "Admins can read" on public.user_activity_log for select to authenticated using (public.is_admin());

create table if not exists public.function_logs (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  status text not null,
  execution_time integer,
  error text,
  created_at timestamptz not null default now()
);
select public._admin_read_policy('function_logs');

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null,
  timestamp timestamptz not null default now()
);
select public._admin_read_policy('performance_metrics');

-- A one-row table the health-check function can read to prove the database answers.
create table if not exists public.health_check (
  id integer primary key default 1 check (id = 1),
  count integer not null default 0,
  checked_at timestamptz not null default now()
);
insert into public.health_check (id) values (1) on conflict do nothing;
alter table public.health_check enable row level security;
drop policy if exists "Anyone signed in can read" on public.health_check;
create policy "Anyone signed in can read" on public.health_check for select to authenticated using (true);

create or replace function public.get_database_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'size', pg_database_size(current_database()),
    'connections', (select count(*) from pg_stat_activity where datname = current_database()),
    'tables', (select count(*) from information_schema.tables where table_schema = 'public'));
$$;
revoke all on function public.get_database_stats() from public, anon, authenticated;
grant execute on function public.get_database_stats() to service_role;

create or replace function public.get_database_metrics()
returns jsonb language sql stable security definer set search_path = public as $$ select public.get_database_stats(); $$;
revoke all on function public.get_database_metrics() from public, anon, authenticated;
grant execute on function public.get_database_metrics() to service_role;

-- Real maintenance an admin may trigger: refresh planner statistics on the busiest tables.
create or replace function public.optimize_database_performance()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  analyze public.messages;
  analyze public.conversations;
  analyze public.ai_request_logs;
  return jsonb_build_object('status', 'ok', 'analyzed', jsonb_build_array('messages', 'conversations', 'ai_request_logs'), 'at', now());
end;
$$;

-- Marks active workflows that are due (nextRun in the past) so the scheduler can pick them up.
drop function if exists public.process_automation_rules(); -- older projects return void
create or replace function public.process_automation_rules()
returns jsonb language plpgsql security definer set search_path = public as $$
declare due integer;
begin
  select count(*) into due from public.automation_workflows
  where is_active and "nextRun" is not null and "nextRun" <= now() and (auth.uid() is null or user_id = auth.uid());
  return jsonb_build_object('due_workflows', due, 'checked_at', now());
end;
$$;

-- Cleanup of the helper functions used only while creating policies.
drop function if exists public._owner_policy(text);
drop function if exists public._admin_read_policy(text);
