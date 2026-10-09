// Minimal PayPal REST client for subscriptions (no SDK needed).
// Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV ("live" or "sandbox", default sandbox),
//      PAYPAL_WEBHOOK_ID (from the webhook you register in the PayPal developer dashboard).
import { createClient } from 'npm:@supabase/supabase-js@2'

const BASE = (Deno.env.get('PAYPAL_ENV') ?? 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value
  const id = Deno.env.get('PAYPAL_CLIENT_ID')
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET')
  if (!id || !secret) throw new Error('PayPal is not configured')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`)
  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in ?? 300) * 1000 }
  return cachedToken.value
}

export async function paypal<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: T }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let body: unknown = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  return { ok: res.ok, status: res.status, body: body as T }
}

// Asks PayPal to confirm a webhook really came from PayPal for our webhook id.
export async function verifyWebhook(req: Request, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')
  if (!webhookId) return false
  const h = (name: string) => req.headers.get(name) ?? ''
  let event: unknown
  try { event = JSON.parse(rawBody) } catch { return false }
  const r = await paypal<{ verification_status?: string }>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: h('paypal-auth-algo'),
      cert_url: h('paypal-cert-url'),
      transmission_id: h('paypal-transmission-id'),
      transmission_sig: h('paypal-transmission-sig'),
      transmission_time: h('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: event,
    }),
  })
  return r.ok && r.body.verification_status === 'SUCCESS'
}

export const adminDb = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

export function siteUrl(path: string): string {
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  if (!site) throw new Error('SITE_URL is not configured')
  return `${site}${path}`
}

interface PayPalSubscription {
  id: string
  status: string // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  plan_id?: string
  custom_id?: string
  subscriber?: { payer_id?: string }
  billing_info?: { next_billing_time?: string; last_payment?: { time?: string } }
}

const STATUS: Record<string, string> = {
  APPROVAL_PENDING: 'pending', APPROVED: 'pending', ACTIVE: 'active',
  SUSPENDED: 'past_due', CANCELLED: 'canceled', EXPIRED: 'canceled',
}

// Fetches the subscription from PayPal (the source of truth) and stores its state for the user.
// A cancelled subscription keeps access until the end of the period already paid for.
export async function syncSubscription(subscriptionId: string, expectedUserId?: string) {
  const r = await paypal<PayPalSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`)
  if (!r.ok) throw new Error(`Could not load PayPal subscription (${r.status})`)
  const sub = r.body
  const db = adminDb()
  let userId = sub.custom_id
  if (!userId) {
    const { data } = await db.from('subscriptions').select('user_id').eq('provider_subscription_id', sub.id).maybeSingle()
    userId = data?.user_id
  }
  if (!userId) throw new Error(`No user for PayPal subscription ${sub.id}`)
  if (expectedUserId && userId !== expectedUserId) throw new Error('Subscription belongs to another user')

  const { data: existing } = await db.from('subscriptions').select('provider,current_period_end').eq('user_id', userId).maybeSingle()
  const status = STATUS[sub.status] ?? 'none'

  // A PayPal subscription that is not active yet must never take away access already paid for
  // (e.g. an e-Transfer customer part-way through switching to PayPal).
  if (status !== 'active' && existing?.provider && existing.provider !== 'paypal') {
    const { data: stillPaid } = await db.rpc('has_pro_access', { p_user: userId })
    if (stillPaid) return { userId, status: 'unchanged', currentPeriodEnd: existing.current_period_end }
  }
  const periodEnd = sub.billing_info?.next_billing_time ?? (status === 'canceled' ? existing?.current_period_end ?? null : null)

  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    provider: 'paypal',
    provider_subscription_id: sub.id,
    provider_customer_id: sub.subscriber?.payer_id ?? null,
    status,
    price_id: sub.plan_id ?? null,
    current_period_end: periodEnd,
    cancel_at_period_end: status === 'canceled',
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
  return { userId, status, currentPeriodEnd: periodEnd }
}
