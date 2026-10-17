-- Family sharing: invite -> accept -> read-only or contributor access; strangers see nothing.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('eeeeeeee-0000-4000-8000-000000000005', 'owner@example.com'),
  ('ffffffff-0000-4000-8000-000000000006', 'cousin@example.com'),
  ('abababab-0000-4000-8000-000000000007', 'stranger@example.com');
grant select, insert, update, delete on all tables in schema public to authenticated;

set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into family_members (first_name, last_name) values ('Rosa', 'Vega');
insert into family_shares (invitee_name, role, token) values ('Cousin Ana', 'viewer', 'tok-viewer');
do $$ begin
  perform accept_family_invite('tok-viewer');
  raise notice 'CHECK owner cannot accept own invite: FAIL';
exception when others then raise notice 'CHECK owner cannot accept own invite: PASS'; end $$;

set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
do $$ begin
  perform shared_family_snapshot('eeeeeeee-0000-4000-8000-000000000005');
  raise notice 'CHECK stranger cannot read family: FAIL';
exception when others then raise notice 'CHECK stranger cannot read family: PASS'; end $$;
select 'stranger cannot list invites' as check, count(*) = 0 as pass from family_shares;
do $$ begin
  perform add_shared_story('eeeeeeee-0000-4000-8000-000000000005', 'Spam', 'Not my family');
  raise notice 'CHECK stranger cannot add stories: FAIL';
exception when others then raise notice 'CHECK stranger cannot add stories: PASS'; end $$;
do $$ begin
  perform preview_family_invite('no-such-token');
  raise notice 'CHECK unknown invite preview refused: FAIL';
exception when others then raise notice 'CHECK unknown invite preview refused: PASS'; end $$;

set request.jwt.claim.sub = 'ffffffff-0000-4000-8000-000000000006';
select 'cousin previews invite' as check, (preview_family_invite('tok-viewer')->>'role') = 'viewer' as pass;
select 'cousin accepts invite' as check, (accept_family_invite('tok-viewer')->>'role') = 'viewer' as pass;
select 'cousin sees the family' as check, jsonb_array_length(shared_family_snapshot('eeeeeeee-0000-4000-8000-000000000005')->'members') = 1 as pass;
select 'shared family listed' as check, count(*) = 1 as pass from my_shared_families();
select 'cousin cannot read tree table directly' as check, count(*) = 0 as pass from family_members;
do $$ begin
  perform add_shared_story('eeeeeeee-0000-4000-8000-000000000005', 'Hi', 'A memory');
  raise notice 'CHECK viewer cannot add stories: FAIL';
exception when others then raise notice 'CHECK viewer cannot add stories: PASS'; end $$;

set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
do $$ begin
  perform accept_family_invite('tok-viewer');
  raise notice 'CHECK used invite cannot be reused: FAIL';
exception when others then raise notice 'CHECK used invite cannot be reused: PASS'; end $$;

set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into family_shares (member_id, status, token) values ('abababab-0000-4000-8000-000000000007', 'active', 'tok-forced');
select 'owner cannot attach a member directly' as check, member_id is null and status = 'pending' as pass from family_shares where token = 'tok-forced';
do $$ begin
  update family_shares set member_id = 'abababab-0000-4000-8000-000000000007', status = 'active' where token = 'tok-forced';
  raise notice 'CHECK owner cannot activate an invite: FAIL';
exception when others then raise notice 'CHECK owner cannot activate an invite: PASS'; end $$;
update family_shares set role = 'contributor' where token = 'tok-viewer';
set request.jwt.claim.sub = 'ffffffff-0000-4000-8000-000000000006';
select 'contributor adds a story' as check, add_shared_story('eeeeeeee-0000-4000-8000-000000000005', 'Summer 1965', 'We picked peaches.') is not null as pass;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
select 'owner owns the contributed story' as check, count(*) = 1 as pass from cultural_stories where title = 'Summer 1965';
update family_shares set status = 'revoked' where token = 'tok-viewer';
set request.jwt.claim.sub = 'ffffffff-0000-4000-8000-000000000006';
do $$ begin
  perform shared_family_snapshot('eeeeeeee-0000-4000-8000-000000000005');
  raise notice 'CHECK revoked access is gone: FAIL';
exception when others then raise notice 'CHECK revoked access is gone: PASS'; end $$;

set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
select 'export has my tree' as check, jsonb_array_length(export_my_data()->'family_members') = 1 as pass;
select 'export excludes others' as check, not (export_my_data() ? 'family_shares') or
  (select bool_and((x->>'owner_id') = 'eeeeeeee-0000-4000-8000-000000000005') from jsonb_array_elements(export_my_data()->'family_shares') x) as pass;
reset role;

-- Adding parents from the tree chart is one safe step, even when done twice quickly.
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into family_members (id, first_name, last_name, birth_date) values ('aaaa0000-0000-4000-8000-000000000001', 'Kid', 'Vega', '1990-01-01');
insert into family_members (id, first_name, last_name, parent_ids) values ('aaaa0000-0000-4000-8000-000000000002', 'Sibling', 'Vega', '{}');
select add_parent('aaaa0000-0000-4000-8000-000000000001', 'father', 'Juan', null, 'Vega', '1950-01-01');
select add_parent('aaaa0000-0000-4000-8000-000000000001', 'mother', 'Ana', null, 'López', null);
select 'child keeps both parents' as check, array_length(parent_ids, 1) = 2 as pass from family_members where id = 'aaaa0000-0000-4000-8000-000000000001';
select 'parents linked as spouses' as check, count(*) = 2 as pass from family_members where first_name in ('Juan', 'Ana') and array_length(spouse_ids, 1) = 1;
select 'recent parent stays living' as check, is_living as pass from family_members where first_name = 'Juan';
do $$ begin
  perform add_parent('aaaa0000-0000-4000-8000-000000000001', 'father', 'Third', null, 'Parent');
  raise notice 'CHECK no third parent: FAIL';
exception when others then raise notice 'CHECK no third parent: PASS'; end $$;
set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
do $$ begin
  perform add_parent('aaaa0000-0000-4000-8000-000000000001', 'mother', 'Sneaky', null, 'Stranger');
  raise notice 'CHECK cannot add parents to someone else''s tree: FAIL';
exception when others then raise notice 'CHECK cannot add parents to someone else''s tree: PASS'; end $$;
reset role;

-- Error reports: people can add their own (capped), cannot write directly, and cannot read anyone's.
set role authenticated;
set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
select 'error report accepted' as check, report_client_error('Boom', 'at x', '/dashboard', 'test') as pass;
select 'same error not repeated' as check, report_client_error('Boom', 'at x', '/dashboard', 'test') = false as pass;
select 'non-admin cannot read error reports' as check, count(*) = 0 as pass from client_errors;
do $$ begin
  insert into client_errors (user_id, message) values ('abababab-0000-4000-8000-000000000007', 'forged');
  raise notice 'CHECK direct error insert blocked: FAIL';
exception when others then raise notice 'CHECK direct error insert blocked: PASS'; end $$;
reset role;
select 'error report stored once' as check, count(*) = 1 as pass from client_errors where message = 'Boom';

-- Guided merge: links and stories move to the kept person, the duplicate can be removed, and undo restores everything.
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into family_members (id, first_name, last_name, birth_date) values
  ('cdcd0000-0000-4000-8000-000000000001', 'Juana', 'Perez', '1920-05-01'),
  ('cdcd0000-0000-4000-8000-000000000002', 'Juana', 'Pérez', null),
  ('cdcd0000-0000-4000-8000-000000000003', 'Child', 'Perez', '1950-01-01'),
  ('cdcd0000-0000-4000-8000-000000000004', 'Husband', 'Perez', null);
update family_members set parent_ids = array['cdcd0000-0000-4000-8000-000000000002']::uuid[] where id = 'cdcd0000-0000-4000-8000-000000000003';
update family_members set spouse_ids = array['cdcd0000-0000-4000-8000-000000000002']::uuid[] where id = 'cdcd0000-0000-4000-8000-000000000004';
update family_members set spouse_ids = array['cdcd0000-0000-4000-8000-000000000004']::uuid[], children_ids = array['cdcd0000-0000-4000-8000-000000000003']::uuid[], birth_location = 'Oaxaca' where id = 'cdcd0000-0000-4000-8000-000000000002';
insert into cultural_stories (title, content, family_member_id) values ('Juana''s kitchen', 'She made tamales.', 'cdcd0000-0000-4000-8000-000000000002');
insert into saved_records (user_id, source, source_id, url, title, family_member_id) values ('eeeeeeee-0000-4000-8000-000000000005', 'test', 't1', 'https://example.org/1', 'Juana baptism', 'cdcd0000-0000-4000-8000-000000000002');
select merge_family_members('cdcd0000-0000-4000-8000-000000000001', 'cdcd0000-0000-4000-8000-000000000002', '{"last_name": "Pérez", "birth_location": "Oaxaca"}'::jsonb);
select 'merge moves the child' as check, parent_ids = array['cdcd0000-0000-4000-8000-000000000001']::uuid[] as pass from family_members where id = 'cdcd0000-0000-4000-8000-000000000003';
select 'merge moves the spouse' as check, spouse_ids = array['cdcd0000-0000-4000-8000-000000000001']::uuid[] as pass from family_members where id = 'cdcd0000-0000-4000-8000-000000000004';
select 'kept person gets links and chosen details' as check,
  spouse_ids = array['cdcd0000-0000-4000-8000-000000000004']::uuid[] and children_ids = array['cdcd0000-0000-4000-8000-000000000003']::uuid[]
  and last_name = 'Pérez' and birth_location = 'Oaxaca' and birth_date = '1920-05-01' as pass
  from family_members where id = 'cdcd0000-0000-4000-8000-000000000001';
select 'merge moves stories' as check, family_member_id = 'cdcd0000-0000-4000-8000-000000000001' as pass from cultural_stories where title = 'Juana''s kitchen';
select 'merge moves saved records' as check, family_member_id = 'cdcd0000-0000-4000-8000-000000000001' as pass from saved_records where title = 'Juana baptism';
delete from family_members where id = 'cdcd0000-0000-4000-8000-000000000002';
select undo_family_merge((select id from family_merges order by created_at desc limit 1));
select 'undo brings the duplicate back' as check, count(*) = 1 as pass from family_members where id = 'cdcd0000-0000-4000-8000-000000000002' and birth_location = 'Oaxaca';
select 'undo restores the child link' as check, parent_ids = array['cdcd0000-0000-4000-8000-000000000002']::uuid[] as pass from family_members where id = 'cdcd0000-0000-4000-8000-000000000003';
select 'undo restores the kept person' as check, last_name = 'Perez' and birth_location is null and coalesce(cardinality(spouse_ids), 0) = 0 as pass from family_members where id = 'cdcd0000-0000-4000-8000-000000000001';
select 'undo moves stories back' as check, family_member_id = 'cdcd0000-0000-4000-8000-000000000002' as pass from cultural_stories where title = 'Juana''s kitchen';
select 'undo moves saved records back' as check, family_member_id = 'cdcd0000-0000-4000-8000-000000000002' as pass from saved_records where title = 'Juana baptism';
do $$ begin
  perform undo_family_merge((select id from family_merges order by created_at desc limit 1));
  raise notice 'CHECK cannot undo twice: FAIL';
exception when others then raise notice 'CHECK cannot undo twice: PASS'; end $$;
set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
do $$ begin
  perform merge_family_members('cdcd0000-0000-4000-8000-000000000001', 'cdcd0000-0000-4000-8000-000000000003', '{}'::jsonb);
  raise notice 'CHECK stranger cannot merge: FAIL';
exception when others then raise notice 'CHECK stranger cannot merge: PASS'; end $$;
reset role;

-- Security hardening: a signed-in person can't search everyone's AI conversations. The test files grant every
-- function to signed-in users first (like Supabase's defaults), so the hardening is applied again on top, as it is live.
reset role;
\ir ../migrations/20250701002400_security_hardening.sql
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
do $$ begin
  perform public.find_similar_messages(null, 0.5, 5, null);
  raise notice 'CHECK conversation search blocked for users: FAIL';
exception when insufficient_privilege then raise notice 'CHECK conversation search blocked for users: PASS'; end $$;
reset role;

-- Waitlist: visitors can join (once), get a referral code, and can't read or change the list.
set role anon;
select 'waitlist rejects a bad email' as check, (public.join_waitlist('not-an-email')->>'ok')::boolean = false as pass;
select 'waitlist join works' as check, (public.join_waitlist('Rosa@Example.com', 'Rosa', 'test')->>'ok')::boolean as pass;
select 'waitlist ignores a repeat' as check, (public.join_waitlist(' rosa@example.com ')->>'already')::boolean as pass;
do $$ declare c text; begin
  c := public.join_waitlist('rosa@example.com')->>'code';
  perform public.join_waitlist('luis@example.com', null, null, c);
  if (public.join_waitlist('rosa@example.com')->>'invited')::int = 1 then raise notice 'CHECK waitlist counts referrals: PASS';
  else raise notice 'CHECK waitlist counts referrals: FAIL'; end if;
end $$;
select 'waitlist records who is joining' as check, (public.join_waitlist_v2('ana@example.com', 'Ana', 'partners', null, 'investor', 'Heritage Fund', 'Interested in a call')->>'ok')::boolean as pass;
select 'waitlist ignores an unknown segment' as check, (public.join_waitlist_v2('bo@example.com', null, null, null, 'hacker')->>'ok')::boolean as pass;
-- Someone who knows Ana's email can't change what she told us.
select 'waitlist details cannot be overwritten' as check, (public.join_waitlist_v2('ana@example.com', null, null, null, 'family', 'Other', 'spam')->>'already')::boolean as pass;
do $$ begin
  perform 1 from public.waitlist_signups;
  raise notice 'CHECK visitors cannot read the waitlist: FAIL';
exception when insufficient_privilege then raise notice 'CHECK visitors cannot read the waitlist: PASS'; end $$;
reset role;
select 'waitlist keeps the first details' as check, (select interest = 'investor' and organization = 'Heritage Fund' and note = 'Interested in a call' from public.waitlist_signups where email = 'ana@example.com') as pass;
select 'waitlist drops an unknown segment' as check, (select interest is null from public.waitlist_signups where email = 'bo@example.com') as pass;
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
select 'non-admins see no waitlist rows' as check, count(*) = 0 as pass from public.waitlist_signups;
do $$ begin
  insert into public.waitlist_signups (email, code) values ('x@example.com', 'forged01');
  raise notice 'CHECK direct waitlist insert blocked: FAIL';
exception when others then raise notice 'CHECK direct waitlist insert blocked: PASS'; end $$;
reset role;

-- Ask a relative: the sender makes a link; the relative (no account) can only read its questions and add answers,
-- which become the sender's stories; nobody else can see the request.
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into memory_requests (id, from_name, relative_name, questions)
values ('abab0000-0000-4000-8000-0000000000aa', 'Dylan', 'Grandma Rosa', array['Where did you grow up?', 'How did you meet Grandpa?']);
reset role;
-- The test reads the link's token as the database owner (visitors can't list tokens), then acts as the relative.
select token as memory_token from public.memory_requests where id = 'abab0000-0000-4000-8000-0000000000aa' \gset
set role anon;
select 'relative sees the questions' as check, (get_memory_request(:'memory_token')->'questions'->>1) = 'How did you meet Grandpa?' as pass;
reset role;
do $$ declare t text := (select token from public.memory_requests where id = 'abab0000-0000-4000-8000-0000000000aa'); begin
  set local role anon;
  perform answer_memory_request(t, 0, 'In Oaxaca, near the market.');
  perform answer_memory_request(t, 0, 'In Oaxaca, near the big market.');
  reset role;
end $$;
select 'answer becomes a story credited to the relative' as check, count(*) = 1 as pass from cultural_stories
  where user_id = 'eeeeeeee-0000-4000-8000-000000000005' and storyteller = 'Grandma Rosa' and content = 'In Oaxaca, near the big market.';
do $$ declare t text := (select token from public.memory_requests where id = 'abab0000-0000-4000-8000-0000000000aa'); begin
  set local role anon;
  perform answer_memory_request(t, 5, 'not a question');
  raise notice 'CHECK answer outside the questions refused: FAIL';
exception when others then raise notice 'CHECK answer outside the questions refused: PASS'; end $$;
set role anon;
select 'a wrong link shows nothing' as check, get_memory_request('0000000000000000000000000000000x') is null as pass;
do $$ begin
  perform 1 from public.memory_requests;
  raise notice 'CHECK visitors cannot list memory requests: FAIL';
exception when insufficient_privilege then raise notice 'CHECK visitors cannot list memory requests: PASS'; end $$;
reset role;
set role authenticated;
set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
select 'other people cannot see the request' as check, count(*) = 0 as pass from memory_requests where id = 'abab0000-0000-4000-8000-0000000000aa';
reset role;
update memory_requests set closed_at = now() where id = 'abab0000-0000-4000-8000-0000000000aa';
do $$ declare t text := (select token from public.memory_requests where id = 'abab0000-0000-4000-8000-0000000000aa'); begin
  set local role anon;
  perform answer_memory_request(t, 1, 'At a dance.');
  raise notice 'CHECK closed link takes no answers: FAIL';
exception when others then raise notice 'CHECK closed link takes no answers: PASS'; end $$;

-- Record hints are private to the tree's owner.
set role authenticated;
set request.jwt.claim.sub = 'eeeeeeee-0000-4000-8000-000000000005';
insert into family_members (id, first_name, last_name) values ('abab0000-0000-4000-8000-0000000000b1', 'Rosa', 'Vega');
insert into record_hints (family_member_id, source, source_id, title, url, score, level)
values ('abab0000-0000-4000-8000-0000000000b1', 'wikitree', 'Vega-1', 'Rosa Vega (1902-1980)', 'https://example.org/1', 82, 'strong');
insert into record_hint_checks (family_member_id) values ('abab0000-0000-4000-8000-0000000000b1');
select 'owner sees their hint' as check, count(*) = 1 as pass from record_hints where source_id = 'Vega-1';
reset role;
set role authenticated;
set request.jwt.claim.sub = 'abababab-0000-4000-8000-000000000007';
select 'others cannot see hints' as check, count(*) = 0 as pass from record_hints where source_id = 'Vega-1';
select 'others cannot see hint checks' as check, count(*) = 0 as pass from record_hint_checks where family_member_id = 'abab0000-0000-4000-8000-0000000000b1';
do $$ begin
  insert into record_hints (user_id, family_member_id, source, source_id, title, url, score, level)
  values ('eeeeeeee-0000-4000-8000-000000000005', 'abab0000-0000-4000-8000-0000000000b1', 'x', 'forged', 'Forged', 'https://example.org/x', 99, 'strong');
  raise notice 'CHECK cannot plant hints in another tree: FAIL';
exception when others then raise notice 'CHECK cannot plant hints in another tree: PASS'; end $$;
reset role;
