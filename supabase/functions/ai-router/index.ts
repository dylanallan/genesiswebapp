import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

const MAX_MESSAGE_CHARS = 8000
const FREE_DAILY_MESSAGES = Number(Deno.env.get('FREE_DAILY_MESSAGES') ?? '10')
const PAID_DAILY_MESSAGES = Number(Deno.env.get('PAID_DAILY_MESSAGES') ?? '500') // abuse backstop

// Models are configurable so a provider retiring a model never needs a code change.
const MODELS = {
  anthropic: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
  openai: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
  gemini: Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash',
}

const SYSTEM_PROMPT =
  'You are Genesis, a warm and knowledgeable assistant for family heritage research, ' +
  'cultural traditions and small-business planning. Be accurate; say so when you are unsure.'

async function callAnthropic(message: string, apiKey: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELS.anthropic, max_tokens: 1024, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: message }] }),
  })
  if (!r.ok) throw new Error(`Anthropic API error: ${r.status}`)
  return (await r.json()).content[0].text
}

async function callOpenAI(message: string, apiKey: string): Promise<string> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODELS.openai, max_tokens: 1024, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message }] }),
  })
  if (!r.ok) throw new Error(`OpenAI API error: ${r.status}`)
  return (await r.json()).choices[0].message.content
}

async function callGemini(message: string, apiKey: string): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, // header, not URL, so it never lands in logs
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ parts: [{ text: message }] }] }),
  })
  if (!r.ok) throw new Error(`Gemini API error: ${r.status}`)
  return (await r.json()).candidates[0].content.parts[0].text
}

const PROVIDERS = [
  { name: 'anthropic', key: () => Deno.env.get('ANTHROPIC_API_KEY'), call: callAnthropic },
  { name: 'openai', key: () => Deno.env.get('OPENAI_API_KEY'), call: callOpenAI },
  { name: 'gemini', key: () => Deno.env.get('GEMINI_API_KEY'), call: callGemini },
]

const admin = () => createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const { message, provider } = await req.json()
    if (typeof message !== 'string' || !message.trim()) return json({ error: 'A message is required' }, 400, cors)
    if (message.length > MAX_MESSAGE_CHARS) return json({ error: `Message too long (max ${MAX_MESSAGE_CHARS} characters)` }, 400, cors)

    // Plan + daily quota (counted before the call so failures can't be used to dodge the limit)
    const db = admin()
    const { data: paid, error: planError } = await db.rpc('has_pro_access', { p_user: user.id })
    if (planError) throw planError
    const limit = paid ? PAID_DAILY_MESSAGES : FREE_DAILY_MESSAGES
    const { data: used, error: usageError } = await db.rpc('increment_ai_usage', { p_user: user.id })
    if (usageError) throw usageError
    if (used > limit) {
      return json({
        error: paid ? 'Daily message limit reached. It resets at midnight UTC.' : 'Free daily limit reached. Upgrade to keep chatting.',
        code: paid ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED',
      }, 429, cors)
    }

    const candidates = provider ? PROVIDERS.filter((p) => p.name === provider) : PROVIDERS
    if (provider && candidates.length === 0) return json({ error: 'Unknown provider' }, 400, cors)

    for (const p of candidates) {
      const key = p.key()
      if (!key) continue
      try {
        const response = await p.call(message, key)
        return json({ response, provider: p.name, model: MODELS[p.name as keyof typeof MODELS], remaining: Math.max(0, limit - used) }, 200, cors)
      } catch (e) {
        console.error(`ai-router: ${p.name} failed:`, (e as Error).message)
      }
    }
    return json({ error: 'The AI service is temporarily unavailable. Please try again shortly.' }, 503, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
