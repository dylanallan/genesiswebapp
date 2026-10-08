import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { stripe, adminDb, safeReturnUrl } from '../_shared/stripe.ts'

// Plans are defined server-side so the browser can never pick its own price.
// Set STRIPE_PRICE_MONTHLY and (optionally) STRIPE_PRICE_YEARLY from your Stripe dashboard.
const PRICES: Record<string, string | undefined> = {
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY'),
  yearly: Deno.env.get('STRIPE_PRICE_YEARLY'),
}

serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const { plan = 'monthly' } = await req.json().catch(() => ({}))
    const price = PRICES[plan]
    if (!price) return json({ error: 'That plan is not available' }, 400, cors)

    const db = adminDb()
    const { data: existing } = await db.from('subscriptions').select('stripe_customer_id,status').eq('user_id', user.id).maybeSingle()
    if (existing?.status === 'active' || existing?.status === 'trialing') {
      return json({ error: 'You already have an active subscription. Use "Manage billing" to change it.' }, 409, cors)
    }

    let customerId = existing?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })
      customerId = customer.id
      await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId, status: 'none' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: user.id } },
      success_url: safeReturnUrl(req, '/?checkout=success'),
      cancel_url: safeReturnUrl(req, '/?checkout=cancelled'),
    })
    return json({ url: session.url }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
