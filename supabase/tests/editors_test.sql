-- Sharing with an editor: a trusted relative can fix facts and add relatives, but nothing more.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('0e0e0e0e-0000-4000-8000-000000000021', 'treeowner@example.com'),
  ('0e0e0e0e-0000-4000-8000-000000000022', 'editor@example.com'),
  ('0e0e0e0e-0000-4000-8000-000000000023', 'helper@example.com');
grant select, insert, update, delete on all tables in schema public to authenticated;

set role authenticated;
set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000021';
insert into family_members (id, first_name, last_name, birth_date, notes) values
  ('0f0f0f0f-0000-4000-8000-000000000001', 'Lucie', 'Gagnon', '1985-02-03', 'private note'),
  ('0f0f0f0f-0000-4000-8000-000000000002', 'Henri', 'Gagnon', null, null);
insert into family_shares (invitee_name, role, can_edit, token) values ('Cousin Marc', 'contributor', true, 'tok-editor'), ('Aunt Lise', 'contributor', false, 'tok-helper');
select 'owner sees the editor role' as check, (select role = 'editor' from my_family_members_shared() where invitee_name = 'Cousin Marc') as pass;

set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000022';
select 'editor previews as editor' as check, preview_family_invite('tok-editor')->>'role' = 'editor' as pass;
select 'editor joins' as check, accept_family_invite('tok-editor')->>'role' = 'editor' as pass;
select 'editor listed as editor' as check, (select role = 'editor' from my_shared_families()) as pass;
select 'editor sees living details but no private notes' as check,
  (select m->>'birth_date' = '1985-02-03' and m->'notes' is null and m->'user_id' is null
   from jsonb_array_elements(shared_family_snapshot('0e0e0e0e-0000-4000-8000-000000000021')->'members') m where m->>'first_name' = 'Lucie') as pass;
select 'editor fixes a fact' as check,
  shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"id": "0f0f0f0f-0000-4000-8000-000000000002", "birth_date": "1921-06-07", "death_date": "1999-01-02", "birth_location": "Chicoutimi"}') is not null as pass;
select 'editor adds a parent' as check,
  shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"first_name": "Marie", "last_name": "Tremblay", "gender": "female"}', '0f0f0f0f-0000-4000-8000-000000000002', 'parent') is not null as pass;
select 'editor still adds memories' as check, add_shared_story('0e0e0e0e-0000-4000-8000-000000000021', 'Le chalet', 'Les étés au lac.') is not null as pass;
do $$ begin
  perform shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"id": "0f0f0f0f-0000-4000-8000-000000000001", "birth_date": "1990-01-01", "death_date": "1980-01-01"}');
  raise notice 'CHECK death before birth refused: FAIL';
exception when others then raise notice 'CHECK death before birth refused: PASS'; end $$;
do $$ begin
  perform shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"first_name": "Loose", "last_name": "Person"}');
  raise notice 'CHECK a new person must be linked: FAIL';
exception when others then raise notice 'CHECK a new person must be linked: PASS'; end $$;
select 'editor cannot read the tree table directly' as check, count(*) = 0 as pass from family_members;
delete from family_members where id = '0f0f0f0f-0000-4000-8000-000000000001';

set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000023';
select 'helper joins as contributor' as check, accept_family_invite('tok-helper')->>'role' = 'contributor' as pass;
do $$ begin
  perform shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"id": "0f0f0f0f-0000-4000-8000-000000000001", "first_name": "Hacked"}');
  raise notice 'CHECK contributor cannot edit the tree: FAIL';
exception when others then raise notice 'CHECK contributor cannot edit the tree: PASS'; end $$;
select 'contributor still sees living people as names only' as check,
  (select m->'birth_date' is null from jsonb_array_elements(shared_family_snapshot('0e0e0e0e-0000-4000-8000-000000000021')->'members') m where m->>'first_name' = 'Lucie') as pass;

set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000022';
do $$ begin
  perform shared_save_member('eeeeeeee-0000-4000-8000-000000000005', '{"id": "0f0f0f0f-0000-4000-8000-000000000001", "first_name": "X"}');
  raise notice 'CHECK editor cannot edit another family: FAIL';
exception when others then raise notice 'CHECK editor cannot edit another family: PASS'; end $$;

reset role;
select 'the fix was saved, and Henri is no longer living' as check, birth_date = '1921-06-07' and death_date = '1999-01-02' and birth_location = 'Chicoutimi' and not is_living as pass
  from family_members where id = '0f0f0f0f-0000-4000-8000-000000000002';
select 'new parent is in the owner''s tree and linked both ways' as check,
  (select user_id = '0e0e0e0e-0000-4000-8000-000000000021' and children_ids = array['0f0f0f0f-0000-4000-8000-000000000002']::uuid[] from family_members where first_name = 'Marie' and last_name = 'Tremblay')
  and (select parent_ids @> array[(select id from family_members where first_name = 'Marie' and last_name = 'Tremblay')] from family_members where id = '0f0f0f0f-0000-4000-8000-000000000002') as pass;
select 'nothing was deleted, notes untouched' as check, (select notes = 'private note' from family_members where id = '0f0f0f0f-0000-4000-8000-000000000001') as pass;
select 'contributor''s attempt changed nothing' as check, (select first_name = 'Lucie' from family_members where id = '0f0f0f0f-0000-4000-8000-000000000001') as pass;

-- Taking edit rights away works straight away.
set role authenticated;
set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000021';
update family_shares set can_edit = false where token = 'tok-editor';
set request.jwt.claim.sub = '0e0e0e0e-0000-4000-8000-000000000022';
do $$ begin
  perform shared_save_member('0e0e0e0e-0000-4000-8000-000000000021', '{"id": "0f0f0f0f-0000-4000-8000-000000000002", "first_name": "Late"}');
  raise notice 'CHECK edit rights removed: FAIL';
exception when others then raise notice 'CHECK edit rights removed: PASS'; end $$;
reset role;
