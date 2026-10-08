import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14'
import { stripe, adminDb } from '../_shared/stripe.ts'

// Stripe calls this directly (no user JWT), so it is deployed with verify_jwt = false
// and authenticated by verifying Stripe's signature instead.
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const cryptoProvider = Stripe.createSubtleCryptoProvider()

async function syncSubscription(sub: Stripe.Subscription) {
  const db = adminDb()
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  let userId = sub.metadata?.user_id
  if (!userId) {
    const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle()
    userId = data?.user_id
  }
  if (!userId) throw new Error(`No user found for Stripe customer ${customerId}`)

  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: sub.items.data[0]?.price.id ?? null,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const signature = req.headers.get('stripe-signature')
  if (!signature || !WEBHOOK_SECRET) return new Response('Bad request', { status: 400 })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, WEBHOOK_SECRET, undefined, cryptoProvider)
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message)
    return new Response('Invalid signature', { status: 400 })
  }

  const db = adminDb()
  // Stripe may deliver an event more than once; skip ones we've already handled.
  const { error: dupError } = await db.from('stripe_events').insert({ id: event.id, type: event.type })
  if (dupError) {
    if (dupError.code === '23505') return new Response('Already processed', { status: 200 })
    console.error(dupError)
    return new Response('Database error', { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          await syncSubscription(await stripe.subscriptions.retrieve(subId))
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      default:
        break // other events are ignored
    }
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}:`, err)
    await db.from('stripe_events').delete().eq('id', event.id) // let Stripe retry
    return new Response('Handler error', { status: 500 })
  }
})
