import { createClient, type User } from 'npm:@supabase/supabase-js@2'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Verifies the caller's JWT with Supabase Auth and returns the real user.
// Never trust a userId sent in the request body; use the id returned here.
export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Authentication required')
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session')
  return data.user
}

// Requires an active paid subscription (see supabase/migrations/*_billing.sql).
export async function requireActiveSubscription(user: User): Promise<void> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data } = await admin
    .from('subscriptions')
    .select('status,current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
  if (!data) throw new HttpError(402, 'An active subscription is required')
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export function errorResponse(e: unknown, headers: Record<string, string> = {}) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status, headers)
  console.error(e)
  return json({ error: 'Internal server error' }, 500, headers) // no internal details to clients
}
