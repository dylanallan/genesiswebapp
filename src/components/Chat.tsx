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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@supabase/auth-helpers-react';
import { streamResponse } from '../lib/ai';
import { AIMemory } from '../lib/ai-memory';
import { supabase } from '../lib/supabase';
import { enhancedAIAssistant } from '../lib/ai-context';
import { ConversationSummarizer } from './ConversationSummarizer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  feedback?: {
    rating: number;
    text?: string;
  };
}

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
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId] = useState(crypto.randomUUID());
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const aiMemory = useRef(new AIMemory({ sessionId }));

  useEffect(() => {
    // Add initial welcome message
    const initialMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `👋 Hello ${userName}! I'm your AI assistant. Based on your profile, I can help with:

- Business automation strategies for ${businessGoals}
- Exploring your ${ancestry} background
- Connecting cultural heritage with modern business practices

How can I assist you today?`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Store initial message in memory
    aiMemory.current.storeMessage('assistant', initialMessage.content);
  }, [userName, ancestry, businessGoals]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    // Extract topics from messages for filtering
    if (messages.length > 2) {
      extractTopics();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const extractTopics = async () => {
    try {
      // Use AI to extract topics from the conversation
      const conversation = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      const prompt = `Extract 3-5 main topics from this conversation as a comma-separated list. Keep each topic to 1-3 words:\n\n${conversation}`;
      
      let response = '';
      for await (const chunk of streamResponse(prompt, 'gpt-3.5-turbo')) {
        response += chunk;
      }
      
      // Parse the comma-separated list
      const extractedTopics = response
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);
      
      setTopics(extractedTopics);
    } catch (error) {
      console.error('Error extracting topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Store user message in memory
      await aiMemory.current.storeMessage('user', input);
      
      // Prepare context options
      const contextOptions = {
        sessionId,
        userContext: true,
        conversationHistory: true,
        customInstructions: true,
        semanticSearch: true
      };
      
      let fullResponse = '';
      
      // Stream the response using enhanced AI assistant
      for await (const chunk of enhancedAIAssistant(input, contextOptions)) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      // Store assistant response in memory
      await aiMemory.current.storeMessage('assistant', fullResponse, { model: currentModel });
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: currentModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Extract topics after new messages
      if (messages.length > 2) {
        extractTopics();
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Store error message in memory
      await aiMemory.current.storeMessage('assistant', errorMessage.content, { error: true });
      
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

  const exportConversation = (format: 'text' | 'markdown' | 'json') => {
    try {
      let content = '';
      
      switch (format) {
        case 'text':
          content = messages
            .map(msg => `${msg.role.toUpperCase()} (${msg.timestamp.toLocaleString()}):\n${msg.content}\n\n`)
            .join('');
          break;
        case 'markdown':
          content = `# Conversation Export - ${new Date().toLocaleDateString()}\n\n`;
          content += messages
            .map(msg => `## ${msg.role === 'user' ? 'You' : 'Assistant'} - ${msg.timestamp.toLocaleString()}\n\n${msg.content}\n\n`)
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
      
      toast.success(`Conversation exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      toast.error('Failed to export conversation');
    }
  };

  const filteredMessages = topicFilter
    ? messages.filter(msg => msg.content.toLowerCase().includes(topicFilter.toLowerCase()))
    : messages;

  const availableModels = [
    { id: 'auto', name: 'Auto-Select', description: 'Best model for your task' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Nuanced understanding' },
    { id: 'gemini-pro', name: 'Gemini Pro', description: 'Fast responses' }
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis AI Assistant Pro</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
          
          <div className="relative group">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Export conversation"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2 hidden group-hover:block z-10">
              <div className="text-sm font-medium text-gray-900 mb-2 px-2">Export as:</div>
              <button
                onClick={() => exportConversation('text')}
                className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Plain Text (.txt)
              </button>
              <button
                onClick={() => exportConversation('markdown')}
                className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => exportConversation('json')}
                className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                JSON (.json)
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowSummarizer(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Summarize conversation"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex space-x-1">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => setTopicFilter(topicFilter === topic ? null : topic)}
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  topicFilter === topic
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {topic}
              </button>
            ))}
            {topicFilter && (
              <button
                onClick={() => setTopicFilter(null)}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-xs"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((message, index) => (
          <div key={message.id}>
            <div className={`flex items-start space-x-2 ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
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
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-blue-100">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Conversation Summarizer Modal */}
      <ConversationSummarizer
        isOpen={showSummarizer}
        onClose={() => setShowSummarizer(false)}
        sessionId={sessionId}
        messages={messages}
      />
    </div>
  );
};