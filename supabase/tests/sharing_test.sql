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
