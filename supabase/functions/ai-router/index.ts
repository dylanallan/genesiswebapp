import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { OPENAI_COMPATIBLE, compatibleKey, compatibleModel, orderByPreference, DEFAULT_PROVIDER_ORDER } from '../_shared/ai-providers.ts'
import { cfg } from '../_shared/runtime-config.ts'

const MAX_MESSAGE_CHARS = 8000
const FREE_DAILY_MESSAGES = Number(cfg('FREE_DAILY_MESSAGES') ?? '10')
const PAID_DAILY_MESSAGES = Number(cfg('PAID_DAILY_MESSAGES') ?? '500') // abuse backstop

// Models are configurable so a provider retiring a model never needs a code change.
const MODELS: Record<string, string> = {
  anthropic: cfg('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
  openai: cfg('OPENAI_MODEL') ?? 'gpt-4o-mini',
  gemini: cfg('GEMINI_MODEL') ?? 'gemini-flash-latest',
  ...Object.fromEntries(Object.keys(OPENAI_COMPATIBLE).map((name) => [name, compatibleModel(name)])),
}

const SYSTEM_PROMPT = [
  'You are Genesis, a warm, patient and expert genealogist and family historian helping everyday families, many of them new to research.',
  'Use plain, friendly language and reply in the same language the person writes in.',
  'Be rigorous like a professional genealogist: separate what records actually show from assumptions, name the kind of record that would prove or disprove something',
  '(census, parish/church register, civil birth/marriage/death record, ship manifest, naturalization, military, land, obituary, city directory),',
  'and point out common pitfalls (same-name people, spelling variants, estimated ages, changed borders and place names).',
  'Never invent ancestors, names, dates, places or records. If you are unsure, say so and explain how to check.',
  'When helpful, give historical context about the times and places the family lived in, clearly labelled as background.',
  'Be respectful about sensitive topics such as adoption, enslavement, migration and family secrets.',
].join(' ')

// Reads why a provider refused (a short slice of its reply) so the logs say what went wrong, not just a status code.
async function refusal(name: string, r: Response): Promise<Error & { status?: number }> {
  let detail = ''
  try { detail = (await r.text()).replace(/\s+/g, ' ').slice(0, 300) } catch { /* no body */ }
  return Object.assign(new Error(`${name} ${r.status}: ${detail}`), { status: r.status })
}

// Try each model in turn when one is busy, rate limited or retired, so one model's bad day doesn't stop the chat.
const RETRY_NEXT_MODEL = new Set([404, 408, 429, 500, 502, 503, 504])
const unique = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))]
interface Answer { text: string; model: string }

async function callAnthropic(message: string, apiKey: string, system: string): Promise<Answer> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELS.anthropic, max_tokens: 1024, system, messages: [{ role: 'user', content: message }] }),
  })
  if (!r.ok) throw await refusal('anthropic', r)
  const text = (await r.json()).content?.[0]?.text
  if (typeof text !== 'string' || !text) throw new Error('anthropic returned an empty answer')
  return { text, model: MODELS.anthropic }
}

// Spare models to fall back on when the configured one is retired or busy.
const SPARE_MODELS: Record<string, string[]> = {
  groq: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat-v3-0324:free'],
}

// Any OpenAI-compatible chat API: OpenAI itself, a self-hosted OmniRoute gateway, and the free tiers.
function openAICompatible(name: string, baseUrl: string) {
  return async (message: string, apiKey: string, system: string): Promise<Answer> => {
    let last: Error | undefined
    for (const model of unique([MODELS[name], ...(SPARE_MODELS[name] ?? [])])) {
      const r = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'system', content: system }, { role: 'user', content: message }] }),
      })
      if (!r.ok) {
        last = await refusal(`${name}/${model}`, r)
        // A retired model often comes back as 400 "model_decommissioned" or "model not found".
        if (RETRY_NEXT_MODEL.has(r.status) || /decommission|not found|does not exist|no longer supported/i.test(last.message)) continue
        throw last
      }
      const text = (await r.json()).choices?.[0]?.message?.content
      if (typeof text !== 'string' || !text) { last = new Error(`${name}/${model} returned an empty answer`); continue }
      return { text, model }
    }
    throw last ?? new Error(`${name}: no model answered`)
  }
}

async function callGemini(message: string, apiKey: string, system: string): Promise<Answer> {
  let last: Error | undefined
  // Two models at most: when Google is overloaded every model tends to be, so it's quicker to move on to the next service.
  const models = unique([MODELS.gemini, 'gemini-flash-latest', 'gemini-2.5-flash']).slice(0, 2)
  for (const model of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, // header, not URL, so it never lands in logs
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: message }] }] }),
    })
    if (!r.ok) {
      last = await refusal(`gemini/${model}`, r)
      if (RETRY_NEXT_MODEL.has(r.status)) continue
      throw last
    }
    const data = await r.json()
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')
    if (typeof text === 'string' && text.trim()) return { text, model }
    last = new Error(`gemini/${model} gave no answer (${data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? 'empty'})`)
  }
  throw last ?? new Error('gemini: no model answered')
}

interface Provider { name: string; key: () => string | undefined; call: (message: string, apiKey: string, system: string) => Promise<Answer> }

const ALL_PROVIDERS: Provider[] = [
  ...Object.entries(OPENAI_COMPATIBLE).map(([name, p]) => ({ name, key: () => compatibleKey(name), call: openAICompatible(name, p.baseUrl()) })),
  { name: 'gemini', key: () => cfg('GEMINI_API_KEY'), call: callGemini },
  { name: 'anthropic', key: () => cfg('ANTHROPIC_API_KEY'), call: callAnthropic },
  { name: 'openai', key: () => cfg('OPENAI_API_KEY'), call: openAICompatible('openai', 'https://api.openai.com/v1') },
]
// Free services first; whichever is configured and answering wins, so one running out of quota never stops the chat.
const PROVIDERS = orderByPreference(
  orderByPreference(ALL_PROVIDERS, (p) => p.name, DEFAULT_PROVIDER_ORDER.join(',')),
  (p) => p.name, cfg('AI_PROVIDER_ORDER'),
)

const admin = () => createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')

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
    const { data: count, error: usageError } = await db.rpc('increment_ai_usage', { p_user: user.id })
    if (usageError) throw usageError
    if (count > limit) {
      return json({
        error: paid ? 'Daily message limit reached. It resets at midnight UTC.' : 'Free daily limit reached. Upgrade to keep chatting.',
        code: paid ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED',
      }, 429, cors)
    }

    if (provider && provider !== 'auto' && !PROVIDERS.some((p) => p.name === provider)) return json({ error: 'Unknown provider' }, 400, cors)
    // The chosen provider goes first; the others stay as fallbacks so a choice that is down or not set up still gets an answer.
    const candidates = provider ? orderByPreference(PROVIDERS, (p) => p.name, provider) : PROVIDERS

    // The person's own wishes from "How the helper talks to you" (My account), e.g. a language or a shorter style.
    const { data: pref } = await db.from('ai_custom_instructions').select('instructions').eq('user_id', user.id).eq('is_active', true).maybeSingle()
    const wishes = String(pref?.instructions ?? '').trim().slice(0, 1000)
    const system = wishes
      ? `${SYSTEM_PROMPT}\n\nThis person has asked you to always keep the following in mind. Follow it, unless it would mean inventing facts or being unsafe:\n${wishes}`
      : SYSTEM_PROMPT

    const started = Date.now()
    for (const p of candidates) {
      const key = p.key()
      if (!key) continue
      try {
        const answer = await p.call(message, key, system)
        console.log(`ai-router: answered by ${p.name}/${answer.model} in ${Date.now() - started}ms`)
        return json({ response: answer.text, provider: p.name, model: answer.model, remaining: Math.max(0, limit - count) }, 200, cors)
      } catch (e) {
        console.error(`ai-router: ${p.name} failed:`, (e as Error).message)
      }
    }
    // Nobody answered: give the message back so a bad moment on the AI side doesn't use up the person's daily allowance.
    const { error: refundError } = await db.rpc('refund_ai_usage', { p_user: user.id })
    if (refundError) console.error('ai-router: refund failed:', refundError.message)
    return json({ error: 'The family history helper is busy right now. Please try again in a minute.' }, 503, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
