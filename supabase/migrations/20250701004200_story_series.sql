-- Weekly story questions: one link for a relative that unlocks a new question each week (up to a year's worth).
-- No account needed; answers are saved to the sender's family stories, ready for the family storybook.
-- Works like Ask a relative (memory_requests), in its own tables so the 12-question limit there stays as it is.

create table if not exists public.story_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token text not null default (substr(md5(gen_random_uuid()::text), 1, 16) || substr(md5(gen_random_uuid()::text), 1, 16)),
  from_name text not null check (length(trim(from_name)) between 1 and 80),
  relative_name text not null check (length(trim(relative_name)) between 1 and 80),
  family_member_id uuid references public.family_members(id) on delete set null,
  questions text[] not null check (cardinality(questions) between 1 and 60),
  start_on date not null default current_date,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index if not exists story_series_token_key on public.story_series (token);
create index if not exists story_series_user_idx on public.story_series (user_id, created_at desc);
create index if not exists story_series_member_idx on public.story_series (family_member_id);
alter table public.story_series enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'story_series' and policyname = 'Owners manage their story series') then
    create policy "Owners manage their story series" on public.story_series for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.story_series from anon;

create table if not exists public.story_series_answers (
  series_id uuid not null references public.story_series(id) on delete cascade,
  question_index integer not null,
  story_id uuid not null references public.cultural_stories(id) on delete cascade,
  answered_at timestamptz not null default now(),
  primary key (series_id, question_index)
);
create index if not exists story_series_answers_story_idx on public.story_series_answers (story_id);
alter table public.story_series_answers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'story_series_answers' and policyname = 'Owners read their series answers') then
    create policy "Owners read their series answers" on public.story_series_answers for select to authenticated
      using (exists (select 1 from public.story_series s where s.id = series_id and s.user_id = (select auth.uid())));
  end if;
end $$;
revoke all on public.story_series_answers from anon;
revoke insert, update, delete on public.story_series_answers from authenticated;

-- How many questions are open: the first on the start day, then one more every 7 days.
create or replace function public._series_released(p_start date, p_total integer)
returns integer language sql immutable as $$
  select least(p_total, greatest(0, 1 + floor((current_date - p_start) / 7.0)::integer));
$$;
revoke all on function public._series_released(date, integer) from public, anon, authenticated;

-- What the relative's page shows: only the questions open so far, and when the next one opens.
create or replace function public.get_story_series(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.story_series;
  n integer;
  total integer;
begin
  if length(coalesce(p_token, '')) < 24 then return null; end if;
  select * into s from public.story_series where token = p_token;
  if not found then return null; end if;
  total := cardinality(s.questions);
  n := public._series_released(s.start_on, total);
  return jsonb_build_object(
    'from_name', s.from_name,
    'relative_name', s.relative_name,
    'questions', coalesce(to_jsonb(s.questions[1:n]), '[]'::jsonb),
    'total', total,
    'next_on', case when n < total then s.start_on + n * 7 end,
    'answered', coalesce((select jsonb_agg(a.question_index order by a.question_index) from public.story_series_answers a where a.series_id = s.id), '[]'::jsonb),
    'closed', s.closed_at is not null);
end;
$$;
revoke all on function public.get_story_series(text) from public;
grant execute on function public.get_story_series(text) to anon, authenticated, service_role;

create or replace function public.answer_story_series(p_token text, p_index integer, p_text text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  s public.story_series;
  answer text := trim(coalesce(p_text, ''));
  existing uuid;
  new_story uuid;
begin
  select * into s from public.story_series where token = p_token and length(coalesce(p_token, '')) >= 24 for update;
  if s.id is null or s.closed_at is not null then raise exception 'This link is no longer open.'; end if;
  if p_index is null or p_index < 0 or p_index >= public._series_released(s.start_on, cardinality(s.questions)) then
    raise exception 'That question is not part of this request.';
  end if;
  if answer = '' then raise exception 'Please write or say an answer first.'; end if;
  if length(answer) > 20000 then raise exception 'That answer is too long. Please split it into two.'; end if;
  -- Against misuse of a leaked link: at most 100 answers (including changes) a day per series.
  if (select count(*) from public.story_series_answers where series_id = s.id and answered_at > now() - interval '1 day') >= 100 then
    raise exception 'Lots of answers today. Please try again tomorrow.';
  end if;

  select story_id into existing from public.story_series_answers where series_id = s.id and question_index = p_index;
  if existing is not null then
    update public.cultural_stories set content = answer, updated_at = now() where id = existing and user_id = s.user_id;
    update public.story_series_answers set answered_at = now() where series_id = s.id and question_index = p_index;
    return true;
  end if;

  insert into public.cultural_stories (user_id, title, content, storyteller, family_member_id, verification_details)
  values (s.user_id, left(s.questions[p_index + 1], 200), answer, s.relative_name, s.family_member_id,
          jsonb_build_object('source', 'weekly-questions', 'series_id', s.id))
  returning id into new_story;
  insert into public.story_series_answers (series_id, question_index, story_id) values (s.id, p_index, new_story);
  return true;
end;
$$;
revoke all on function public.answer_story_series(text, integer, text) from public;
grant execute on function public.answer_story_series(text, integer, text) to anon, authenticated, service_role;
