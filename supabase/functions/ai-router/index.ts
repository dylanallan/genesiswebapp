import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId, useCase } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get API keys from database
    const { data: configs } = await supabase
      .from('ai_service_config')
      .select('provider, api_key')

    const apiKeys = configs?.reduce((acc, config) => {
      acc[config.provider] = config.api_key
      return acc
    }, {} as Record<string, string>) || {}

    // Determine which AI provider to use based on use case
    let provider = 'openai' // default
    let model = 'gpt-3.5-turbo'

    if (useCase === 'business' || useCase === 'coding') {
      provider = 'openai'
      model = 'gpt-4'
    } else if (useCase === 'genealogy' || useCase === 'analysis' || useCase === 'creative' || useCase === 'document') {
      provider = 'anthropic'
      model = 'claude-3-opus'
    } else if (useCase === 'voice') {
      provider = 'google'
      model = 'gemini-pro'
    }

    // Check if we have the API key for the recommended provider
    if (!apiKeys[provider]) {
      // Fallback to any available provider
      if (apiKeys.openai) {
        provider = 'openai'
        model = 'gpt-3.5-turbo'
      } else if (apiKeys.anthropic) {
        provider = 'anthropic'
        model = 'claude-3-opus'
      } else if (apiKeys.google) {
        provider = 'google'
        model = 'gemini-pro'
      } else {
        // No API keys available, return fallback response
        return new Response(
          JSON.stringify({ 
            response: `I can help you with ${useCase} tasks! To get AI-powered responses, please add your API keys in the database configuration.`,
            provider: 'none',
            model: 'fallback'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    // Call the appropriate AI provider
    let aiResponse = ''
    
    try {
      if (provider === 'openai') {
        aiResponse = await callOpenAI(message, model, apiKeys.openai)
      } else if (provider === 'anthropic') {
        aiResponse = await callAnthropic(message, model, apiKeys.anthropic)
      } else if (provider === 'google') {
        aiResponse = await callGoogle(message, model, apiKeys.google)
      }
    } catch (error) {
      console.error(`Error calling ${provider}:`, error)
      aiResponse = `I apologize, but I encountered an error calling the ${provider} API. Please check your API key and try again.`
    }

    // Log the conversation
    if (userId) {
      await supabase
        .from('ai_conversation_history')
        .insert({
          user_id: userId,
          message: message,
          role: 'user'
        })

      await supabase
        .from('ai_conversation_history')
        .insert({
          user_id: userId,
          message: aiResponse,
          role: 'assistant'
        })
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        provider,
        model,
        useCase
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function callOpenAI(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant specializing in business automation, genealogy research, and technical development. Provide detailed, actionable responses.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callAnthropic(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callGoogle(message: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: message
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
} 