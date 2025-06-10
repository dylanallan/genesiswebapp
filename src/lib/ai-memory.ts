import { supabase } from './supabase';

interface MemoryOptions {
  sessionId?: string;
  maxMessages?: number;
  includeSystemMessages?: boolean;
}

/**
 * AI Memory System for storing and retrieving conversation history
 */
export class AIMemory {
  private sessionId: string;
  private maxMessages: number;
  private includeSystemMessages: boolean;

  constructor(options: MemoryOptions = {}) {
    this.sessionId = options.sessionId || crypto.randomUUID();
    this.maxMessages = options.maxMessages || 10;
    this.includeSystemMessages = options.includeSystemMessages || false;
  }

  /**
   * Store a message in the conversation history
   */
  async storeMessage(role: 'user' | 'assistant' | 'system', content: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      // Get the latest message index
      const { data: lastMessage, error: indexError } = await supabase
        .from('ai_conversation_history')
        .select('message_index')
        .eq('session_id', this.sessionId)
        .order('message_index', { ascending: false })
        .limit(1);
      
      const messageIndex = lastMessage && lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 0;
      
      // Generate embedding for the message if it's not a system message
      let embedding = null;
      if (role !== 'system') {
        try {
          // In a real implementation, this would call the OpenAI API
          // For now, we'll just simulate it
          embedding = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        } catch (embeddingError) {
          console.error('Error generating embedding:', embeddingError);
        }
      }
      
      // Store the message
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          session_id: this.sessionId,
          message_index: messageIndex,
          role,
          content,
          embedding,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error storing message:', error);
      throw error;
    }
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(): Promise<{role: string, content: string, timestamp: Date}[]> {
    try {
      let query = supabase
        .from('ai_conversation_history')
        .select('role, content, created_at')
        .eq('session_id', this.sessionId)
        .order('message_index', { ascending: true });
      
      if (!this.includeSystemMessages) {
        query = query.neq('role', 'system');
      }
      
      const { data, error } = await query.limit(this.maxMessages);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        role: item.role,
        content: item.content,
        timestamp: new Date(item.created_at)
      }));
    } catch (error) {
      console.error('Error retrieving conversation history:', error);
      return [];
    }
  }

  /**
   * Get formatted conversation history for AI context
   */
  async getFormattedHistory(): Promise<string> {
    const history = await this.getConversationHistory();
    
    if (history.length === 0) return '';
    
    return history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Search for relevant messages in conversation history
   */
  async searchMemory(query: string, limit: number = 3): Promise<{role: string, content: string, similarity: number}[]> {
    try {
      // In a real implementation, this would use vector similarity search
      // For now, we'll just do a simple text search
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('role, content')
        .eq('session_id', this.sessionId)
        .textSearch('content', query, {
          config: 'english'
        })
        .limit(limit);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        role: item.role,
        content: item.content,
        similarity: 0.8 // Placeholder similarity score
      }));
    } catch (error) {
      console.error('Error searching memory:', error);
      return [];
    }
  }

  /**
   * Get all available conversation sessions
   */
  static async getSessions(): Promise<{id: string, title: string, date: Date}[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by session_id and get the first message of each session
      const sessions = new Map<string, Date>();
      data?.forEach(item => {
        if (!sessions.has(item.session_id)) {
          sessions.set(item.session_id, new Date(item.created_at));
        }
      });
      
      return Array.from(sessions.entries()).map(([id, date]) => ({
        id,
        title: `Conversation from ${date.toLocaleString()}`,
        date
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  /**
   * Load a specific conversation session
   */
  async loadSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
  }

  /**
   * Start a new conversation session
   */
  startNewSession(): string {
    this.sessionId = crypto.randomUUID();
    return this.sessionId;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}