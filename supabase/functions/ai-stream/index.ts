import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";
import { Anthropic } from "npm:@anthropic-ai/sdk@0.17.1";
import { corsHeaders } from "../_shared/cors.ts";

// Environment variables
const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
const openaiKey = Deno.env.get('OPENAI_API_KEY') || '';
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || '';

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-1.5-pro';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  type?: 'chat' | 'analysis' | 'generation' | 'coding' | 'business' | 'cultural' | 'creative' | 'technical' | 'research';
}

function getSystemPrompt(type?: string): string {
  switch (type) {
    case 'business':
      return "You are a business automation and consulting specialist. Provide practical, actionable advice for improving business processes and efficiency. Focus on ROI, scalability, and sustainable growth strategies.";
    case 'cultural':
      return "You are a cultural heritage specialist. Help users explore and integrate their cultural background into modern life while preserving traditions. Be respectful and knowledgeable about diverse cultures.";
    case 'coding':
      return "You are a programming expert. Provide clear, well-documented code solutions and explain best practices. Focus on clean, maintainable, and efficient code.";
    case 'analysis':
      return "You are an analytical expert. Provide thorough, well-reasoned analysis with clear conclusions and recommendations. Use data-driven insights when possible.";
    case 'creative':
      return "You are a creative specialist. Help with creative projects, storytelling, design thinking, and innovative solutions. Be imaginative while staying practical.";
    case 'research':
      return "You are a research specialist. Provide comprehensive, well-sourced information and analysis. Focus on accuracy, depth, and current information.";
    case 'technical':
      return "You are a technical specialist. Provide detailed technical guidance, troubleshooting, and solutions. Focus on accuracy and practical implementation.";
    default:
      return "You are a helpful AI assistant. Provide clear, accurate, and useful responses.";
  }
}

async function createFallbackResponse(prompt: string, error: Error): Promise<ReadableStream> {
  console.warn(`Using fallback response due to error: ${error.message}`);
  
  const fallbackText = `I apologize, but I'm currently experiencing technical difficulties processing your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}".

The specific error was: ${error.message}

Here are some options:
1. Try again in a few moments
2. Try a different AI model
3. Simplify your request or break it into smaller parts

Our team has been notified of this issue and is working to resolve it.`;

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const chunks = fallbackText.split('. ');
      
      let i = 0;
      function sendNextChunk() {
        if (i < chunks.length) {
          controller.enqueue(encoder.encode(chunks[i] + (i < chunks.length - 1 ? '. ' : '')));
          i++;
          setTimeout(sendNextChunk, 100);
        } else {
          controller.close();
        }
      }
      
      sendNextChunk();
    }
  });
}

async function streamOpenAI(prompt: string, systemPrompt: string, model: string, temperature: number, maxTokens: number): Promise<ReadableStream> {
  if (!openaiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  const openai = new OpenAI({ apiKey: openaiKey });
  
  const stream = await openai.chat.completions.create({
    model: model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    stream: true,
    temperature,
    max_tokens: maxTokens
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        console.error("OpenAI streaming error:", error);
        controller.error(error);
      }
    }
  });
}

async function streamAnthropic(prompt: string, systemPrompt: string, model: string, temperature: number, maxTokens: number): Promise<ReadableStream> {
  if (!anthropicKey) {
    throw new Error("Anthropic API key not configured");
  }
  
  const anthropic = new Anthropic({ apiKey: anthropicKey });
  
  const stream = await anthropic.messages.stream({
    model: model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ 
      role: 'user', 
      content: `${systemPrompt}\n\n${prompt}` 
    }]
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        console.error("Anthropic streaming error:", error);
        controller.error(error);
      }
    }
  });
}

async function streamGemini(prompt: string, systemPrompt: string, model: string, temperature: number): Promise<ReadableStream> {
  if (!geminiKey) {
    throw new Error("Gemini API key not configured");
  }
  
  const genAI = new GoogleGenerativeAI(geminiKey);
  const geminiModel = genAI.getGenerativeModel({ 
    model: model === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-pro',
    generationConfig: {
      temperature
    }
  });
  
  const result = await geminiModel.generateContentStream(`${systemPrompt}\n\n${prompt}`);
  
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (error) {
        console.error("Gemini streaming error:", error);
        controller.error(error);
      }
    }
  });
}

function createTextStream(text: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const words = text.split(' ');
      let index = 0;
      
      const sendWord = () => {
        if (index < words.length) {
          controller.enqueue(encoder.encode(words[index] + ' '));
          index++;
          setTimeout(sendWord, 50);
        } else {
          controller.close();
        }
      };
      
      sendWord();
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { 
      prompt, 
      model = 'gpt-4', 
      systemPrompt: customSystemPrompt,
      temperature = 0.7,
      maxTokens = 2048,
      type
    } = await req.json() as RequestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    // Get appropriate system prompt
    const systemPrompt = customSystemPrompt || getSystemPrompt(type);
    
    // Stream response based on selected model
    let response: ReadableStream;
    
    // Add timeout for all API calls
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 30000); // 30 second timeout
    });
    
    const responsePromise = (async () => {
      switch (model) {
        case 'gpt-4':
        case 'gpt-3.5-turbo':
          return await streamOpenAI(prompt, systemPrompt, model, temperature, maxTokens);
          
        case 'claude-3-opus':
        case 'claude-3-sonnet':
        case 'claude-3-haiku':
          return await streamAnthropic(prompt, systemPrompt, model, temperature, maxTokens);
          
        case 'gemini-pro':
        case 'gemini-1.5-pro':
          return await streamGemini(prompt, systemPrompt, model, temperature);
          
        default:
          throw new Error(`Unsupported model: ${model}`);
      }
    })();
    
    try {
      response = await Promise.race([responsePromise, timeoutPromise]);
    } catch (error) {
      console.error(`Error with ${model}:`, error);
      
      // Try fallback model if primary fails
      if (model !== 'gpt-3.5-turbo') {
        console.log(`Falling back to gpt-3.5-turbo from ${model}`);
        try {
          response = await streamOpenAI(prompt, systemPrompt, 'gpt-3.5-turbo', temperature, maxTokens);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          response = await createFallbackResponse(prompt, error);
        }
      } else {
        response = await createFallbackResponse(prompt, error);
      }
    }

    // Return streaming response
    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      },
    });
  } catch (error) {
    console.error('Request processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});