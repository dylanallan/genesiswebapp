import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Loader2, 
  Settings, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  History, 
  Save, 
  X, 
  Sparkles,
  Zap,
  User,
  Bot,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  sessionId?: string;
  feedback?: {
    rating: number;
    text?: string;
  };
}

interface EnhancedAIAssistantProps {
  initialPrompt?: string;
  initialContext?: string;
  className?: string;
}

export const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({ 
  initialPrompt,
  initialContext,
  className
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(crypto.randomUUID());
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [settings, setSettings] = useState({
    includeUserContext: true,
    includeHistory: true,
    includeCustomInstructions: true,
    includeSemanticSearch: true,
    semanticSearchThreshold: 0.7,
    semanticSearchCount: 5
  });
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{id: string, title: string, date: Date}[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial system message if provided
    if (initialContext) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'system',
        content: initialContext,
        timestamp: new Date()
      }]);
    } else {
      // Add default welcome message
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "👋 Hello! I'm your Genesis AI Assistant Pro. I can help with business automation and cultural heritage questions. How can I assist you today?",
        timestamp: new Date()
      }]);
    }
    
    // Load custom instructions
    loadCustomInstructions();
    
    // Load conversation history
    loadConversationHistory();
  }, [initialContext]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCustomInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_custom_instructions')
        .select('instructions')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setCustomInstructions(data.instructions);
      }
    } catch (error) {
      console.error('Error loading custom instructions:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      
      // Get conversation history from the database
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Group by session_id and get the first message of each session
      const sessions = new Map<string, Date>();
      data?.forEach(item => {
        if (!sessions.has(item.session_id)) {
          sessions.set(item.session_id, new Date(item.created_at));
        }
      });
      
      const history = Array.from(sessions.entries()).map(([id, date]) => ({
        id,
        title: `Conversation from ${date.toLocaleString()}`,
        date
      }));
      
      setConversationHistory(history);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversation = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      // Get conversation messages from the database
      const { data, error } = await supabase
        .from('ai_conversation_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: true });
      
      if (error) throw error;
      
      // Convert to Message format
      const loadedMessages: Message[] = data?.map(item => ({
        id: item.id,
        role: item.role as 'user' | 'assistant' | 'system',
        content: item.content,
        timestamp: new Date(item.created_at),
        model: item.model_used,
        sessionId: item.session_id
      })) || [];
      
      setMessages(loadedMessages);
      setSessionId(sessionId);
      setShowHistory(false);
      
      toast.success('Conversation loaded');
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      sessionId
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Store user message in the database
      await storeMessage(userMessage);
      
      let fullResponse = '';
      
      // Create context-enhanced prompt
      const enhancedPrompt = await createEnhancedPrompt(input);
      
      // Use the streamResponse function from lib/ai.ts
      for await (const chunk of streamResponse(enhancedPrompt, 'gpt-4')) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: 'gpt-4',
        sessionId
      };

      // Store assistant message in the database
      await storeMessage(assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
        sessionId
      }]);
      
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const createEnhancedPrompt = async (userPrompt: string): Promise<string> => {
    let enhancedPrompt = userPrompt;
    
    // Add user context if enabled
    if (settings.includeUserContext) {
      try {
        const { data, error } = await supabase.rpc('get_user_profile');
        
        if (!error && data) {
          const userContext = `
User Context:
- Ancestry: ${data.preferences?.ancestry || 'Not specified'}
- Business Goals: ${data.preferences?.businessGoals || 'Not specified'}
- Cultural Background: ${data.preferences?.culturalBackground || 'Not specified'}
- Business Type: ${data.preferences?.businessType || 'Not specified'}
- Industry Focus: ${data.preferences?.industryFocus || 'Not specified'}
`;
          enhancedPrompt = `${userContext}\n\nUser Query: ${userPrompt}`;
        }
      } catch (error) {
        console.error('Error getting user context:', error);
      }
    }
    
    // Add conversation history if enabled
    if (settings.includeHistory && messages.length > 0) {
      const history = messages
        .slice(-6) // Last 6 messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');
      
      enhancedPrompt = `
Previous Conversation:
${history}

Current Query: ${enhancedPrompt}`;
    }
    
    // Add custom instructions if enabled
    if (settings.includeCustomInstructions && customInstructions) {
      enhancedPrompt = `
Custom Instructions: ${customInstructions}

Query: ${enhancedPrompt}`;
    }
    
    // Add semantic search results if enabled
    if (settings.includeSemanticSearch) {
      try {
        // In a real implementation, this would call the semantic search function
        // For now, we'll just add a placeholder
        enhancedPrompt = `
Relevant Knowledge Base Content:
- Business automation involves using technology to execute recurring tasks or processes where manual effort can be replaced.
- Cultural heritage is the legacy of physical artifacts and intangible attributes of a group or society that is inherited from past generations.

Query: ${enhancedPrompt}`;
      } catch (error) {
        console.error('Error performing semantic search:', error);
      }
    }
    
    return enhancedPrompt;
  };

  const storeMessage = async (message: Message) => {
    try {
      // Get the latest message index
      const { data: lastMessage, error: indexError } = await supabase
        .from('ai_conversation_history')
        .select('message_index')
        .eq('session_id', sessionId)
        .order('message_index', { ascending: false })
        .limit(1);
      
      const messageIndex = lastMessage && lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 0;
      
      // Store the message
      const { error } = await supabase
        .from('ai_conversation_history')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          session_id: sessionId,
          message_index: messageIndex,
          role: message.role,
          content: message.content,
          model_used: message.model,
          tokens_used: Math.ceil(message.content.length / 4), // Rough estimate
          metadata: {
            timestamp: message.timestamp.toISOString()
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing message:', error);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      // Find the message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      // Update the message with feedback
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, feedback: { rating } } 
          : m
      ));
      
      // Store feedback in the database
      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          conversation_id: message.id,
          rating,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success(rating > 3 ? 'Thanks for the positive feedback!' : 'Thanks for your feedback. We\'ll work to improve.');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  const handleSaveInstructions = async () => {
    try {
      // Save custom instructions to the database
      const { error } = await supabase
        .from('ai_custom_instructions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          instructions: customInstructions,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setShowSettings(false);
      toast.success('Custom instructions saved');
    } catch (error) {
      console.error('Error saving custom instructions:', error);
      toast.error('Failed to save custom instructions');
    }
  };

  const startNewConversation = () => {
    setSessionId(crypto.randomUUID());
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "👋 Hello! I'm your Genesis AI Assistant Pro. I can help with business automation and cultural heritage questions. How can I assist you today?",
      timestamp: new Date()
    }]);
    toast.success('Started new conversation');
  };

  return (
    <div className={`flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">Genesis AI Assistant Pro</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Enhanced</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Conversation History"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={startNewConversation}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="New Conversation"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex items-start space-x-2 ${
              message.role === 'assistant' || message.role === 'system' 
                ? 'justify-start' 
                : 'justify-end'
            }`}>
              {(message.role === 'assistant' || message.role === 'system') && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {message.role === 'system' ? (
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.role === 'system'
                    ? 'bg-gray-100 text-gray-900 border border-gray-200'
                    : 'bg-gray-100 text-gray-900'
              }`}>
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
                
                <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.model && <span>Model: {message.model}</span>}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
            
            {message.role === 'assistant' && (
              <div className="flex items-center justify-end space-x-2 mt-1">
                <button
                  onClick={() => handleFeedback(message.id, 5)}
                  className={`p-1 rounded-full ${
                    message.feedback?.rating === 5 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedback(message.id, 1)}
                  className={`p-1 rounded-full ${
                    message.feedback?.rating === 1 
                      ? 'bg-red-100 text-red-600' 
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Not Helpful"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {streamingContent && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
              <ReactMarkdown className="prose prose-sm max-w-none">
                {streamingContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {isLoading && !streamingContent && (
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">AI Assistant Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Context Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.includeUserContext}
                        onChange={(e) => setSettings({ ...settings, includeUserContext: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Include User Context</span>
                    </label>
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.includeHistory}
                        onChange={(e) => setSettings({ ...settings, includeHistory: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Include Conversation History</span>
                    </label>
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.includeCustomInstructions}
                        onChange={(e) => setSettings({ ...settings, includeCustomInstructions: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Include Custom Instructions</span>
                    </label>
                    <Settings className="w-4 h-4 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.includeSemanticSearch}
                        onChange={(e) => setSettings({ ...settings, includeSemanticSearch: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Include Semantic Search</span>
                    </label>
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Custom Instructions</h4>
                  <p className="text-sm text-gray-500">
                    These instructions will be included with every request to the AI assistant.
                  </p>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Add custom instructions for the AI assistant..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInstructions}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Conversation History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : conversationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No conversation history found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {conversationHistory.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => loadConversation(conversation.id)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              {conversation.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {conversation.date.toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startNewConversation}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>New Conversation</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};