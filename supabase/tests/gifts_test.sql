-- Gift subscriptions: buy -> admin confirms -> code works once for someone else; the buyer doesn't get Pro.
\set ON_ERROR_STOP 0
insert into auth.users (id, email) values
  ('a1a1a1a1-0000-4000-8000-000000000011', 'giver@example.com'),
  ('b2b2b2b2-0000-4000-8000-000000000012', 'grandma@example.com'),
  ('c3c3c3c3-0000-4000-8000-000000000013', 'nosy@example.com'),
  ('d4d4d4d4-0000-4000-8000-000000000014', 'giftadmin@example.com');
insert into admin_roles (user_id) values ('d4d4d4d4-0000-4000-8000-000000000014');
grant select, insert, update, delete on all tables in schema public to authenticated;

set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-0000-4000-8000-000000000011';
select 'gift request uses server price' as check,
  (r->'payment'->>'amount_cents')::int = 19000 and r->'payment'->>'reference_code' like 'GIFT-%' and r->'payment'->>'purpose' = 'gift' as pass
  from (select create_gift_request('yearly', 'etransfer', 'Grandma Rosa', 'grandma@example.com', 'Happy birthday!') as r) x;
select 'code hidden until paid' as check, (select code is null and status = 'pending' from my_gifts() limit 1) as pass;
select 'own plan request is separate from the gift' as check,
  (select purpose = 'self' and reference_code like 'GEN-%' from create_manual_payment_request('yearly', 'etransfer')) as pass;
do $$ begin
  insert into gift_codes (code, plan, months, buyer_id, payment_id)
    values ('ABCDEFGHJKLM', 'yearly', 12, 'a1a1a1a1-0000-4000-8000-000000000011', (select id from manual_payments limit 1));
  raise notice 'CHECK buyer cannot make a code directly: FAIL';
exception when others then raise notice 'CHECK buyer cannot make a code directly: PASS'; end $$;
do $$ begin
  if (redeem_gift_code((select code from gift_codes limit 1))->>'ok')::boolean then raise notice 'CHECK unpaid gift cannot be redeemed: FAIL';
  else raise notice 'CHECK unpaid gift cannot be redeemed: PASS'; end if;
end $$;

set request.jwt.claim.sub = 'c3c3c3c3-0000-4000-8000-000000000013';
select 'stranger sees no gifts' as check, (select count(*) = 0 from gift_codes) and (select count(*) = 0 from my_gifts()) as pass;

set request.jwt.claim.sub = 'd4d4d4d4-0000-4000-8000-000000000014';
select 'admin confirms gift payment' as check, status = 'confirmed' as pass
  from review_manual_payment((select id from manual_payments where purpose = 'gift' and reference_code like 'GIFT-%' limit 1), true, 'received');
select 'admin sees the gift' as check, count(*) = 1 as pass from gift_codes where status = 'paid';
select 'buyer does not get Pro from a gift' as check, not has_pro_access('a1a1a1a1-0000-4000-8000-000000000011') as pass;

set request.jwt.claim.sub = 'a1a1a1a1-0000-4000-8000-000000000011';
select 'buyer sees the code once paid' as check, (select code ~ '^[A-HJ-NP-Z2-9]{12}$' and status = 'paid' from my_gifts() where status <> 'pending' limit 1) as pass;

-- The buyer passes the code on (read here as the database owner); Grandma types it in lower case with dashes.
reset role;
select code as yearly_code, lower(substr(code, 1, 4) || '-' || substr(code, 5, 4) || '-' || substr(code, 9)) as typed_code
  from gift_codes where plan = 'yearly' \gset
set role authenticated;
set request.jwt.claim.sub = 'b2b2b2b2-0000-4000-8000-000000000012';
select 'grandma redeems the code' as check, (r->>'ok')::boolean and (r->>'months')::int = 12 as pass
  from (select redeem_gift_code(:'typed_code') as r) x;
select 'grandma now Pro' as check, has_pro_access('b2b2b2b2-0000-4000-8000-000000000012') as pass;
select 'second redeem refused' as check, not (redeem_gift_code(:'yearly_code')->>'ok')::boolean as pass;
reset role;
select 'Pro for about 12 months' as check, provider = 'gift' and current_period_end between now() + interval '360 days' and now() + interval '370 days' as pass
  from subscriptions where user_id = 'b2b2b2b2-0000-4000-8000-000000000012';

-- An expired code is refused.
set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-0000-4000-8000-000000000011';
select 'second gift requested' as check, (create_gift_request('monthly', 'etransfer')->>'gift_id') is not null as pass;
set request.jwt.claim.sub = 'd4d4d4d4-0000-4000-8000-000000000014';
select 'second gift confirmed' as check, status = 'confirmed' as pass
  from review_manual_payment((select payment_id from gift_codes where plan = 'monthly' limit 1), true);
reset role;
update gift_codes set expires_at = now() - interval '1 day' where plan = 'monthly';
select code as monthly_code from gift_codes where plan = 'monthly' \gset
set role authenticated;
set request.jwt.claim.sub = 'c3c3c3c3-0000-4000-8000-000000000013';
select 'expired code refused' as check, not (redeem_gift_code(:'monthly_code')->>'ok')::boolean as pass;
select 'nosy has no Pro' as check, not has_pro_access('c3c3c3c3-0000-4000-8000-000000000013') as pass;

-- A normal payment still grants Pro to the payer.
set request.jwt.claim.sub = 'd4d4d4d4-0000-4000-8000-000000000014';
select 'normal payment confirmed' as check, status = 'confirmed' as pass
  from review_manual_payment((select id from manual_payments where purpose = 'self' and user_id = 'a1a1a1a1-0000-4000-8000-000000000011' limit 1), true);
select 'normal payment still grants Pro' as check, has_pro_access('a1a1a1a1-0000-4000-8000-000000000011') as pass;

-- Guessing is limited to 10 tries a day.
set request.jwt.claim.sub = 'c3c3c3c3-0000-4000-8000-000000000013';
do $$ declare r jsonb; begin
  for i in 1..12 loop r := redeem_gift_code('ZZZZZZZZZZZZ'); end loop;
  if r->>'reason' like 'Too many tries%' then raise notice 'CHECK guessing is limited: PASS'; else raise notice 'CHECK guessing is limited: FAIL'; end if;
end $$;
reset role;
