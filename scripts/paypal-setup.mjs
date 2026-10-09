#!/usr/bin/env node
// Creates the "Genesis Pro" product and its monthly + yearly subscription plans in PayPal,
// then prints the plan IDs to save as PAYPAL_PLAN_MONTHLY / PAYPAL_PLAN_YEARLY.
//
// Usage (sandbox first, then live):
//   PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_ENV=sandbox \
//   MONTHLY_PRICE=19.00 YEARLY_PRICE=190.00 CURRENCY=USD node scripts/paypal-setup.mjs
const env = process.env;
const BASE = env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const monthly = env.MONTHLY_PRICE ?? '19.00';
const yearly = env.YEARLY_PRICE ?? '190.00';
const currency = env.CURRENCY ?? 'USD';

if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
  console.error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (PayPal Developer Dashboard → Apps & Credentials).');
  process.exit(1);
}

async function token() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal login failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function call(t, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const plan = (productId, name, interval, price) => ({
  product_id: productId,
  name,
  billing_cycles: [{
    frequency: { interval_unit: interval, interval_count: 1 },
    tenure_type: 'REGULAR',
    sequence: 1,
    total_cycles: 0, // renews until cancelled
    pricing_scheme: { fixed_price: { value: price, currency_code: currency } },
  }],
  payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
});

const t = await token();
const product = await call(t, '/v1/catalogs/products', { name: 'Genesis Pro', type: 'SERVICE', category: 'SOFTWARE' });
const m = await call(t, '/v1/billing/plans', plan(product.id, 'Genesis Pro – Monthly', 'MONTH', monthly));
const y = await call(t, '/v1/billing/plans', plan(product.id, 'Genesis Pro – Yearly', 'YEAR', yearly));
console.log(`\nCreated in ${env.PAYPAL_ENV === 'live' ? 'LIVE' : 'SANDBOX'}:`);
console.log(`  PAYPAL_PLAN_MONTHLY=${m.id}   (${monthly} ${currency}/month)`);
console.log(`  PAYPAL_PLAN_YEARLY=${y.id}    (${yearly} ${currency}/year)\n`);
console.log('Save them with:');
console.log(`  npx supabase secrets set PAYPAL_PLAN_MONTHLY=${m.id} PAYPAL_PLAN_YEARLY=${y.id}`);
