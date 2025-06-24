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

async function callOllama(message: string, apiUrl: string): Promise<string> {
  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3:70b', messages: [{ role: 'user', content: message }] }),
  });
  if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
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
    const { message, provider } = await req.json();
    if (!message) throw new Error('No message provided.');
    
    // Define providers and their callers
    const providers = [
      { name: 'anthropic', key: Deno.env.get("ANTHROPIC_API_KEY"), call: callAnthropic },
      { name: 'openai', key: Deno.env.get("OPENAI_API_KEY"), call: callOpenAI },
      { name: 'gemini', key: Deno.env.get("GEMINI_API_KEY"), call: callGemini },
      { name: 'ollama', key: Deno.env.get("OLLAMA_API_URL") || 'http://localhost:11434', call: callOllama },
    ];

    if (provider) {
      // If a provider is specified, use only that provider
      const selected = providers.find(p => p.name === provider);
      if (!selected || !selected.key) throw new Error(`Provider ${provider} not configured.`);
      const response = await selected.call(message, selected.key);
      return new Response(
        JSON.stringify({ response, provider: selected.name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Otherwise, try all providers in order
    for (const p of providers) {
      if (p.key) {
        try {
          console.log(`Attempting to call ${p.name}...`);
          const response = await p.call(message, p.key);
          console.log(`${p.name} succeeded!`);
          return new Response(
            JSON.stringify({ response, provider: p.name }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } catch (error) {
          console.error(`Error calling ${p.name}:`, error.message);
          continue;
        }
      }
    }
    throw new Error('All AI providers failed or are not configured.');
  } catch (error) {
    console.error('Error in ai-router:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 