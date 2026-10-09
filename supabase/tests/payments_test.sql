-- e-Transfer flow: customer request -> admin confirm -> Pro access; abuse attempts must fail.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('cccccccc-0000-4000-8000-000000000003', 'customer@example.com'),
  ('dddddddd-0000-4000-8000-000000000004', 'admin@example.com');
insert into admin_roles (user_id) values ('dddddddd-0000-4000-8000-000000000004');
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-4000-8000-000000000003';
select 'request created with server price' as check, amount_cents = 1900 and reference_code like 'GEN-%' and status = 'pending' as pass
  from create_etransfer_request('monthly');
select 'same request reused' as check, count(*) = 1 as pass from (select create_etransfer_request('monthly')) x, manual_payments;
select 'no Pro before payment' as check, not has_pro_access('cccccccc-0000-4000-8000-000000000003') as pass;
do $$ begin
  insert into manual_payments (plan, amount_cents, reference_code) values ('yearly', 1, 'GEN-CHEAP1');
  raise notice 'CHECK customer cannot insert own price: FAIL';
exception when others then raise notice 'CHECK customer cannot insert own price: PASS'; end $$;
do $$ begin
  perform review_manual_payment((select id from manual_payments limit 1), true);
  raise notice 'CHECK customer cannot approve: FAIL';
exception when others then raise notice 'CHECK customer cannot approve: PASS'; end $$;

set request.jwt.claim.sub = 'dddddddd-0000-4000-8000-000000000004';
select 'admin approves' as check, status = 'confirmed' as pass from review_manual_payment((select id from manual_payments limit 1), true, 'received');
select 'customer now Pro' as check, has_pro_access('cccccccc-0000-4000-8000-000000000003') as pass;
reset role; -- subscriptions are private to their owner, so read this one as the database owner
select 'paid ~1 month' as check, current_period_end between now() + interval '27 days' and now() + interval '32 days' as pass
  from subscriptions where user_id = 'cccccccc-0000-4000-8000-000000000003';
set role authenticated;
set request.jwt.claim.sub = 'dddddddd-0000-4000-8000-000000000004';
do $$ begin
  perform review_manual_payment((select id from manual_payments limit 1), true);
  raise notice 'CHECK cannot approve twice: FAIL';
exception when others then raise notice 'CHECK cannot approve twice: PASS'; end $$;
reset role;
update subscriptions set current_period_end = now() - interval '4 days' where user_id = 'cccccccc-0000-4000-8000-000000000003';
select 'access ends after paid period + grace' as check, not has_pro_access('cccccccc-0000-4000-8000-000000000003') as pass;
set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-4000-8000-000000000003';
select 'cannot probe another user plan' as check, not has_pro_access('dddddddd-0000-4000-8000-000000000004') as pass;
reset role;

-- PayPal payment links follow the same reviewed flow.
set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-4000-8000-000000000003';
do $$ begin
  perform create_manual_payment_request('yearly', 'paypal_link');
  raise notice 'CHECK paypal link refused until configured: FAIL';
exception when others then raise notice 'CHECK paypal link refused until configured: PASS'; end $$;
reset role;
update app_settings set value = '"https://www.paypal.com/ncp/payment/TEST"'::jsonb where key = 'paypal_link_yearly_url';
set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-4000-8000-000000000003';
select 'paypal link request uses server price' as check, method = 'paypal_link' and amount_cents = 19000 and status = 'pending' as pass
  from create_manual_payment_request('yearly', 'paypal_link');
do $$ begin
  perform create_manual_payment_request('yearly', 'bitcoin');
  raise notice 'CHECK unknown method refused: FAIL';
exception when others then raise notice 'CHECK unknown method refused: PASS'; end $$;
set request.jwt.claim.sub = 'dddddddd-0000-4000-8000-000000000004';
select 'admin list shows method' as check, count(*) = 1 as pass from admin_list_manual_payments('pending') where method = 'paypal_link';
select 'admin approves paypal link' as check, status = 'confirmed' as pass
  from review_manual_payment((select id from manual_payments where method = 'paypal_link'), true, 'PayPal txn checked');
reset role;
select 'paypal link grants ~1 year' as check, provider = 'paypal_link' and current_period_end > now() + interval '360 days' as pass
  from subscriptions where user_id = 'cccccccc-0000-4000-8000-000000000003';
