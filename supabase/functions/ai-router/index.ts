import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Simple AI provider calling functions
async function callOpenAI(message: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4', messages: [{ role: 'user', content: message }] }),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(message: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-opus-20240229', max_tokens: 1024, messages: [{ role: 'user', content: message }] }),
  });
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(message: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json();
    if (!message) throw new Error('No message provided.');
    
    // Define providers and their callers
    const providers = [
      { name: 'openai', key: Deno.env.get("OPENAI_API_KEY"), call: callOpenAI },
      { name: 'gemini', key: Deno.env.get("GEMINI_API_KEY"), call: callGemini },
      { name: 'anthropic', key: Deno.env.get("ANTHROPIC_API_KEY"), call: callAnthropic },
    ];

    // Iterate through providers and try to get a response
    for (const provider of providers) {
      if (provider.key) {
        try {
          console.log(`Attempting to call ${provider.name}...`);
          const response = await provider.call(message, provider.key);
          console.log(`${provider.name} succeeded!`);
          
          return new Response(
            JSON.stringify({ response, provider: provider.name }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );

        } catch (error) {
          console.error(`Error calling ${provider.name}:`, error.message);
          // If a provider fails, just continue to the next one
          continue;
        }
      }
    }
    
    // If all providers fail
    throw new Error('All AI providers failed or are not configured.');

  } catch (error) {
    console.error('Error in ai-router:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 