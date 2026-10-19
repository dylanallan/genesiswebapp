-- Weekly story questions: one question opens each week; the relative answers without an account; strangers see nothing.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('5e5e5e5e-0000-4000-8000-000000000031', 'grandkid@example.com'),
  ('5e5e5e5e-0000-4000-8000-000000000032', 'snoop@example.com');
grant select, insert, update, delete on all tables in schema public to authenticated;

set role authenticated;
set request.jwt.claim.sub = '5e5e5e5e-0000-4000-8000-000000000031';
insert into story_series (from_name, relative_name, questions, start_on, token)
  values ('Léa', 'Mamie Rose', array['Where did you grow up?', 'What was your first job?', 'How did you meet Papi?'], current_date - 8, 'weeklytoken-aaaaaaaaaaaaaaaaaaaa');
insert into story_series (from_name, relative_name, questions, token)
  values ('Léa', 'Papi', array['Q1', 'Q2'], 'weeklytoken-bbbbbbbbbbbbbbbbbbbb');
do $$ begin
  insert into story_series (from_name, relative_name, questions) values ('Léa', 'Too many', array_fill('Q'::text, array[61]));
  raise notice 'CHECK at most 60 questions: FAIL';
exception when others then raise notice 'CHECK at most 60 questions: PASS'; end $$;
reset role;

set role anon;
select 'two questions are open after 8 days' as check,
  jsonb_array_length(get_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa')->'questions') = 2
  and (get_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa')->>'total')::int = 3
  and (get_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa')->>'next_on')::date = current_date + 6 as pass;
select 'only the first question is open on day one' as check,
  get_story_series('weeklytoken-bbbbbbbbbbbbbbbbbbbb')->'questions' = '["Q1"]'::jsonb as pass;
select 'the third question stays hidden' as check, not (get_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa')::text like '%meet Papi%') as pass;
select 'relative answers without an account' as check, answer_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa', 1, 'At the paper mill in Jonquière.') as pass;
select 'answering again replaces the answer' as check, answer_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa', 1, 'At the paper mill in Kénogami.') as pass;
select 'answered question is listed' as check, get_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa')->'answered' = '[1]'::jsonb as pass;
do $$ begin
  perform answer_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa', 2, 'Too early');
  raise notice 'CHECK a question cannot be answered before it opens: FAIL';
exception when others then raise notice 'CHECK a question cannot be answered before it opens: PASS'; end $$;
do $$ begin
  perform answer_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa', 0, '   ');
  raise notice 'CHECK empty answers refused: FAIL';
exception when others then raise notice 'CHECK empty answers refused: PASS'; end $$;
select 'a wrong or short link shows nothing' as check, get_story_series('nope') is null and get_story_series('weeklytoken-zzzzzzzzzzzzzzzzzzzz') is null as pass;
do $$ begin
  perform 1 from story_series;
  raise notice 'CHECK visitors cannot read series: FAIL';
exception when insufficient_privilege then raise notice 'CHECK visitors cannot read series: PASS'; end $$;
reset role;

select 'the answer is saved once, as a family story' as check,
  (select count(*) = 1 and bool_and(content = 'At the paper mill in Kénogami.' and storyteller = 'Mamie Rose'
     and user_id = '5e5e5e5e-0000-4000-8000-000000000031' and verification_details->>'source' = 'weekly-questions')
   from cultural_stories where title = 'What was your first job?') as pass;

set role authenticated;
set request.jwt.claim.sub = '5e5e5e5e-0000-4000-8000-000000000032';
select 'others cannot see the series or answers' as check, (select count(*) = 0 from story_series) and (select count(*) = 0 from story_series_answers) as pass;
do $$ begin
  insert into story_series_answers (series_id, question_index, story_id) values ((select id from story_series limit 1), 0, gen_random_uuid());
  raise notice 'CHECK answers cannot be forged: FAIL';
exception when others then raise notice 'CHECK answers cannot be forged: PASS'; end $$;

set request.jwt.claim.sub = '5e5e5e5e-0000-4000-8000-000000000031';
select 'the sender sees progress' as check, (select count(*) = 1 from story_series_answers) as pass;
update story_series set closed_at = now() where token = 'weeklytoken-aaaaaaaaaaaaaaaaaaaa';
reset role;
set role anon;
do $$ begin
  perform answer_story_series('weeklytoken-aaaaaaaaaaaaaaaaaaaa', 0, 'Late');
  raise notice 'CHECK a closed link takes no answers: FAIL';
exception when others then raise notice 'CHECK a closed link takes no answers: PASS'; end $$;
reset role;
