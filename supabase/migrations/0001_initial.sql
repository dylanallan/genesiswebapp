-- 1️⃣ Auth-backed users table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2️⃣ Genealogy nodes
create table public.family_nodes (
  id bigserial primary key,
  profile_id uuid references profiles(id),
  person_name text not null,
  birth_date date,
  death_date date,
  metadata jsonb,          -- raw scraped / uploaded facts
  inserted_at timestamptz default now()
);

-- 3️⃣ Parent/child links (graph edges)
create table public.relationships (
  parent_id bigint references family_nodes(id) on delete cascade,
  child_id  bigint references family_nodes(id) on delete cascade,
  constraint relationships_pkey primary key (parent_id, child_id)
);

-- 4️⃣ Source documents (images, PDFs, txt)
create table public.sources (
  id bigserial primary key,
  profile_id uuid references profiles(id),
  storage_path text unique,         -- S3-style path in Supabase Storage
  extracted_text text,
  inserted_at timestamptz default now()
);

-- 5️⃣ Vector embeddings for AI search (pgvector 1536 dims)
create table public.node_embeddings (
  node_id bigint primary key references family_nodes(id) on delete cascade,
  embedding vector(1536)         -- match your OpenAI model dims
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.family_nodes enable row level security;
alter table public.relationships enable row level security;
alter table public.sources enable row level security;
alter table public.node_embeddings enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own family nodes"
  on public.family_nodes for select
  using (auth.uid() = profile_id);

create policy "Users can insert own family nodes"
  on public.family_nodes for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own family nodes"
  on public.family_nodes for update
  using (auth.uid() = profile_id);

create policy "Users can delete own family nodes"
  on public.family_nodes for delete
  using (auth.uid() = profile_id);

create policy "Users can view own relationships"
  on public.relationships for select
  using (
    exists (
      select 1 from public.family_nodes
      where id = parent_id and profile_id = auth.uid()
    )
  );

create policy "Users can insert own relationships"
  on public.relationships for insert
  with check (
    exists (
      select 1 from public.family_nodes
      where id = parent_id and profile_id = auth.uid()
    )
  );

create policy "Users can view own sources"
  on public.sources for select
  using (auth.uid() = profile_id);

create policy "Users can insert own sources"
  on public.sources for insert
  with check (auth.uid() = profile_id);

create policy "Users can view own embeddings"
  on public.node_embeddings for select
  using (
    exists (
      select 1 from public.family_nodes
      where id = node_id and profile_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_family_nodes_profile_id on public.family_nodes(profile_id);
create index idx_family_nodes_person_name on public.family_nodes(person_name);
create index idx_sources_profile_id on public.sources(profile_id);
create index idx_relationships_parent_id on public.relationships(parent_id);
create index idx_relationships_child_id on public.relationships(child_id);

-- Enable vector extension
create extension if not exists vector; 