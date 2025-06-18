/**
 * Utility for counting tokens in text for different AI models
 */

// Approximate tokens per character for different models
const TOKENS_PER_CHAR = {
  'gpt-4': 0.25,
  'gpt-3.5-turbo': 0.25,
  'claude-3-opus': 0.27,
  'claude-3-sonnet': 0.27,
  'claude-3-haiku': 0.27,
  'gemini-pro': 0.3,
  'default': 0.25
};

/**
 * Estimate the number of tokens in a text string
 * @param text The text to count tokens for
 * @param model The AI model to use for token counting
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string, model: string = 'default'): number {
  const tokensPerChar = TOKENS_PER_CHAR[model as keyof typeof TOKENS_PER_CHAR] || TOKENS_PER_CHAR.default;
  return Math.ceil(text.length * tokensPerChar);
}

/**
 * Truncate text to fit within a token limit
 * @param text The text to truncate
 * @param maxTokens Maximum number of tokens allowed
 * @param model The AI model to use for token counting
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number, model: string = 'default'): string {
  const tokensPerChar = TOKENS_PER_CHAR[model as keyof typeof TOKENS_PER_CHAR] || TOKENS_PER_CHAR.default;
  const maxChars = Math.floor(maxTokens / tokensPerChar);
  
  if (text.length <= maxChars) {
    return text;
  }
  
  return text.substring(0, maxChars) + '...';
}

/**
 * Calculate the cost of a request based on token count
 * @param tokenCount Number of tokens used
 * @param model The AI model used
 * @returns Cost in USD
 */
export function calculateCost(tokenCount: number, model: string): number {
  const costPerToken = {
    'gpt-4': 0.00003,
    'gpt-3.5-turbo': 0.000002,
    'claude-3-opus': 0.000015,
    'claude-3-sonnet': 0.000003,
    'claude-3-haiku': 0.000001,
    'gemini-pro': 0.0000005,
    'default': 0.00001
  };
  
  const rate = costPerToken[model as keyof typeof costPerToken] || costPerToken.default;
  return tokenCount * rate;
}

/**
 * Check if a conversation is within token limits for a model
 * @param messages Array of message objects with content property
 * @param model The AI model to check against
 * @returns Boolean indicating if within limits
 */
export function isWithinTokenLimit(messages: {content: string}[], model: string): boolean {
  const modelLimits = {
    'gpt-4': 128000,
    'gpt-3.5-turbo': 16000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-pro': 30000,
    'default': 16000
  };
  
  const limit = modelLimits[model as keyof typeof modelLimits] || modelLimits.default;
  
  const totalTokens = messages.reduce((sum, message) => {
    return sum + estimateTokenCount(message.content, model);
  }, 0);
  
  return totalTokens <= limit;
}

/**
 * Optimize a conversation to fit within token limits
 * @param messages Array of message objects with content property
 * @param model The AI model to optimize for
 * @param reserveTokens Number of tokens to reserve for the response
 * @returns Optimized array of messages
 */
export function optimizeConversation(
  messages: {role: string, content: string}[], 
  model: string, 
  reserveTokens: number = 1000
): {role: string, content: string}[] {
  const modelLimits = {
    'gpt-4': 128000,
    'gpt-3.5-turbo': 16000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'gemini-pro': 30000,
    'default': 16000
  };
  
  const limit = (modelLimits[model as keyof typeof modelLimits] || modelLimits.default) - reserveTokens;
  
  // If already within limits, return as is
  const totalTokens = messages.reduce((sum, message) => {
    return sum + estimateTokenCount(message.content, model);
  }, 0);
  
  if (totalTokens <= limit) {
    return messages;
  }
  
  // Start optimizing
  const optimized = [...messages];
  
  // First, try to truncate long messages
  for (let i = 0; i < optimized.length; i++) {
    const message = optimized[i];
    const tokenCount = estimateTokenCount(message.content, model);
    
    if (tokenCount > 1000) {
      // Truncate long messages
      message.content = truncateToTokenLimit(message.content, 1000, model);
    }
    
    // Check if we're now within limits
    const newTotal = optimized.reduce((sum, msg) => {
      return sum + estimateTokenCount(msg.content, model);
    }, 0);
    
    if (newTotal <= limit) {
      return optimized;
    }
  }
  
  // If still over limit, start removing older messages (but keep the most recent ones)
  // Always keep the system message if present
  const systemMessage = optimized.find(m => m.role === 'system');
  const userAssistantMessages = optimized.filter(m => m.role !== 'system');
  
  // Keep removing older messages until we're within limits
  while (userAssistantMessages.length > 2) {
    userAssistantMessages.shift(); // Remove oldest message
    
    const currentMessages = systemMessage 
      ? [systemMessage, ...userAssistantMessages] 
      : userAssistantMessages;
    
    const newTotal = currentMessages.reduce((sum, msg) => {
      return sum + estimateTokenCount(msg.content, model);
    }, 0);
    
    if (newTotal <= limit) {
      return currentMessages;
    }
  }
  
  // If we're still over limit with just the most recent messages,
  // truncate them further
  const finalMessages = systemMessage 
    ? [systemMessage, ...userAssistantMessages] 
    : userAssistantMessages;
  
  // Calculate how many tokens we need to remove
  const finalTotal = finalMessages.reduce((sum, msg) => {
    return sum + estimateTokenCount(msg.content, model);
  }, 0);
  
  const excessTokens = finalTotal - limit;
  
  if (excessTokens > 0 && finalMessages.length > 0) {
    // Reduce the last message to fit
    const lastMessage = finalMessages[finalMessages.length - 1];
    const lastMessageTokens = estimateTokenCount(lastMessage.content, model);
    
    if (lastMessageTokens > excessTokens) {
      // We can just truncate the last message
      const newLength = Math.floor((lastMessageTokens - excessTokens) / TOKENS_PER_CHAR[model as keyof typeof TOKENS_PER_CHAR]);
      lastMessage.content = lastMessage.content.substring(0, newLength) + '...';
    }
  }
  
  return finalMessages;
}