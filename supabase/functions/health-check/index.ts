import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'

// Public liveness check (deployed with verify_jwt = false). Reports only up/down per component,
// never user counts or other internal figures; detailed metrics live in the admin-only
// system-health-monitor function. Responds 200 when everything is up, 503 otherwise.
type Check = 'ok' | 'down'

async function timed(fn: () => Promise<boolean>): Promise<{ status: Check; ms: number }> {
  const started = Date.now()
  try {
    return { status: (await fn()) ? 'ok' : 'down', ms: Date.now() - started }
  } catch {
    return { status: 'down', ms: Date.now() - started }
  }
}

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const [database, storage, auth] = await Promise.all([
    timed(async () => !(await db.from('health_check').select('id').limit(1)).error),
    timed(async () => !(await db.storage.listBuckets()).error),
    timed(async () => !(await db.auth.admin.listUsers({ page: 1, perPage: 1 })).error),
  ])
  const aiConfigured = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'].some((k) => !!Deno.env.get(k))
  const healthy = database.status === 'ok' && storage.status === 'ok' && auth.status === 'ok'

  return new Response(
    JSON.stringify({
      status: healthy ? 'healthy' : 'unhealthy',
      checks: { database, storage, auth, ai: { status: aiConfigured ? 'ok' : 'down' } },
      timestamp: new Date().toISOString(),
    }),
    { status: healthy ? 200 : 503, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  )
})
