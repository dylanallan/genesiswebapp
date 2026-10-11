import { cfg } from './runtime-config.ts'
// CORS for browser calls. ALLOWED_ORIGINS is a comma-separated list (function secret, or the allowed_origins
// app setting), e.g. "https://app.example.com,http://localhost:5173". A "*" stands for one or more letters, digits
// or dashes inside a host name, so "https://*--mysite.netlify.app" covers Netlify deploy previews of one site.
// If unset, no cross-origin browser access is granted (fails closed).
const allowedOrigins = (cfg('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export function originAllowed(origin: string, allowed: string[] = allowedOrigins): boolean {
  if (!origin) return false
  return allowed.some((pattern) => {
    if (!pattern.includes('*')) return pattern === origin
    const re = new RegExp('^' + pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[a-z0-9-]+') + '$')
    return re.test(origin)
  })
}

export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
  if (originAllowed(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

// Back-compat for functions that still import a static object. Prefer corsFor(req).
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': allowedOrigins.find((o) => !o.includes('*')) ?? 'null',
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
