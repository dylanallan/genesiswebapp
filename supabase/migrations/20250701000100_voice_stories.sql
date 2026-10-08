-- Storage + table used by the voice-story-generator function.
insert into storage.buckets (id, name, public)
values ('voice-stories', 'voice-stories', false)
on conflict (id) do update set public = false;

create table if not exists public.voice_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_text text not null,
  audio_path text,
  duration integer,
  word_count integer,
  voice_name text,
  language text,
  style text,
  tone text,
  audio_format text,
  audio_quality text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists voice_stories_user_idx on public.voice_stories (user_id, created_at desc);
alter table public.voice_stories enable row level security;
drop policy if exists "Users read their own stories" on public.voice_stories;
create policy "Users read their own stories" on public.voice_stories for select using (auth.uid() = user_id);
drop policy if exists "Users delete their own stories" on public.voice_stories;
create policy "Users delete their own stories" on public.voice_stories for delete using (auth.uid() = user_id);

-- Owners may read their own audio files (folder name = user id); only the service role writes.
drop policy if exists "Users read their own voice files" on storage.objects;
create policy "Users read their own voice files" on storage.objects for select
  using (bucket_id = 'voice-stories' and (storage.foldername(name))[1] = auth.uid()::text);
