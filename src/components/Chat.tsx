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
import { useSession } from '../lib/session-context';
import { chatApi, ChatMessage, ChatResponse, ConversationInfo } from '../api/chat';
import { supabase } from '../lib/supabase';
import VoicePlayer from './VoicePlayer';

interface ChatProps {
  userName?: string;
  ancestry?: string;
  businessGoals?: string;
}

// Available AI models for the chat interface
const availableModels = [
  { id: 'auto', name: 'Auto Select', provider: 'auto' as const },
  { id: 'gpt-4', name: 'GPT-4 (OpenAI)', provider: 'openai' as const },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)', provider: 'openai' as const },
  { id: 'gemini-pro', name: 'Gemini Pro (Google)', provider: 'gemini' as const }
];

// Add Ollama and Claude to the provider selector
const availableProviders = [
  { id: 'auto', name: 'Auto Select' },
  { id: 'openai', name: 'OpenAI (GPT-4)' },
  { id: 'anthropic', name: 'Claude (Anthropic)' },
  { id: 'gemini', name: 'Gemini (Google)' },
  { id: 'ollama', name: 'Ollama 3.2' },
];

export const Chat: React.FC<ChatProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [currentProvider, setCurrentProvider] = useState<string>('auto');
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

  const loadConversation = async (convId: string | undefined) => {
    if (typeof convId !== 'string') return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
      conversation_id: conversationId || ''
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/functions/v1/ai-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, provider: currentProvider !== 'auto' ? currentProvider : undefined }),
      });
      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
        conversation_id: conversationId || '',
        metadata: { provider: data.provider }
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or check your connection if the issue persists.",
        created_at: new Date().toISOString(),
        conversation_id: conversationId || ''
      };
      setMessages(prev => [...prev, errorMessage]);
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
            .map(msg => `${msg.role.toUpperCase()} (${new Date(msg.created_at).toLocaleString()}):\n${msg.content}\n\n`)
            .join('');
          break;
        case 'markdown':
          content = `# Conversation Export - ${new Date().toLocaleDateString()}\n\n`;
          content += messages
            .map(msg => `## ${msg.role === 'user' ? 'You' : 'Assistant'} - ${new Date(msg.created_at).toLocaleString()}\n\n${msg.content}\n\n`)
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
          
          <select
            value={currentProvider}
            onChange={e => setCurrentProvider(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            {availableProviders.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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
              {/* <button
                onClick={createNewConversation}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button> */}
            </div>
          </div>
          <div className="p-2">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">No conversations yet</p>
            ) : (
              conversations.filter(conv => typeof conv.id === 'string' && conv.id).map(conv => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conversationId === conv.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => { if (typeof conv.id === 'string') loadConversation(conv.id); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{conv.title}</h4>
                      <p className="text-xs text-gray-400">
                        {new Date(conv.last_updated).toLocaleDateString()}
                      </p>
                    </div>
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
              {/* <button
                onClick={createNewConversation}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                New Conversation
              </button> */}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
                
                {msg.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mt-2 ml-10">
                    <button
                      onClick={() => handleFeedback(msg.id, 5)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 1)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {msg.role === 'assistant' && msg.metadata?.provider && (
                <div className="text-xs mt-1 text-gray-500">Provider: {msg.metadata.provider}</div>
              )}
              {msg.role === 'assistant' && (
                <VoicePlayer text={msg.content} />
              )}
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