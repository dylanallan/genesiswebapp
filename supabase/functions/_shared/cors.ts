// CORS for browser calls. Set ALLOWED_ORIGINS (comma-separated, e.g.
// "https://app.example.com,http://localhost:5173") in the function secrets.
// If unset, no cross-origin browser access is granted (fails closed).
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
  if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

// Back-compat for functions that still import a static object. Prefer corsFor(req).
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': allowedOrigins[0] ?? 'null',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Vary': 'Origin',
}

// Wraps a handler: answers preflight and adds CORS headers to every response.
export function withCors(handler: (req: Request) => Promise<Response> | Response) {
  return async (req: Request): Promise<Response> => {
    const cors = corsFor(req)
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    const res = await handler(req)
    const out = new Response(res.body, res)
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v)
    return out
  }
}
