// AI services the app can use. Free tiers come first by default, so the app runs without paid keys:
// a self-hosted OmniRoute gateway (pools many free providers), Google Gemini, Groq, OpenRouter ":free"
// models, Mistral and NVIDIA. Paid Anthropic and OpenAI keys are used after them, or first if
// AI_PROVIDER_ORDER says so (comma-separated names, e.g. "anthropic,gemini").

export interface CompatibleProvider {
  baseUrl: () => string     // OpenAI-compatible base, ending in /v1
  keyEnv: string
  modelEnv: string
  defaultModel: string
  keyOptional?: boolean     // OmniRoute can run without client keys
}

export const OPENAI_COMPATIBLE: Record<string, CompatibleProvider> = {
  omniroute: { baseUrl: () => Deno.env.get('OMNIROUTE_BASE_URL') ?? '', keyEnv: 'OMNIROUTE_API_KEY', modelEnv: 'OMNIROUTE_MODEL', defaultModel: 'auto', keyOptional: true },
  groq: { baseUrl: () => 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY', modelEnv: 'GROQ_MODEL', defaultModel: 'llama-3.3-70b-versatile' },
  openrouter: { baseUrl: () => 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', defaultModel: 'meta-llama/llama-3.3-70b-instruct:free' },
  mistral: { baseUrl: () => 'https://api.mistral.ai/v1', keyEnv: 'MISTRAL_API_KEY', modelEnv: 'MISTRAL_MODEL', defaultModel: 'mistral-small-latest' },
  nvidia: { baseUrl: () => 'https://integrate.api.nvidia.com/v1', keyEnv: 'NVIDIA_API_KEY', modelEnv: 'NVIDIA_MODEL', defaultModel: 'meta/llama-3.3-70b-instruct' },
}

export const DEFAULT_PROVIDER_ORDER = ['omniroute', 'gemini', 'groq', 'openrouter', 'mistral', 'nvidia', 'anthropic', 'openai']

// The key to send, or undefined when the service is not set up. OmniRoute only needs its URL.
export function compatibleKey(name: string): string | undefined {
  const p = OPENAI_COMPATIBLE[name]
  if (!p || !p.baseUrl()) return undefined
  return Deno.env.get(p.keyEnv) || (p.keyOptional ? 'none' : undefined)
}

export const compatibleModel = (name: string) => Deno.env.get(OPENAI_COMPATIBLE[name].modelEnv) ?? OPENAI_COMPATIBLE[name].defaultModel

// Names listed in `order` go first (in that order); everything else keeps its place after them.
export function orderByPreference<T>(items: T[], nameOf: (item: T) => string, order: string | undefined): T[] {
  const wanted = (order ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (wanted.length === 0) return items
  const rank = (item: T) => { const i = wanted.indexOf(nameOf(item)); return i === -1 ? wanted.length : i }
  return [...items].sort((a, b) => rank(a) - rank(b))
}

export const providerOrder = () => orderByPreference(DEFAULT_PROVIDER_ORDER, (n) => n, Deno.env.get('AI_PROVIDER_ORDER'))
