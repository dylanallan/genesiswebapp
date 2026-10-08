-- Minimal stand-ins for what Supabase provides, so migrations can be tested on plain Postgres.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$; do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
create schema auth; create schema storage; create schema extensions;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role', true) $$;
create table storage.buckets (id text primary key, name text, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
create domain extensions.vector as real[];
create function extensions.vdist(a real[], b real[]) returns float language sql immutable as $$ select 0.5::float $$;
create operator extensions.<=> (leftarg = real[], rightarg = real[], function = extensions.vdist);
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
grant usage on schema public, auth, extensions to anon, authenticated, service_role;
