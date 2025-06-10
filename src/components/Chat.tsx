import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { streamResponse, getBestModelForTask, getMockResponse } from '../lib/ai';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

interface ChatProps {
  userName: string;
  ancestry: string;
  businessGoals: string;
}

export const Chat: React.FC<ChatProps> = ({ userName, ancestry, businessGoals }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to Genesis Heritage! I can help you explore your cultural heritage and automate your business processes.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const selectedModel = currentModel === 'auto' ? getBestModelForTask(input) : currentModel;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullResponse = '';
      for await (const chunk of streamResponse(
        input, 
        selectedModel as any
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error: any) {
      console.error('Error:', error);
      
      const fallbackResponse = await getMockResponse(input);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        model: 'fallback'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis AI Assistant</span>
        </div>
        <select
          value={currentModel}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
        >
          <option value="auto">Auto-Select</option>
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="gemini-pro">Gemini Pro</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={cn(
              "flex items-start space-x-2",
              message.role === 'assistant' || message.role === 'system' ? 'justify-start' : 'justify-end'
            )}>
              {(message.role === 'assistant' || message.role === 'system') && (
                message.role === 'assistant' ? 
                <Bot className="w-6 h-6 text-blue-500" /> : 
                <Brain className="w-6 h-6 text-blue-500" />
              )}
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === 'user' ? "bg-blue-600 text-white" : "bg-blue-50 text-gray-900"
              )}>
                <ReactMarkdown className="prose prose-sm">
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.role === 'user' && <User className="w-6 h-6 text-gray-500" />}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex items-start space-x-2">
            <Bot className="w-6 h-6 text-blue-500" />
            <div className="max-w-[80%] rounded-lg p-3 bg-blue-50 text-gray-900">
              <ReactMarkdown className="prose prose-sm">
                {streamingContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
        {isLoading && !streamingContent && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing your request...</span>
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
    </div>
  );
};