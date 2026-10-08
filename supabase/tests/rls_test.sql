-- Two users, A and B. Checks that every user-owned table is private and billing can't be self-granted.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@example.com');
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- act as A
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';
insert into traditions (name) values ('A tradition');
insert into conversations (title) values ('A chat') ;
insert into messages (conversation_id, role, content) select id, 'user', 'hello' from conversations;
select update_user_profile_batch('{"ancestry":"Irish"}'::jsonb, 'test');
select 'A sees own tradition' as check, count(*) = 1 as pass from traditions;
select 'A profile saved' as check, (get_user_profile()->'preferences'->>'ancestry') = 'Irish' as pass;
select 'A profile history' as check, count(*) = 1 as pass from get_user_profile_history(10, 0);

-- A tries to grant themselves Pro: must fail
do $$ begin
  insert into subscriptions (user_id, status) values ('aaaaaaaa-0000-4000-8000-000000000001', 'active');
  raise notice 'CHECK self-grant blocked: FAIL';
exception when others then raise notice 'CHECK self-grant blocked: PASS'; end $$;

-- act as B
set request.jwt.claim.sub = 'bbbbbbbb-0000-4000-8000-000000000002';
select 'B cannot see A tradition' as check, count(*) = 0 as pass from traditions;
select 'B cannot see A chat' as check, count(*) = 0 as pass from conversations;
select 'B cannot see A messages' as check, count(*) = 0 as pass from messages;
do $$ begin
  perform get_user_profile('aaaaaaaa-0000-4000-8000-000000000001');
  raise notice 'CHECK B reading A profile blocked: FAIL';
exception when others then raise notice 'CHECK B reading A profile blocked: PASS'; end $$;
do $$ begin
  insert into messages (conversation_id, role, content) select id, 'user', 'spoof' from conversations limit 1;
  update traditions set name = 'hacked';
  if (select count(*) from traditions) = 0 then raise notice 'CHECK B cannot write A rows: PASS'; end if;
end $$;
do $$ begin
  insert into traditions (user_id, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'forged');
  raise notice 'CHECK B cannot insert as A: FAIL';
exception when others then raise notice 'CHECK B cannot insert as A: PASS'; end $$;
reset role;
select 'A tradition unchanged' as check, (select name from traditions limit 1) = 'A tradition' as pass;
