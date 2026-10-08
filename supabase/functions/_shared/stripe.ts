import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(), // required on Deno / Edge Functions
})

export const adminDb = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

// Only these origins may be used as return URLs (prevents open-redirect abuse of checkout).
export function safeReturnUrl(req: Request, path: string): string {
  const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
  if (!site) throw new Error('SITE_URL is not configured')
  return `${site}${path}`
}
