-- "Ask a relative": a private link a relative opens with no account to answer memory questions. Add-only.
-- The link holds a long random token. Through it a relative can only read the questions and add answers; each answer
-- becomes a story in the sender's family, credited to the relative. Only the sender can see or manage the request.
create table if not exists public.memory_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token text not null default (substr(md5(gen_random_uuid()::text), 1, 16) || substr(md5(gen_random_uuid()::text), 1, 16)),
  from_name text not null,
  relative_name text not null,
  family_member_id uuid references public.family_members(id) on delete set null,
  questions text[] not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint memory_requests_questions_count check (cardinality(questions) between 1 and 12)
);
create unique index if not exists memory_requests_token_key on public.memory_requests (token);
create index if not exists memory_requests_user_idx on public.memory_requests (user_id, created_at desc);
alter table public.memory_requests enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memory_requests' and policyname = 'Owners manage their memory requests') then
    create policy "Owners manage their memory requests" on public.memory_requests for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
revoke all on public.memory_requests from anon;

-- Which question each answer was for, so the relative sees what's done and a second answer replaces the first.
create table if not exists public.memory_answers (
  request_id uuid not null references public.memory_requests(id) on delete cascade,
  question_index integer not null,
  story_id uuid not null references public.cultural_stories(id) on delete cascade,
  answered_at timestamptz not null default now(),
  primary key (request_id, question_index)
);
alter table public.memory_answers enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memory_answers' and policyname = 'Owners read their memory answers') then
    create policy "Owners read their memory answers" on public.memory_answers for select to authenticated
      using (exists (select 1 from public.memory_requests r where r.id = request_id and r.user_id = auth.uid()));
  end if;
end $$;
revoke all on public.memory_answers from anon;
revoke insert, update, delete on public.memory_answers from authenticated;

-- What the relative's page shows. Nothing about the family beyond the sender's chosen name and the questions.
create or replace function public.get_memory_request(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when r.id is null then null else jsonb_build_object(
    'from_name', r.from_name,
    'relative_name', r.relative_name,
    'questions', to_jsonb(r.questions),
    'answered', coalesce((select jsonb_agg(a.question_index order by a.question_index) from public.memory_answers a where a.request_id = r.id), '[]'::jsonb),
    'closed', r.closed_at is not null)
  end
  from (select 1) one left join public.memory_requests r on r.token = p_token and length(coalesce(p_token, '')) >= 24;
$$;
revoke all on function public.get_memory_request(text) from public;
grant execute on function public.get_memory_request(text) to anon, authenticated, service_role;

create or replace function public.answer_memory_request(p_token text, p_index integer, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.memory_requests;
  answer text := trim(coalesce(p_text, ''));
  existing uuid;
  new_story uuid;
begin
  select * into r from public.memory_requests where token = p_token and length(coalesce(p_token, '')) >= 24 for update;
  if r.id is null or r.closed_at is not null then raise exception 'This link is no longer open.'; end if;
  if p_index is null or p_index < 0 or p_index >= cardinality(r.questions) then raise exception 'That question is not part of this request.'; end if;
  if answer = '' then raise exception 'Please write or say an answer first.'; end if;
  if length(answer) > 20000 then raise exception 'That answer is too long. Please split it into two.'; end if;
  -- Against misuse of a leaked link: at most 100 answers (including changes) a day per request.
  if (select count(*) from public.memory_answers where request_id = r.id and answered_at > now() - interval '1 day') >= 100 then
    raise exception 'Lots of answers today. Please try again tomorrow.';
  end if;

  select story_id into existing from public.memory_answers where request_id = r.id and question_index = p_index;
  if existing is not null then
    update public.cultural_stories set content = answer, updated_at = now() where id = existing and user_id = r.user_id;
    update public.memory_answers set answered_at = now() where request_id = r.id and question_index = p_index;
    return true;
  end if;

  insert into public.cultural_stories (user_id, title, content, storyteller, family_member_id, verification_details)
  values (r.user_id, left(r.questions[p_index + 1], 200), answer, r.relative_name, r.family_member_id,
          jsonb_build_object('source', 'ask-a-relative', 'request_id', r.id))
  returning id into new_story;
  insert into public.memory_answers (request_id, question_index, story_id) values (r.id, p_index, new_story);
  return true;
end;
$$;
revoke all on function public.answer_memory_request(text, integer, text) from public;
grant execute on function public.answer_memory_request(text, integer, text) to anon, authenticated, service_role;
