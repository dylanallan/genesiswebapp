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

-- 6️⃣ Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.family_nodes enable row level security;
alter table public.relationships enable row level security;
alter table public.sources enable row level security;
alter table public.node_embeddings enable row level security;

-- 7️⃣ RLS Policies
-- Profiles: users can only see their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Family nodes: users can only see their own family tree
create policy "Users can view own family nodes" on public.family_nodes
  for select using (auth.uid() = profile_id);

create policy "Users can insert own family nodes" on public.family_nodes
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own family nodes" on public.family_nodes
  for update using (auth.uid() = profile_id);

create policy "Users can delete own family nodes" on public.family_nodes
  for delete using (auth.uid() = profile_id);

-- Relationships: users can only see relationships in their family tree
create policy "Users can view own relationships" on public.relationships
  for select using (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = relationships.parent_id and fn.profile_id = auth.uid()
    )
  );

create policy "Users can insert own relationships" on public.relationships
  for insert with check (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = relationships.parent_id and fn.profile_id = auth.uid()
    )
  );

create policy "Users can delete own relationships" on public.relationships
  for delete using (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = relationships.parent_id and fn.profile_id = auth.uid()
    )
  );

-- Sources: users can only see their own documents
create policy "Users can view own sources" on public.sources
  for select using (auth.uid() = profile_id);

create policy "Users can insert own sources" on public.sources
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own sources" on public.sources
  for update using (auth.uid() = profile_id);

create policy "Users can delete own sources" on public.sources
  for delete using (auth.uid() = profile_id);

-- Node embeddings: users can only see embeddings for their family nodes
create policy "Users can view own node embeddings" on public.node_embeddings
  for select using (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = node_embeddings.node_id and fn.profile_id = auth.uid()
    )
  );

create policy "Users can insert own node embeddings" on public.node_embeddings
  for insert with check (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = node_embeddings.node_id and fn.profile_id = auth.uid()
    )
  );

create policy "Users can update own node embeddings" on public.node_embeddings
  for update using (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = node_embeddings.node_id and fn.profile_id = auth.uid()
    )
  );

create policy "Users can delete own node embeddings" on public.node_embeddings
  for delete using (
    exists (
      select 1 from public.family_nodes fn
      where fn.id = node_embeddings.node_id and fn.profile_id = auth.uid()
    )
  );

-- 8️⃣ Indexes for performance
create index idx_family_nodes_profile_id on public.family_nodes(profile_id);
create index idx_family_nodes_person_name on public.family_nodes(person_name);
create index idx_sources_profile_id on public.sources(profile_id);
create index idx_sources_storage_path on public.sources(storage_path);

-- 9️⃣ Functions for common operations
-- Function to get family tree for a user
create or replace function public.get_family_tree(user_profile_id uuid)
returns table (
  node_id bigint,
  person_name text,
  birth_date date,
  death_date date,
  metadata jsonb
) as $$
begin
  return query
  select fn.id, fn.person_name, fn.birth_date, fn.death_date, fn.metadata
  from public.family_nodes fn
  where fn.profile_id = user_profile_id
  order by fn.person_name;
end;
$$ language plpgsql security definer;

-- Function to search family members by name
create or replace function public.search_family_members(
  user_profile_id uuid,
  search_term text
)
returns table (
  node_id bigint,
  person_name text,
  birth_date date,
  death_date date,
  metadata jsonb
) as $$
begin
  return query
  select fn.id, fn.person_name, fn.birth_date, fn.death_date, fn.metadata
  from public.family_nodes fn
  where fn.profile_id = user_profile_id
    and fn.person_name ilike '%' || search_term || '%'
  order by fn.person_name;
end;
$$ language plpgsql security definer;

-- 10️⃣ Triggers for automatic profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 