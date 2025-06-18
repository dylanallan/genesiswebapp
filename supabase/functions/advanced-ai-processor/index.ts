import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  prompt: string
  useCase: 'genealogy' | 'business' | 'creative' | 'analysis' | 'document' | 'voice' | 'coding'
  userId: string
  context?: any
  preferences?: {
    provider?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
  metadata?: any
}

interface AIProvider {
  name: string
  models: string[]
  capabilities: string[]
  costPerToken: number
  reliability: number
  speed: number
}

const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    capabilities: ['coding', 'business', 'analysis', 'creative'],
    costPerToken: 0.002,
    reliability: 0.95,
    speed: 0.9
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    capabilities: ['genealogy', 'analysis', 'document', 'creative'],
    costPerToken: 0.0015,
    reliability: 0.98,
    speed: 0.85
  },
  google: {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision'],
    capabilities: ['voice', 'creative', 'analysis'],
    costPerToken: 0.001,
    reliability: 0.92,
    speed: 0.95
  }
}

const USE_CASE_PROVIDER_MAPPING = {
  genealogy: ['anthropic', 'openai'],
  business: ['openai', 'anthropic'],
  creative: ['anthropic', 'openai', 'google'],
  analysis: ['anthropic', 'openai'],
  document: ['anthropic', 'openai'],
  voice: ['google', 'anthropic'],
  coding: ['openai', 'anthropic']
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const aiRequest: AIRequest = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get API keys and service configuration
    const { data: configs, error: configError } = await supabase
      .from('ai_service_config')
      .select('*')
      .eq('is_active', true)

    if (configError || !configs) {
      throw new Error('Failed to load AI service configuration')
    }

    // Create provider map with API keys
    const providerMap = configs.reduce((acc, config) => {
      acc[config.service_name] = config.api_key
      return acc
    }, {} as Record<string, string>)

    // Select optimal provider based on use case and preferences
    const selectedProvider = selectOptimalProvider(aiRequest, providerMap)
    
    if (!selectedProvider) {
      throw new Error('No suitable AI provider available')
    }

    // Process request with selected provider
    const result = await processWithProvider(aiRequest, selectedProvider, providerMap[selectedProvider])

    // Log the request and result
    await logAIRequest(supabase, {
      userId: aiRequest.userId,
      provider: selectedProvider,
      useCase: aiRequest.useCase,
      prompt: aiRequest.prompt,
      result: result,
      metadata: aiRequest.metadata
    })

    return new Response(
      JSON.stringify({
        success: true,
        provider: selectedProvider,
        result: result,
        metadata: {
          processingTime: Date.now(),
          tokensUsed: result.tokensUsed,
          cost: result.cost
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Advanced AI Processor Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function selectOptimalProvider(request: AIRequest, availableProviders: Record<string, string>): string | null {
  // If user has specific provider preference and it's available
  if (request.preferences?.provider && availableProviders[request.preferences.provider]) {
    return request.preferences.provider
  }

  // Get recommended providers for this use case
  const recommendedProviders = USE_CASE_PROVIDER_MAPPING[request.useCase] || []
  
  // Filter to only available providers
  const available = recommendedProviders.filter(provider => availableProviders[provider])
  
  if (available.length === 0) {
    return null
  }

  // Score providers based on multiple factors
  const providerScores = available.map(provider => {
    const providerInfo = AI_PROVIDERS[provider]
    const score = (
      providerInfo.reliability * 0.4 +
      providerInfo.speed * 0.3 +
      (1 - providerInfo.costPerToken * 1000) * 0.3
    )
    return { provider, score }
  })

  // Return the highest scoring provider
  return providerScores.sort((a, b) => b.score - a.score)[0].provider
}

async function processWithProvider(request: AIRequest, provider: string, apiKey: string): Promise<any> {
  const startTime = Date.now()
  
  try {
    let result: any

    switch (provider) {
      case 'openai':
        result = await processWithOpenAI(request, apiKey)
        break
      case 'anthropic':
        result = await processWithAnthropic(request, apiKey)
        break
      case 'google':
        result = await processWithGoogle(request, apiKey)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    const processingTime = Date.now() - startTime
    
    return {
      ...result,
      processingTime,
      provider
    }

  } catch (error) {
    console.error(`Error processing with ${provider}:`, error)
    throw error
  }
}

async function processWithOpenAI(request: AIRequest, apiKey: string): Promise<any> {
  const model = request.preferences?.model || 'gpt-4'
  const temperature = request.preferences?.temperature || 0.7
  const maxTokens = request.preferences?.maxTokens || 4096

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(request.useCase)
        },
        {
          role: 'user',
          content: request.prompt
        }
      ],
      temperature,
      max_tokens: maxTokens
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens,
    cost: calculateCost('openai', data.usage.total_tokens)
  }
}

async function processWithAnthropic(request: AIRequest, apiKey: string): Promise<any> {
  const model = request.preferences?.model || 'claude-3-opus'
  const temperature = request.preferences?.temperature || 0.7
  const maxTokens = request.preferences?.maxTokens || 4096

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: request.prompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      system: getSystemPrompt(request.useCase)
    })
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    content: data.content[0].text,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    cost: calculateCost('anthropic', data.usage.input_tokens + data.usage.output_tokens)
  }
}

async function processWithGoogle(request: AIRequest, apiKey: string): Promise<any> {
  const model = request.preferences?.model || 'gemini-pro'
  const temperature = request.preferences?.temperature || 0.7
  const maxTokens = request.preferences?.maxTokens || 4096

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${getSystemPrompt(request.useCase)}\n\n${request.prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    content: data.candidates[0].content.parts[0].text,
    tokensUsed: data.usageMetadata.totalTokenCount,
    cost: calculateCost('google', data.usageMetadata.totalTokenCount)
  }
}

function getSystemPrompt(useCase: string): string {
  const prompts = {
    genealogy: `You are an expert genealogist and family historian. Provide detailed, accurate analysis of family history, DNA results, and genealogical research. Focus on historical accuracy and cultural context.`,
    business: `You are a business consultant and automation expert. Help with business processes, automation strategies, and operational efficiency. Provide practical, actionable advice.`,
    creative: `You are a creative writing assistant specializing in family stories, cultural narratives, and personal memoirs. Help create engaging, meaningful content that preserves family heritage.`,
    analysis: `You are a data analyst and research specialist. Provide thorough analysis of documents, records, and information. Focus on patterns, insights, and actionable conclusions.`,
    document: `You are a document analysis expert. Help interpret, summarize, and extract key information from various types of documents and records.`,
    voice: `You are a voice and audio content specialist. Help create scripts, narratives, and content optimized for voice generation and audio storytelling.`,
    coding: `You are a software development expert. Help with coding, automation scripts, and technical implementation. Provide clean, efficient, and well-documented code.`
  }
  
  return prompts[useCase] || prompts.analysis
}

function calculateCost(provider: string, tokens: number): number {
  const providerInfo = AI_PROVIDERS[provider]
  return tokens * providerInfo.costPerToken
}

async function logAIRequest(supabase: any, logData: any): Promise<void> {
  try {
    await supabase
      .from('ai_request_logs')
      .insert({
        user_id: logData.userId,
        provider_id: logData.provider,
        success: true,
        request_data: {
          useCase: logData.useCase,
          prompt: logData.prompt,
          metadata: logData.metadata
        },
        response_data: {
          result: logData.result,
          tokensUsed: logData.result.tokensUsed,
          cost: logData.result.cost
        }
      })
  } catch (error) {
    console.error('Failed to log AI request:', error)
  }
} 