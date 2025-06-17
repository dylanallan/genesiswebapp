import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Bot, 
  Loader2, 
  Brain, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  User,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@supabase/auth-helpers-react';
import { chatApi, ChatMessage, ChatResponse, ConversationInfo } from '../api/chat';
import { supabase } from '../lib/supabase';

interface ChatProps {
  userName?: string;
  ancestry?: string;
  businessGoals?: string;
}

export const Chat: React.FC<ChatProps> = ({ 
  userName = 'User', 
  ancestry = 'European and Asian heritage',
  businessGoals = 'Automate marketing and preserve cultural knowledge'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [currentProvider, setCurrentProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'auto'>('auto');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'degraded' | 'offline'>('connected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = useSession();

  useEffect(() => {
    loadConversations();
    checkConnectionStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkConnectionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setConnectionStatus('offline');
        return;
      }
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Session check failed:', error);
      setConnectionStatus('offline');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const conversationList = await chatApi.getConversationList();
      setConversations(conversationList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConversationId = await chatApi.createConversation();
      setConversationId(newConversationId);
      setMessages([]);
      setShowConversations(false);
      await loadConversations();
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        message: `👋 Hello ${userName}! I'm your Genesis AI assistant. Based on your profile, I can help with:

- Business automation strategies for ${businessGoals}
- Exploring your ${ancestry} background
- Connecting cultural heritage with modern business practices

How can I assist you today?`,
        created_at: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create new conversation');
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      const history = await chatApi.getHistory(convId);
      setMessages(history);
      setConversationId(convId);
      setShowConversations(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      await chatApi.deleteConversation(convId);
      await loadConversations();
      if (conversationId === convId) {
        setConversationId(undefined);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      message: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await processUserMessage(userMessage);
  };

  const processUserMessage = async (userMessage: ChatMessage) => {
    console.log('🔄 Processing user message:', { message: userMessage.message.substring(0, 50) + '...', conversationId });
    
    setIsLoading(true);
    setConnectionStatus('connected');

    try {
      // Determine provider and model
      let provider: 'auto' | 'openai' | 'anthropic' | 'gemini' = 'auto';
      let model = 'auto';

      if (currentModel !== 'auto') {
        const selectedModel = availableModels.find(m => m.id === currentModel);
        if (selectedModel) {
          provider = selectedModel.provider as 'auto' | 'openai' | 'anthropic' | 'gemini';
          model = selectedModel.id;
        }
      }

      console.log('🎯 Sending message with:', { provider, model, conversationId });

      const response = await chatApi.sendMessage(
        userMessage.message,
        conversationId,
        provider,
        model
      );

      console.log('📥 Received response:', { 
        provider: response.provider, 
        model: response.model, 
        responseLength: response.response.length,
        responsePreview: response.response.substring(0, 100) + '...'
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        message: response.response,
        provider: response.provider,
        model: response.model,
        created_at: response.timestamp
      };

      console.log('💬 Adding assistant message to chat:', { 
        provider: assistantMessage.provider, 
        model: assistantMessage.model,
        messageLength: assistantMessage.message.length 
      });

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
      setConnectionStatus('connected');
      
      // Reload conversations to update the list
      await loadConversations();
      
    } catch (error) {
      console.error('❌ Error getting assistant response:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        message: "I'm sorry, I encountered an error processing your request. Please try again or check your connection if the issue persists.",
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response');
      setConnectionStatus('degraded');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
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

  const exportConversation = (format: 'text' | 'markdown' | 'json') => {
    try {
      let content = '';
      
      switch (format) {
        case 'text':
          content = messages
            .map(msg => `${msg.role.toUpperCase()} (${new Date(msg.created_at).toLocaleString()}):\n${msg.message}\n\n`)
            .join('');
          break;
        case 'markdown':
          content = `# Conversation Export - ${new Date().toLocaleDateString()}\n\n`;
          content += messages
            .map(msg => `## ${msg.role === 'user' ? 'You' : 'Assistant'} - ${new Date(msg.created_at).toLocaleString()}\n\n${msg.message}\n\n`)
            .join('');
          break;
        case 'json':
          content = JSON.stringify(messages, null, 2);
          break;
      }
      
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `conversation-export-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      
      toast.success(`Conversation exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      toast.error('Failed to export conversation');
    }
  };

  const availableModels = chatApi.getAvailableModels();

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis AI Assistant Pro</span>
          {connectionStatus !== 'connected' && (
            <div className="flex items-center space-x-1 ml-2">
              {connectionStatus === 'degraded' ? (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Degraded Service</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Conversations"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          
          <div className="relative group">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Export conversation"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
              <button
                onClick={() => exportConversation('text')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
              >
                Export as Text
              </button>
              <button
                onClick={() => exportConversation('markdown')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as Markdown
              </button>
              <button
                onClick={() => exportConversation('json')}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div className="absolute top-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
              <button
                onClick={createNewConversation}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.conversation_id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conversationId === conv.conversation_id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => loadConversation(conv.conversation_id)}
                    >
                      <h4 className="font-medium text-gray-900 truncate">{conv.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                      <p className="text-xs text-gray-400">
                        {conv.message_count} messages • {new Date(conv.last_updated).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.conversation_id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 ml-2"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Start a conversation to begin</p>
              <button
                onClick={createNewConversation}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                New Conversation
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.message}</div>
                    {message.provider && message.model && (
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.provider} • {message.model}
                      </div>
                    )}
                  </div>
                </div>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mt-2 ml-10">
                    <button
                      onClick={() => handleFeedback(message.id, 5)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 1)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <span className="text-gray-500">Thinking...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-blue-100">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};