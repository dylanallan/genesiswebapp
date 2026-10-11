// Settings for Edge Functions. Each value comes from the function's environment (Supabase → Edge Functions →
// Secrets) when set there; otherwise from the database: Vault secrets named like environment variables (API keys)
// and the allowed_origins / site_url app settings, read once per cold start through get_runtime_config(), which only
// the service role may call. This lets settings be managed from SQL as well as from the dashboard.
import { createClient } from 'npm:@supabase/supabase-js@2'

const fromDatabase: Record<string, string> = {}

async function load(): Promise<void> {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return
  try {
    const db = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data, error } = await db.rpc('get_runtime_config')
    if (error) return console.error('runtime-config: could not load settings:', error.message)
    for (const [name, value] of Object.entries((data ?? {}) as Record<string, unknown>)) {
      if (typeof value === 'string' && value) fromDatabase[name] = value
    }
  } catch (e) {
    console.error('runtime-config: could not load settings:', (e as Error).message)
  }
}

await load()

/** A setting by its environment-variable name; the environment wins over the database. */
export function cfg(name: string): string | undefined {
  return Deno.env.get(name) || fromDatabase[name] || undefined
}
