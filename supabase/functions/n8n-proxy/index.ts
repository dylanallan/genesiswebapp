import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { assertPublicHttpsUrl } from '../_shared/net.ts'

// Talks to the user's OWN n8n instance through n8n's public REST API (X-N8N-API-KEY).
// Actions:
//   test            { url, apiKey }       -> checks the credentials, then saves them for this user
//   create_workflow { workflow }          -> creates a workflow in the saved n8n instance
//   list_workflows  {}                    -> lists workflows in the saved n8n instance

async function n8nFetch(base: URL, apiKey: string, path: string, init: RequestInit = {}) {
  const url = new URL(path, base.href.endsWith('/') ? base.href : base.href + '/')
  const res = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: { 'X-N8N-API-KEY': apiKey, Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
}

serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const { action, url, apiKey, workflow } = await req.json()
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    if (action === 'test') {
      if (typeof url !== 'string' || typeof apiKey !== 'string' || !apiKey) return json({ error: 'Enter your n8n URL and API key' }, 400, cors)
      let base: URL
      try { base = assertPublicHttpsUrl(url) } catch (e) { return json({ error: (e as Error).message }, 400, cors) }
      const r = await n8nFetch(base, apiKey, 'api/v1/workflows?limit=1')
      if (r.status === 401 || r.status === 403) return json({ error: 'n8n rejected the API key' }, 400, cors)
      if (!r.ok) return json({ error: `Could not reach the n8n API (status ${r.status}). Check the URL and that the public API is enabled.` }, 400, cors)
      const { error } = await db.from('integration_settings').upsert({
        user_id: user.id, integration_type: 'n8n', url: base.origin, api_key: apiKey,
        is_active: true, connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return json({ ok: true, url: base.origin }, 200, cors)
    }

    const { data: settings } = await db.from('integration_settings').select('url,api_key,is_active')
      .eq('user_id', user.id).eq('integration_type', 'n8n').maybeSingle()
    if (!settings?.is_active || !settings.url || !settings.api_key) return json({ error: 'Connect your n8n instance first' }, 400, cors)
    const base = assertPublicHttpsUrl(settings.url)

    if (action === 'create_workflow') {
      if (!workflow || typeof workflow !== 'object' || !Array.isArray(workflow.nodes)) return json({ error: 'Invalid workflow' }, 400, cors)
      const payload = { name: String(workflow.name ?? 'Genesis workflow').slice(0, 120), nodes: workflow.nodes, connections: workflow.connections ?? {}, settings: workflow.settings ?? {} }
      const r = await n8nFetch(base, settings.api_key, 'api/v1/workflows', { method: 'POST', body: JSON.stringify(payload) })
      if (!r.ok) return json({ error: `n8n refused the workflow (status ${r.status})`, details: r.body?.message }, 502, cors)
      return json({ ok: true, id: r.body.id, url: `${base.origin}/workflow/${r.body.id}` }, 200, cors)
    }

    if (action === 'list_workflows') {
      const r = await n8nFetch(base, settings.api_key, 'api/v1/workflows?limit=50')
      if (!r.ok) return json({ error: `Could not list workflows (status ${r.status})` }, 502, cors)
      return json({ ok: true, workflows: (r.body.data ?? []).map((w: any) => ({ id: w.id, name: w.name, active: w.active, updatedAt: w.updatedAt })) }, 200, cors)
    }

    return json({ error: 'Unknown action' }, 400, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
