import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { paypal, adminDb, siteUrl, syncSubscription } from '../_shared/paypal.ts'

// Customer-facing PayPal subscription actions:
//   create { plan: 'monthly' | 'yearly' } -> { url } of PayPal's approval page
//   sync   {}                              -> re-reads the subscription from PayPal (used right after approval)
//   cancel { reason? }                     -> stops renewal; Pro stays until the paid period ends
//   config {}                              -> { subscriptions } whether automatic subscriptions are set up
const PLANS: Record<string, string | undefined> = {
  monthly: Deno.env.get('PAYPAL_PLAN_MONTHLY'),
  yearly: Deno.env.get('PAYPAL_PLAN_YEARLY'),
}

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const { action = 'create', plan = 'monthly', reason } = await req.json().catch(() => ({}))
    if (action === 'config') {
      const configured = Boolean(Deno.env.get('PAYPAL_CLIENT_ID') && Deno.env.get('PAYPAL_CLIENT_SECRET') && PLANS.monthly && PLANS.yearly)
      return json({ subscriptions: configured }, 200, cors)
    }
    const user = await requireUser(req)
    const db = adminDb()
    const { data: current } = await db.from('subscriptions')
      .select('provider,provider_subscription_id,status').eq('user_id', user.id).maybeSingle()

    if (action === 'create') {
      const planId = PLANS[plan]
      if (!planId) return json({ error: 'That plan is not available' }, 400, cors)
      const { data: hasPro } = await db.rpc('has_pro_access', { p_user: user.id })
      if (hasPro && current?.provider === 'paypal' && current.status === 'active') {
        return json({ error: 'You already have an active PayPal subscription.' }, 409, cors)
      }
      const r = await paypal<{ id: string; links?: Array<{ rel: string; href: string }> }>('/v1/billing/subscriptions', {
        method: 'POST',
        headers: { 'PayPal-Request-Id': crypto.randomUUID() },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: user.id, // ties the subscription to this account in webhooks
          subscriber: user.email ? { email_address: user.email } : undefined,
          application_context: {
            brand_name: 'Genesis Heritage Pro',
            user_action: 'SUBSCRIBE_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: siteUrl('/?checkout=success'),
            cancel_url: siteUrl('/?checkout=cancelled'),
          },
        }),
      })
      const approve = r.body.links?.find((l) => l.rel === 'approve')?.href
      if (!r.ok || !approve) {
        console.error('PayPal create subscription failed', r.status, JSON.stringify(r.body))
        return json({ error: 'PayPal could not start the subscription. Please try again.' }, 502, cors)
      }
      // Remember the pending subscription so "sync" works before the webhook arrives. Someone with
      // paid-up e-Transfer access keeps it until PayPal confirms the new subscription.
      if (hasPro && current?.provider === 'etransfer') {
        await db.from('subscriptions').update({ provider_subscription_id: r.body.id }).eq('user_id', user.id)
      } else {
        await db.from('subscriptions').upsert({
          user_id: user.id, provider: 'paypal', provider_subscription_id: r.body.id,
          status: 'pending', price_id: planId, updated_at: new Date().toISOString(),
        })
      }
      return json({ url: approve }, 200, cors)
    }

    if (!current?.provider_subscription_id) return json({ error: 'No PayPal subscription found' }, 404, cors)

    if (action === 'sync') {
      const result = await syncSubscription(current.provider_subscription_id, user.id)
      return json({ status: result.status, currentPeriodEnd: result.currentPeriodEnd }, 200, cors)
    }

    if (action === 'cancel') {
      const r = await paypal(`/v1/billing/subscriptions/${encodeURIComponent(current.provider_subscription_id)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: String(reason ?? 'Cancelled by customer').slice(0, 127) }),
      })
      if (!r.ok && r.status !== 422) { // 422 = already cancelled
        console.error('PayPal cancel failed', r.status, JSON.stringify(r.body))
        return json({ error: 'PayPal could not cancel the subscription. Please try again.' }, 502, cors)
      }
      const result = await syncSubscription(current.provider_subscription_id, user.id)
      return json({ status: result.status, currentPeriodEnd: result.currentPeriodEnd }, 200, cors)
    }

    return json({ error: 'Unknown action' }, 400, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
