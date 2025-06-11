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
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';
import { AIMemory } from '../lib/ai-memory';

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
    semanticSearchCount: 5,
    selectedModel: 'auto' as 'auto' | 'gpt-4' | 'claude-3-opus' | 'gemini-pro'
  });
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{
    id: string;
    sessionId: string;
    messages: number;
    lastActive: Date;
  }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMemory = useRef<AIMemory>(new AIMemory({ sessionId }));

  useEffect(() => {
    // Add initial system message if provided
    if (initialContext) {
      const systemMessage = {
        id: crypto.randomUUID(),
        role: 'system' as const,
        content: initialContext,
        timestamp: new Date()
      };
      
      setMessages([systemMessage]);
    } else {
      // Add default welcome message
      const welcomeMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: "👋 Hello! I'm your Genesis AI Assistant Pro. I can help with business automation and cultural heritage questions. How can I assist you today?",
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }

    // Load custom instructions if available
    loadCustomInstructions();
  }, [initialContext]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (showHistory) {
      loadConversationHistory();
    }
  }, [showHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCustomInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_custom_instructions')
        .select('instructions')
        .eq('is_active', true)
        .maybeSingle();
      
      if (!error && data?.instructions) {
        setCustomInstructions(data.instructions);
      }
    } catch (error) {
      console.error('Error loading custom instructions:', error);
    }
  };

  const loadConversationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const sessions = await AIMemory.getSessions();
      setConversationHistory(sessions);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
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
      // Store user message
      await aiMemory.current.storeMessage('user', input);
      
      // Prepare context options
      const contextOptions = {
        sessionId,
        userContext: settings.includeUserContext,
        conversationHistory: settings.includeHistory,
        customInstructions: settings.includeCustomInstructions && customInstructions ? true : false,
        semanticSearch: settings.includeSemanticSearch,
        semanticSearchThreshold: settings.semanticSearchThreshold,
        semanticSearchCount: settings.semanticSearchCount
      };

      let fullResponse = '';
      
      // Stream the response
      for await (const chunk of streamResponse(
        input,
        settings.selectedModel === 'auto' ? 'auto' : settings.selectedModel
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      // Store assistant message
      await aiMemory.current.storeMessage('assistant', fullResponse, { model: settings.selectedModel });
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: settings.selectedModel,
        sessionId
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Add error message
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
        sessionId
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
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
      
      // Save feedback to database
      try {
        await supabase
          .from('ai_feedback')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            response_id: messageId,
            rating,
            was_helpful: rating > 3,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn('Failed to save feedback to database:', dbError);
      }
      
      toast.success(rating > 3 ? 'Thanks for the positive feedback!' : 'Thanks for your feedback. We\'ll work to improve.');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  const handleSaveInstructions = async () => {
    try {
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
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    aiMemory.current = new AIMemory({ sessionId: newSessionId });
    
    const welcomeMessage = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: "👋 Hello! I'm your Genesis AI Assistant Pro. I can help with business automation and cultural heritage questions. How can I assist you today?",
      timestamp: new Date(),
      sessionId: newSessionId
    };
    
    setMessages([welcomeMessage]);
    
    toast.success('Started new conversation');
  };

  const loadSession = (sessionId: string) => {
    aiMemory.current.loadSession(sessionId);
    setSessionId(sessionId);
    
    // Load messages for this session
    loadSessionMessages(sessionId);
    
    setShowHistory(false);
  };

  const loadSessionMessages = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const history = await aiMemory.current.getConversationHistory();
      
      const formattedMessages: Message[] = history.map(msg => ({
        id: crypto.randomUUID(),
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp,
        sessionId
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      toast.error('Failed to load conversation');
      
      // Add fallback welcome message
      const welcomeMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: "👋 Hello! I'm your Genesis AI Assistant Pro. I can help with business automation and cultural heritage questions. How can I assist you today?",
        timestamp: new Date(),
        sessionId
      };
      
      setMessages([welcomeMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const availableModels = [
    { id: 'auto', name: 'Auto-Select', description: 'Best model for your task' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Nuanced understanding' },
    { id: 'gemini-pro', name: 'Gemini Pro', description: 'Fast responses' }
  ];

  return (
    <div className={`flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">Genesis AI Assistant Pro</h2>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Memory-Enabled</span>
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
                <div className="whitespace-pre-wrap">{message.content}</div>
                
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
              <div className="whitespace-pre-wrap">{streamingContent}</div>
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
        <div className="flex space-x-2 mb-2">
          <select
            value={settings.selectedModel}
            onChange={(e) => setSettings({ ...settings, selectedModel: e.target.value as any })}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>
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
                  <h4 className="font-medium text-gray-900">Memory & Context Settings</h4>
                  
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
                      <span className="text-gray-700">Include Conversation Memory</span>
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
                <h3 className="text-xl font-semibold text-gray-900">Conversation Memory</h3>
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
                        onClick={() => loadSession(conversation.sessionId)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              Conversation {conversation.sessionId.substring(0, 8)}...
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {conversation.lastActive.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>{conversation.messages} messages</span>
                          <span>{conversation.lastActive.toLocaleTimeString()}</span>
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