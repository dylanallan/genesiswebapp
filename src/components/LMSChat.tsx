import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Send, Bot, Loader2, Brain, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { streamResponse } from '../lib/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  courseId?: string;
  lessonId?: string;
  context?: string;
}

export const LMSChat: React.FC<ChatProps> = ({ courseId, lessonId, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = useSession();

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      message: ''
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (data: { message: string }) => {
    if (!data.message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: data.message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    reset();

    try {
      let fullResponse = '';
      for await (const chunk of streamResponse(data.message, selectedModel as any)) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = fullResponse;
          } else {
            newMessages.push({
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date()
            });
          }
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">AI Learning Assistant</h2>
        </div>
        
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3">Claude 3</option>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="deepseek-1">DeepSeek</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {context && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-700">{context}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4" />
                )}
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            {...register('message')}
            placeholder="Ask anything about the lesson..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !watch('message')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};