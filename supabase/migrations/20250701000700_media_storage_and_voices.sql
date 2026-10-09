-- Private storage for user media. Every file lives under a folder named after its owner's user id,
-- and only that user can read, add or delete it. Files are shared through short-lived signed URLs.
insert into storage.buckets (id, name, public) values
  ('media-uploads', 'media-uploads', false),
  ('family-photos', 'family-photos', false),
  ('voice-recordings', 'voice-recordings', false),
  ('voice-samples', 'voice-samples', false)
on conflict (id) do update set public = false;

drop policy if exists "Owners read their media" on storage.objects;
create policy "Owners read their media" on storage.objects for select to authenticated
  using (bucket_id in ('media-uploads', 'family-photos', 'voice-recordings', 'voice-samples', 'voice-stories')
         and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Owners upload their media" on storage.objects;
create policy "Owners upload their media" on storage.objects for insert to authenticated
  with check (bucket_id in ('media-uploads', 'family-photos', 'voice-recordings', 'voice-samples')
              and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Owners update their media" on storage.objects;
create policy "Owners update their media" on storage.objects for update to authenticated
  using (bucket_id in ('media-uploads', 'family-photos', 'voice-recordings', 'voice-samples')
         and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Owners delete their media" on storage.objects;
create policy "Owners delete their media" on storage.objects for delete to authenticated
  using (bucket_id in ('media-uploads', 'family-photos', 'voice-recordings', 'voice-samples', 'voice-stories')
         and (storage.foldername(name))[1] = auth.uid()::text);
-- (replaces the narrower policy from the voice_stories migration)
drop policy if exists "Users read their own voice files" on storage.objects;

-- Preserved voices of family members (created with the speaker's consent via the voice-clone function).
create table if not exists public.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  sample_path text not null,            -- voice-samples/<user id>/...
  provider text not null default 'elevenlabs',
  provider_voice_id text,               -- id at the voice provider; deleted there when the profile is deleted
  consent_statement text not null,      -- what the user confirmed, kept for the record
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.voice_profiles enable row level security;
drop policy if exists "Users read their own voices" on public.voice_profiles;
create policy "Users read their own voices" on public.voice_profiles for select to authenticated using (auth.uid() = user_id);
-- Created and deleted only by the voice-clone function (it also talks to the voice provider).
