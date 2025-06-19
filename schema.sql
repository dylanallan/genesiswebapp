-- Unified Supabase Schema for Genesis Web App

-- === User Data Table ===
create table if not exists public.user_data (
  user_id uuid primary key,
  preferences jsonb,
  settings jsonb,
  last_login timestamptz,
  login_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === User Profiles Table ===
create table if not exists public.user_profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  ancestry text,
  business_goals text,
  cultural_background text,
  location text,
  timezone text,
  language text,
  onboarding_completed boolean,
  preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Celebrations Table ===
create table if not exists public.celebrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  description text,
  date_or_season text,
  significance text,
  location text,
  participants text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Traditions Table ===
create table if not exists public.traditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  description text,
  origin text,
  historical_context text,
  modern_application text,
  frequency text,
  participants text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Cultural Stories Table ===
create table if not exists public.cultural_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  title text not null,
  content text not null,
  storyteller text,
  date_recorded text,
  location text,
  themes text[],
  language text,
  translation text,
  verification_status text,
  verification_details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Cultural Artifacts Table ===
create table if not exists public.cultural_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  title text not null,
  description text,
  category text not null,
  media_url text,
  media_type text,
  metadata jsonb,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  fts tsvector
);

-- === Family Contacts Table ===
create table if not exists public.family_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  relationship text,
  contact_info jsonb,
  birth_date text,
  location text,
  notes text,
  related_names text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Recipes Table ===
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  description text,
  ingredients jsonb,
  instructions jsonb,
  cultural_significance text,
  origin text,
  serving_size integer,
  preparation_time text,
  difficulty_level text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Timeline Events Table ===
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  title text not null,
  description text,
  event_date text not null,
  location text,
  people text[],
  category text,
  media_urls text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Automation Workflows Table ===
create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id),
  name text not null,
  trigger_conditions jsonb not null,
  actions jsonb not null,
  is_active boolean,
  metrics jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === AI Models Table ===
create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  capabilities text[],
  context_window integer,
  api_endpoint text not null,
  api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === Security Alerts Table ===
create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  anomaly_score numeric not null,
  metrics jsonb not null,
  timestamp timestamptz default now(),
  resolved boolean,
  resolution_notes text,
  resolved_at timestamptz
);

-- === Admin Roles Table ===
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  role_name text not null default 'admin',
  permissions jsonb default '{"full_access": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- === System Health Metrics Table ===
create table if not exists public.system_health_metrics (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz default now(),
  metric_name text not null,
  metric_value numeric,
  metadata jsonb
);

-- === Add any other tables your app expects here ===

-- === Enable Row Level Security (RLS) where needed ===
alter table public.user_data enable row level security;
alter table public.admin_roles enable row level security;
alter table public.security_alerts enable row level security;

-- === Example RLS Policy for admin_roles (admins only) ===
create policy if not exists "Admins can manage admin roles"
  on public.admin_roles
  for all
  to authenticated
  using ((auth.jwt() ->> 'role')::text = 'admin');

-- === You can add more RLS policies as needed === 