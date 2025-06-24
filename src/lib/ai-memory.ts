import { supabase } from './supabase';

export interface AIContext {
  sessionId: string;
  userContext?: boolean;
  conversationHistory?: boolean;
  customInstructions?: boolean;
  semanticSearch?: boolean;
  semanticSearchThreshold?: number;
  semanticSearchCount?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  sessionId: string;
  tokensUsed?: number;
  processingTime?: number;
}

/**
 * AI Memory System for storing and retrieving conversation history
 */
export class AIMemory {
  private sessionId: string;
  private maxMessages: number;
  private includeSystemMessages: boolean;
  private messageCache: Map<string, {role: string, content: string, timestamp: Date}[]> = new Map();

  constructor(options: {
    sessionId?: string;
    maxMessages?: number;
    includeSystemMessages?: boolean;
  } = {}) {
    this.sessionId = options.sessionId || crypto.randomUUID();
    this.maxMessages = options.maxMessages || 10;
    this.includeSystemMessages = options.includeSystemMessages || false;
  }

  /**
   * Store a message in the conversation history
   */
  async storeMessage(
    role: 'user' | 'assistant' | 'system', 
    content: string, 
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Get the latest message index
      const { data: lastMessage, error: indexError } = await supabase
        .from('ai_conversation_history')
        .select('message_index')
        .eq('session_id', this.sessionId)
        .order('message_index', { ascending: false })
        .limit(1);
      
      const messageIndex = lastMessage && lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 0;
      
      // Store the message
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          session_id: this.sessionId,
          message_index: messageIndex,
          role,
          content,
          model_used: metadata.model,
          tokens_used: Math.ceil(content.length / 4), // Rough estimate
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      // Update local cache
      const cacheKey = this.sessionId;
      const cachedMessages = this.messageCache.get(cacheKey) || [];
      cachedMessages.push({
        role,
        content,
        timestamp: new Date()
      });
      this.messageCache.set(cacheKey, cachedMessages);
      
      return data.id;
    } catch (error) {
      console.error('Error storing message:', error);
      
      // Create a fallback in-memory storage if database fails
      console.log('Using fallback in-memory storage for message');
      
      // Update local cache even if database fails
      const cacheKey = this.sessionId;
      const cachedMessages = this.messageCache.get(cacheKey) || [];
      cachedMessages.push({
        role,
        content,
        timestamp: new Date()
      });
      this.messageCache.set(cacheKey, cachedMessages);
      
      return crypto.randomUUID();
    }
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(): Promise<{role: string, content: string, timestamp: Date}[]> {
    try {
      // Try to get from cache first
      const cacheKey = this.sessionId;
      const cachedMessages = this.messageCache.get(cacheKey);
      if (cachedMessages && cachedMessages.length > 0) {
        return cachedMessages;
      }
      
      // If not in cache, get from database
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
      
      const messages = (data || []).map(item => ({
        role: item.role,
        content: item.content,
        timestamp: new Date(item.created_at)
      }));
      
      // Update cache
      this.messageCache.set(cacheKey, messages);
      
      return messages;
    } catch (error) {
      console.error('Error retrieving conversation history:', error);
      
      // Return empty array if database fails
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
  static async getSessions(): Promise<{id: string, sessionId: string, messages: number, lastActive: Date}[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by session_id and get the first message of each session
      const sessions = new Map<string, {count: number, lastActive: Date}>();
      
      data?.forEach(item => {
        if (!sessions.has(item.session_id)) {
          sessions.set(item.session_id, { count: 0, lastActive: new Date(item.created_at) });
        }
        
        const session = sessions.get(item.session_id)!;
        session.count++;
        
        // Update last active if this message is more recent
        const messageDate = new Date(item.created_at);
        if (messageDate > session.lastActive) {
          session.lastActive = messageDate;
        }
      });
      
      return Array.from(sessions.entries()).map(([sessionId, info]) => ({
        id: crypto.randomUUID(),
        sessionId,
        messages: info.count,
        lastActive: info.lastActive
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  /**
   * Load a specific conversation session
   */
  loadSession(sessionId: string): void {
    this.sessionId = sessionId;
    // Clear cache for the previous session
    this.messageCache.delete(this.sessionId);
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Start a new conversation session
   */
  startNewSession(): string {
    this.sessionId = crypto.randomUUID();
    return this.sessionId;
  }
}