import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { stripe, adminDb, safeReturnUrl } from '../_shared/stripe.ts'

// Opens Stripe's hosted billing portal: update card, view invoices, cancel.
serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const { data } = await adminDb().from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
    if (!data?.stripe_customer_id) return json({ error: 'No billing account found' }, 404, cors)

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: safeReturnUrl(req, '/'),
    })
    return json({ url: session.url }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
