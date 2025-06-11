import { supabase } from './supabase';
import { toast } from 'sonner';

/**
 * Manages AI context including custom instructions, conversation history, and semantic search
 */
export class AIContextManager {
  private static instance: AIContextManager;
  private customInstructions: string | null = null;
  private customInstructionsEnabled = true;
  private sessionId: string;
  
  private constructor() {
    this.sessionId = crypto.randomUUID();
    this.loadCustomInstructions();
  }
  
  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }
  
  /**
   * Load custom instructions from the database
   */
  async loadCustomInstructions(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_custom_instructions');
      
      if (error) {
        console.warn('Error loading custom instructions:', error);
        return null;
      }
      
      this.customInstructions = data;
      return data;
    } catch (error) {
      console.error('Failed to load custom instructions:', error);
      return null;
    }
  }
  
  /**
   * Save custom instructions to the database
   */
  async saveCustomInstructions(instructions: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'update_user_custom_instructions',
        { p_instructions: instructions, p_is_active: this.customInstructionsEnabled }
      );
      
      if (error) {
        console.error('Error saving custom instructions:', error);
        toast.error('Failed to save custom instructions');
        return false;
      }
      
      this.customInstructions = instructions;
      toast.success('Custom instructions saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save custom instructions:', error);
      toast.error('Failed to save custom instructions');
      return false;
    }
  }
  
  /**
   * Enable or disable custom instructions
   */
  async toggleCustomInstructions(enabled: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'toggle_custom_instructions',
        { p_is_active: enabled }
      );
      
      if (error) {
        console.error('Error toggling custom instructions:', error);
        toast.error('Failed to update custom instructions settings');
        return false;
      }
      
      this.customInstructionsEnabled = enabled;
      toast.success(`Custom instructions ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      console.error('Failed to toggle custom instructions:', error);
      toast.error('Failed to update custom instructions settings');
      return false;
    }
  }
  
  /**
   * Get the current custom instructions
   */
  getCustomInstructions(): string | null {
    return this.customInstructionsEnabled ? this.customInstructions : null;
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
  
  /**
   * Set the session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
  
  /**
   * Build enhanced context for AI requests
   */
  async buildEnhancedContext(prompt: string, options: {
    includeUserContext?: boolean;
    includeHistory?: boolean;
    includeCustomInstructions?: boolean;
    includeSemanticSearch?: boolean;
    semanticSearchThreshold?: number;
    semanticSearchCount?: number;
  } = {}): Promise<string> {
    let enhancedPrompt = prompt;
    
    // Add custom instructions if enabled
    if (options.includeCustomInstructions !== false && this.customInstructionsEnabled && this.customInstructions) {
      enhancedPrompt = `Custom Instructions: ${this.customInstructions}\n\n${enhancedPrompt}`;
    }
    
    // Add user context if requested
    if (options.includeUserContext) {
      try {
        const { data, error } = await supabase.rpc('get_user_profile');
        
        if (!error && data?.preferences) {
          const userContext = `
User Context:
- Ancestry: ${data.preferences.ancestry || 'Not specified'}
- Business Goals: ${data.preferences.businessGoals || 'Not specified'}
- Cultural Background: ${data.preferences.culturalBackground || 'Not specified'}
- Business Type: ${data.preferences.businessType || 'Not specified'}
- Industry Focus: ${data.preferences.industryFocus || 'Not specified'}
`;
          enhancedPrompt = `${userContext}\n\n${enhancedPrompt}`;
        }
      } catch (error) {
        console.warn('Error getting user context:', error);
      }
    }
    
    // Add conversation history if requested
    if (options.includeHistory) {
      try {
        const { data, error } = await supabase.rpc('get_conversation_context', {
          p_session_id: this.sessionId,
          p_max_messages: 10
        });
        
        if (!error && data && data.length > 0) {
          const history = data.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n');
          enhancedPrompt = `Previous Conversation:\n${history}\n\nCurrent Query: ${enhancedPrompt}`;
        }
      } catch (error) {
        console.warn('Error getting conversation history:', error);
      }
    }
    
    // Add semantic search results if requested
    if (options.includeSemanticSearch) {
      try {
        // This would call your semantic search endpoint
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/memory-search`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: prompt,
              threshold: options.semanticSearchThreshold || 0.7,
              limit: options.semanticSearchCount || 5,
              includeContent: true
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.results && result.results.length > 0) {
              const relevantContent = result.results
                .map((item: any) => `RELEVANT CONTENT (${item.role}): ${item.content.substring(0, 300)}${item.content.length > 300 ? '...' : ''}`)
                .join('\n\n');
              
              enhancedPrompt = `Relevant Knowledge Base Content:\n${relevantContent}\n\nQuery: ${enhancedPrompt}`;
            }
          }
        }
      } catch (error) {
        console.warn('Error performing semantic search:', error);
      }
    }
    
    return enhancedPrompt;
  }
}

export const aiContextManager = AIContextManager.getInstance();