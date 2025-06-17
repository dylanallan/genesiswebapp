import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";
import { Anthropic } from "npm:@anthropic-ai/sdk@0.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  prompt: string;
  sessionId: string;
  model?: string;
  context?: string;
  type?: string;
  maxTokens?: number;
  temperature?: number;
  includeHistory?: boolean;
  includeUserContext?: boolean;
  includeCustomInstructions?: boolean;
  includeSemanticSearch?: boolean;
  semanticSearchThreshold?: number;
  semanticSearchCount?: number;
}

interface UserContext {
  ancestry?: string;
  businessGoals?: string;
  culturalBackground?: string;
  familyTraditions?: string;
  businessType?: string;
  industryFocus?: string;
}

async function getUserContext(userId: string): Promise<UserContext> {
  try {
    const { data, error } = await supabase.rpc('get_user_profile', {
      p_user_id: userId
    });

    if (error) throw error;
    
    return {
      ancestry: data?.preferences?.ancestry,
      businessGoals: data?.preferences?.businessGoals,
      culturalBackground: data?.preferences?.culturalBackground,
      familyTraditions: data?.preferences?.familyTraditions,
      businessType: data?.preferences?.businessType,
      industryFocus: data?.preferences?.industryFocus
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return {};
  }
}

async function getConversationHistory(userId: string, sessionId: string, limit = 10): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('get_conversation_context', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_max_messages: limit
    });

    if (error) throw error;
    
    if (!data || data.length === 0) return '';
    
    // Format conversation history
    return data.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n');
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return '';
  }
}

async function getCustomInstructions(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_custom_instructions')
      .select('instructions')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) return '';
    
    return data?.instructions || '';
  } catch (error) {
    console.error('Error getting custom instructions:', error);
    return '';
  }
}

async function findSimilarContent(userId: string, prompt: string, threshold = 0.7, count = 5): Promise<string> {
  try {
    // Get embedding for the prompt
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: prompt,
      encoding_format: "float"
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Find similar content
    const { data, error } = await supabase.rpc('find_similar_content', {
      p_embedding: embedding,
      p_match_threshold: threshold,
      p_match_count: count,
      p_user_id: userId
    });

    if (error) throw error;
    
    if (!data || data.length === 0) return '';
    
    // Format similar content
    return data.map((item: any) => 
      `RELEVANT CONTENT (${item.content_type}): ${item.content.substring(0, 300)}${item.content.length > 300 ? '...' : ''}`
    ).join('\n\n');
  } catch (error) {
    console.error('Error finding similar content:', error);
    return '';
  }
}

async function storeConversation(userId: string, sessionId: string, role: string, content: string, model?: string): Promise<void> {
  try {
    // Get the latest message index
    const { data: lastMessage, error: indexError } = await supabase
      .from('ai_conversation_history')
      .select('message_index')
      .eq('session_id', sessionId)
      .order('message_index', { ascending: false })
      .limit(1);
    
    const messageIndex = lastMessage && lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 0;
    
    // Generate embedding for the message
    let embedding = null;
    try {
      const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
        encoding_format: "float"
      });
      
      embedding = embeddingResponse.data[0].embedding;
    } catch (embeddingError) {
      console.error('Error generating embedding:', embeddingError);
    }
    
    // Store the message
    const { error } = await supabase
      .from('ai_conversation_history')
      .insert({
        user_id: userId,
        session_id: sessionId,
        message_index: messageIndex,
        role,
        content,
        model_used: model,
        tokens_used: Math.ceil(content.length / 4), // Rough estimate
        embedding,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
}

function getSystemPrompt(type?: string, userContext?: UserContext, customInstructions?: string): string {
  let basePrompt = "You are Genesis AI Assistant Pro, an advanced AI assistant with expertise in both business automation and cultural heritage preservation.";
  
  // Add user context if available
  if (userContext) {
    if (userContext.ancestry) {
      basePrompt += `\n\nThe user has shared their ancestry as: ${userContext.ancestry}.`;
    }
    
    if (userContext.businessGoals) {
      basePrompt += `\n\nThe user's business goals are: ${userContext.businessGoals}.`;
    }
    
    if (userContext.culturalBackground) {
      basePrompt += `\n\nThe user's cultural background includes: ${userContext.culturalBackground}.`;
    }
    
    if (userContext.familyTraditions) {
      basePrompt += `\n\nThe user has shared these family traditions: ${userContext.familyTraditions}.`;
    }
    
    if (userContext.businessType) {
      basePrompt += `\n\nThe user's business type is: ${userContext.businessType}.`;
    }
    
    if (userContext.industryFocus) {
      basePrompt += `\n\nThe user's industry focus is: ${userContext.industryFocus}.`;
    }
  }
  
  // Add type-specific instructions
  switch (type) {
    case 'business':
      basePrompt += "\n\nYou are a business automation and consulting specialist. Provide practical, actionable advice for improving business processes and efficiency. Focus on ROI, scalability, and sustainable growth strategies.";
      break;
    case 'cultural':
      basePrompt += "\n\nYou are a cultural heritage specialist. Help users explore and integrate their cultural background into modern life while preserving traditions. Be respectful and knowledgeable about diverse cultures.";
      break;
    case 'coding':
      basePrompt += "\n\nYou are a programming expert. Provide clear, well-documented code solutions and explain best practices. Focus on clean, maintainable, and efficient code.";
      break;
    case 'analysis':
      basePrompt += "\n\nYou are an analytical expert. Provide thorough, well-reasoned analysis with clear conclusions and recommendations. Use data-driven insights when possible.";
      break;
    case 'creative':
      basePrompt += "\n\nYou are a creative specialist. Help with creative projects, storytelling, design thinking, and innovative solutions. Be imaginative while staying practical.";
      break;
    case 'research':
      basePrompt += "\n\nYou are a research specialist. Provide comprehensive, well-sourced information and analysis. Focus on accuracy, depth, and current information.";
      break;
    case 'technical':
      basePrompt += "\n\nYou are a technical specialist. Provide detailed technical guidance, troubleshooting, and solutions. Focus on accuracy and practical implementation.";
      break;
  }
  
  // Add custom instructions if available
  if (customInstructions) {
    basePrompt += `\n\nCustom Instructions: ${customInstructions}`;
  }
  
  return basePrompt;
}

async function determineRequestType(prompt: string): Promise<string> {
  const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency', 'process', 'optimization', 'revenue', 'profit', 'marketing', 'sales'];
  const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family', 'cultural', 'identity', 'genealogy', 'ethnicity', 'customs', 'ritual', 'ceremony', 'ancestor'];
  const codingKeywords = ['code', 'programming', 'function', 'api', 'development', 'debug', 'algorithm', 'software', 'javascript', 'python', 'react', 'typescript', 'html', 'css', 'sql', 'git'];
  const analysisKeywords = ['analyze', 'analysis', 'compare', 'evaluate', 'research', 'study', 'examine', 'investigate', 'assess', 'review', 'data', 'statistics', 'metrics'];
  const creativeKeywords = ['creative', 'design', 'story', 'write', 'content', 'marketing', 'brand', 'narrative', 'artistic', 'imagination', 'brainstorm'];
  
  const lowerPrompt = prompt.toLowerCase();
  
  if (businessKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'business';
  }
  
  if (culturalKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'cultural';
  }
  
  if (codingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'coding';
  }
  
  if (analysisKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'analysis';
  }
  
  if (creativeKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'creative';
  }
  
  return 'general';
}

async function selectBestModel(type: string, prompt: string): Promise<string> {
  switch (type) {
    case 'business':
      return 'gpt-4';
    case 'cultural':
      return 'claude-3-opus';
    case 'coding':
      return 'gpt-4';
    case 'analysis':
      return 'claude-3-opus';
    case 'creative':
      return 'claude-3-opus';
    case 'research':
      return 'claude-3-opus';
    case 'technical':
      return 'gpt-4';
    default:
      // For general queries, use a simpler model
      return prompt.length > 500 ? 'gpt-4' : 'gpt-3.5-turbo';
  }
}

async function generateResponse(model: string, systemPrompt: string, prompt: string, conversationHistory: string, relevantContent: string, maxTokens: number = 2000): Promise<ReadableStream> {
  // Prepare the full prompt with context
  let fullPrompt = prompt;
  
  if (relevantContent) {
    fullPrompt = `Here is some relevant information that might help with your response:\n\n${relevantContent}\n\n${prompt}`;
  }
  
  // Add conversation history if available
  const messages = [];
  if (conversationHistory) {
    const historyLines = conversationHistory.split('\n\n');
    for (const line of historyLines) {
      const [role, content] = line.split(': ', 2);
      if (role && content) {
        messages.push({
          role: role === 'user' ? 'user' : 'assistant',
          content
        });
      }
    }
  }
  
  switch (model) {
    case 'gpt-4':
    case 'gpt-3.5-turbo': {
      const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
      
      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: fullPrompt }
      ];
      
      const stream = await openai.chat.completions.create({
        model: model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
        messages: allMessages,
        stream: true,
        max_tokens: maxTokens
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    case 'claude-3-opus':
    case 'claude-3-sonnet':
    case 'claude-3-haiku': {
      const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
      
      // Format conversation history for Claude
      const claudeMessages = [];
      for (const msg of messages) {
        claudeMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
      
      // Add the current message
      claudeMessages.push({
        role: 'user',
        content: fullPrompt
      });
      
      const stream = await anthropic.messages.stream({
        model: model,
        system: systemPrompt,
        messages: claudeMessages,
        max_tokens: maxTokens
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    case 'gemini-pro': {
      const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Format conversation history for Gemini
      let geminiPrompt = systemPrompt + "\n\n";
      
      if (messages.length > 0) {
        for (const msg of messages) {
          geminiPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
        }
      }
      
      geminiPrompt += `User: ${fullPrompt}\n\nAssistant:`;
      
      const result = await model.generateContentStream(geminiPrompt);
      
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { 
      prompt,
      sessionId = crypto.randomUUID(),
      model,
      context,
      type,
      maxTokens = 2000,
      temperature = 0.7,
      includeHistory = true,
      includeUserContext = true,
      includeCustomInstructions = true,
      includeSemanticSearch = true,
      semanticSearchThreshold = 0.7,
      semanticSearchCount = 5
    } = await req.json() as RequestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    // Store user message
    await storeConversation(user.id, sessionId, 'user', prompt);
    
    // Determine request type if not provided
    const requestType = type || await determineRequestType(prompt);
    
    // Select best model if not specified
    const selectedModel = model || await selectBestModel(requestType, prompt);
    
    // Get user context if requested
    const userContext = includeUserContext ? await getUserContext(user.id) : undefined;
    
    // Get custom instructions if requested
    const customInstructions = includeCustomInstructions ? await getCustomInstructions(user.id) : undefined;
    
    // Get conversation history if requested
    const conversationHistory = includeHistory ? await getConversationHistory(user.id, sessionId) : '';
    
    // Get relevant content through semantic search if requested
    const relevantContent = includeSemanticSearch ? 
      await findSimilarContent(user.id, prompt, semanticSearchThreshold, semanticSearchCount) : '';
    
    // Generate system prompt
    const systemPrompt = getSystemPrompt(requestType, userContext, customInstructions);
    
    // Generate response
    const responseStream = await generateResponse(
      selectedModel,
      systemPrompt,
      prompt,
      conversationHistory,
      relevantContent,
      maxTokens
    );
    
    // Create a new stream that captures the response for storage
    const responseChunks: Uint8Array[] = [];
    
    const captureStream = new TransformStream({
      transform(chunk, controller) {
        responseChunks.push(chunk);
        controller.enqueue(chunk);
      },
      flush(controller) {
        // When the stream is done, store the complete response
        const completeResponse = new TextDecoder().decode(
          new Uint8Array(responseChunks.reduce((acc, chunk) => [...acc, ...chunk], []))
        );
        
        // Store assistant response
        storeConversation(user.id, sessionId, 'assistant', completeResponse, selectedModel);
      }
    });
    
    return new Response(responseStream.pipeThrough(captureStream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Session-ID': sessionId,
        'X-AI-Model': selectedModel
      }
    });
  } catch (error) {
    console.error('Enhanced AI Assistant Error:', error);
    
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