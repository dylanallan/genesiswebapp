import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { LlamaModel, LlamaContext, LlamaChatSession } from "npm:node-llama-cpp";
import { corsHeaders } from "../_shared/cors.ts";

const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'llama-3';
}

// Initialize Llama model
let llamaModel: LlamaModel | null = null;
let llamaContext: LlamaContext | null = null;
let llamaSession: LlamaChatSession | null = null;

async function initializeLlama() {
  if (!llamaModel) {
    llamaModel = new LlamaModel({
      modelPath: '/models/llama-3.2.gguf',
      contextSize: 16384,
      threads: 4
    });
    llamaContext = new LlamaContext({ model: llamaModel });
    llamaSession = new LlamaChatSession({ context: llamaContext });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json() as RequestBody;

    let response: ReadableStream;

    switch (model) {
      case 'gemini-pro': {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await geminiModel.generateContentStream(prompt);
        response = result.stream;
        break;
      }
      
      case 'llama-3': {
        await initializeLlama();
        if (!llamaSession) {
          throw new Error('Failed to initialize Llama session');
        }
        const stream = await llamaSession.streamingChat(prompt);
        response = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                controller.enqueue(new TextEncoder().encode(chunk));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });
        break;
      }

      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});