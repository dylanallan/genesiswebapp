import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireCaller, json, errorResponse } from '../_shared/auth.ts'
import { callAI, getAIProvider, type AIMessage } from '../_shared/ai-utils.ts'

// Use-case aware AI processing. Provider keys come only from function secrets (never the database).
type UseCase = 'genealogy' | 'business' | 'creative' | 'analysis' | 'document' | 'voice' | 'coding'
type Provider = 'openai' | 'anthropic' | 'gemini'

interface AIRequest {
  prompt: string
  useCase: UseCase
  userId?: string // honored only for trusted internal calls
  context?: unknown
  preferences?: { provider?: string; temperature?: number; maxTokens?: number }
  metadata?: unknown
}

const USE_CASE_PROVIDERS: Record<UseCase, Provider[]> = {
  genealogy: ['anthropic', 'openai', 'gemini'],
  business: ['openai', 'anthropic', 'gemini'],
  creative: ['anthropic', 'openai', 'gemini'],
  analysis: ['anthropic', 'openai', 'gemini'],
  document: ['anthropic', 'openai', 'gemini'],
  voice: ['gemini', 'anthropic', 'openai'],
  coding: ['openai', 'anthropic', 'gemini'],
}

const SYSTEM_PROMPTS: Record<UseCase, string> = {
  genealogy: 'You are an expert genealogist. Cite which facts come from the user and flag anything uncertain.',
  business: 'You are a practical small-business advisor. Give concrete, actionable steps.',
  creative: 'You are a warm, skilled storyteller.',
  analysis: 'You are a careful analyst. Separate facts from inferences.',
  document: 'You extract and summarize information from historical documents accurately.',
  voice: 'Write text that sounds natural when read aloud.',
  coding: 'You are a senior software engineer. Be precise.',
}

const normalizeProvider = (p?: string): Provider | undefined =>
  p === 'google' ? 'gemini' : p === 'openai' || p === 'anthropic' || p === 'gemini' ? p : undefined

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const caller = await requireCaller(req)
    const body: AIRequest = await req.json()
    if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 16000) {
      return json({ success: false, error: 'A prompt (max 16000 characters) is required' }, 400, cors)
    }
    const useCase: UseCase = body.useCase in USE_CASE_PROVIDERS ? body.useCase : 'analysis'
    const userId = caller.internal ? body.userId ?? null : caller.userId

    const preferred = normalizeProvider(body.preferences?.provider)
    const order = [...new Set([...(preferred ? [preferred] : []), ...USE_CASE_PROVIDERS[useCase]])]
      .filter((p) => getAIProvider(p))
    if (order.length === 0) return json({ success: false, error: 'No AI provider is configured' }, 503, cors)

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS[useCase] },
      ...(body.context ? [{ role: 'system' as const, content: `Context: ${JSON.stringify(body.context).slice(0, 8000)}` }] : []),
      { role: 'user', content: body.prompt },
    ]
    const opts = {
      temperature: Math.min(1, Math.max(0, Number(body.preferences?.temperature ?? 0.7))),
      maxTokens: Math.min(4000, Math.max(64, Number(body.preferences?.maxTokens ?? 1500))),
    }

    const started = Date.now()
    let lastError: unknown
    for (const provider of order) {
      try {
        const res = await callAI({ messages, provider, ...opts })
        const result = {
          content: res.content,
          model: res.model,
          tokensUsed: res.usage?.total_tokens ?? ((res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0)),
          processingTime: Date.now() - started,
          provider,
        }
        if (userId) {
          const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
          const { error } = await db.from('ai_request_logs').insert({
            user_id: userId,
            provider_id: provider,
            success: true,
            request_data: { useCase, prompt: body.prompt.slice(0, 2000), metadata: body.metadata ?? null },
            response_data: { tokensUsed: result.tokensUsed, model: result.model },
          })
          if (error) console.error('Failed to log AI request:', (error instanceof Error ? error.message : String(error)))
        }
        return json({ success: true, provider, result, metadata: { processingTime: result.processingTime, tokensUsed: result.tokensUsed } }, 200, cors)
      } catch (e) {
        lastError = e
        console.error(`advanced-ai-processor: ${provider} failed`, (e as Error).message)
      }
    }
    console.error('All providers failed', lastError)
    return json({ success: false, error: 'The AI service is temporarily unavailable. Please try again.' }, 503, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
