import { adminDb, syncSubscription, verifyWebhook } from '../_shared/paypal.ts'

// PayPal calls this directly (no user session), so it is deployed with verify_jwt = false and
// authenticated by asking PayPal to verify the signature. Register it in the PayPal developer
// dashboard with the BILLING.SUBSCRIPTION.* and PAYMENT.SALE.COMPLETED events.
interface PayPalEvent {
  id: string
  event_type: string
  resource?: { id?: string; billing_agreement_id?: string }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const raw = await req.text()
  if (!(await verifyWebhook(req, raw))) return new Response('Invalid signature', { status: 400 })

  const event = JSON.parse(raw) as PayPalEvent
  const db = adminDb()
  const { error: dupError } = await db.from('billing_events').insert({ id: event.id, provider: 'paypal', type: event.event_type })
  if (dupError) {
    if (dupError.code === '23505') return new Response('Already processed', { status: 200 })
    console.error(dupError)
    return new Response('Database error', { status: 500 })
  }

  try {
    const type = event.event_type
    let subscriptionId: string | undefined
    if (type.startsWith('BILLING.SUBSCRIPTION.')) subscriptionId = event.resource?.id
    else if (type === 'PAYMENT.SALE.COMPLETED') subscriptionId = event.resource?.billing_agreement_id
    if (subscriptionId) await syncSubscription(subscriptionId)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(`PayPal webhook ${event.event_type} failed:`, err)
    await db.from('billing_events').delete().eq('id', event.id) // let PayPal retry
    return new Response('Handler error', { status: 500 })
  }
})
