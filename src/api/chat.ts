import { supabase } from '../lib/supabase';

// For Gemini (Google) - This is working!
const GEMINI_MODEL = 'models/gemini-1.5-flash';

// For OpenAI - This is working!
const OPENAI_MODEL = 'gpt-3.5-turbo';

// For Anthropic - This needs a valid key
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.warn('Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file for full functionality.');
}

export interface ChatMessage {
  id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  provider?: string;
  model?: string;
  created_at: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  provider: string;
  model: string;
  timestamp: string;
}

export interface ConversationInfo {
  conversation_id: string;
  title: string;
  last_message: string;
  message_count: number;
  last_updated: string;
}

// Direct OpenAI call function
async function callOpenAIDirect(message: string, model: string = OPENAI_MODEL): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🔍 Calling OpenAI with model:', model);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ OpenAI response received');
  return data.choices[0].message.content;
}

// Direct Gemini call function
async function callGeminiDirect(message: string, model: string = GEMINI_MODEL): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  console.log('🔍 Calling Gemini with model:', model);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Gemini response received');
  return data.candidates[0].content.parts[0].text;
}

// Smart AI router - tries providers in order of preference
async function callAI(message: string, preferredProvider?: string, preferredModel?: string): Promise<{ response: string; provider: string; model: string }> {
  console.log('🧠 Smart AI Router called with:', { message: message.substring(0, 50) + '...', preferredProvider, preferredModel });
  console.log('🔑 Environment check:', {
    openai: !!import.meta.env.VITE_OPENAI_API_KEY,
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    anthropic: !!import.meta.env.VITE_ANTHROPIC_API_KEY
  });
  
  const providers = [
    { name: 'openai', test: () => import.meta.env.VITE_OPENAI_API_KEY, call: callOpenAIDirect, defaultModel: OPENAI_MODEL },
    { name: 'gemini', test: () => import.meta.env.VITE_GEMINI_API_KEY, call: callGeminiDirect, defaultModel: GEMINI_MODEL }
  ];

  // If a specific provider is requested, try it first
  if (preferredProvider) {
    const provider = providers.find(p => p.name === preferredProvider);
    if (provider && provider.test()) {
      try {
        console.log(`🎯 Trying requested provider: ${provider.name}`);
        const response = await provider.call(message, preferredModel || provider.defaultModel);
        console.log(`✅ ${provider.name} succeeded!`);
        return { response, provider: provider.name, model: preferredModel || provider.defaultModel };
      } catch (error) {
        console.warn(`${provider.name} failed, trying others...`, error);
      }
    }
  }

  // Try providers in order
  for (const provider of providers) {
    if (provider.test()) {
      try {
        console.log(`🔍 Trying ${provider.name}...`);
        const response = await provider.call(message, preferredModel || provider.defaultModel);
        console.log(`✅ ${provider.name} succeeded!`);
        return { response, provider: provider.name, model: preferredModel || provider.defaultModel };
      } catch (error) {
        console.warn(`${provider.name} failed, trying next...`, error);
        continue;
      }
    }
  }

  // Fallback response
  console.warn('❌ No AI providers available, using fallback');
  throw new Error('No AI providers available');
}

export const chatApi = {
  async sendMessage(
    message: string, 
    conversationId?: string,
    provider?: 'openai' | 'anthropic' | 'gemini' | 'auto',
    model?: string
  ): Promise<ChatResponse> {
    console.log('📤 Chat API sendMessage called:', { message: message.substring(0, 50) + '...', conversationId, provider, model });
    
    try {
      // Restore authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get AI response using smart router
      let aiResult;
      try {
        aiResult = await callAI(message, provider, model);
        console.log('🎉 AI response generated:', { provider: aiResult.provider, model: aiResult.model, responseLength: aiResult.response.length });
      } catch (error) {
        console.error('AI call failed:', error);
        // Fallback response
        aiResult = {
          response: "I'm here to help! I'm your Genesis AI assistant. How can I assist you with your genealogy research, business automation, or cultural heritage preservation today?",
          provider: 'fallback',
          model: 'fallback'
        };
      }

      // Create or get conversation ID
      const newConversationId = conversationId || crypto.randomUUID();

      // Restore database storage
      try {
        // Store user message
        await supabase
          .from('ai_conversation_history')
          .insert({
            user_id: user.id,
            conversation_id: newConversationId,
            message: message,
            role: 'user',
            provider: aiResult.provider,
            model: aiResult.model
          });

        // Store AI response
        await supabase
          .from('ai_conversation_history')
          .insert({
            user_id: user.id,
            conversation_id: newConversationId,
            message: aiResult.response,
            role: 'assistant',
            provider: aiResult.provider,
            model: aiResult.model
          });
      } catch (dbError) {
        console.warn('Database storage failed, but continuing:', dbError);
      }

      return {
        response: aiResult.response,
        conversationId: newConversationId,
        provider: aiResult.provider,
        model: aiResult.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  async getHistory(conversationId?: string): Promise<ChatMessage[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_chat_history', {
        user_uuid: user.id,
        conversation_id: conversationId || null
      });

      if (error) {
        console.error('Chat history RPC error:', error);
        throw new Error('Failed to fetch chat history');
      }

      return data || [];
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  async getConversationList(): Promise<ConversationInfo[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_conversation_list', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Conversation list RPC error:', error);
        throw new Error('Failed to fetch conversation list');
      }

      return data || [];
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  async createConversation(title?: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('create_conversation', {
        user_uuid: user.id,
        title: title || null
      });

      if (error) {
        console.error('Create conversation RPC error:', error);
        throw new Error('Failed to create conversation');
      }

      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('delete_conversation', {
        user_uuid: user.id,
        conversation_id: conversationId
      });

      if (error) {
        console.error('Delete conversation RPC error:', error);
        throw new Error('Failed to delete conversation');
      }

      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  // Get available AI models
  getAvailableModels() {
    return [
      { id: 'auto', name: 'Auto-Select (Best Available)', description: 'Automatically chooses the best AI provider', provider: 'auto' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning and analysis', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient', provider: 'openai' },
      { id: 'models/gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile', provider: 'gemini' },
      { id: 'models/gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced capabilities', provider: 'gemini' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Nuanced understanding (requires valid key)', provider: 'anthropic' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance (requires valid key)', provider: 'anthropic' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast responses (requires valid key)', provider: 'anthropic' }
    ];
  }
};