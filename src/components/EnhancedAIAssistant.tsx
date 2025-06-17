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
  Settings,
  Mic,
  MicOff,
  X,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { chatApi } from '../api/chat';
import { AICustomInstructionsEditor } from './AICustomInstructionsEditor';

// Type definitions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
  feedback?: {
    rating: number;
    text?: string;
  };
}

export const EnhancedAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId] = useState(crypto.randomUUID());
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomInstructionsEditor, setShowCustomInstructionsEditor] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Add initial welcome message
    const initialMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `👋 Hello! I'm your AI assistant. I can help with:

- Business automation strategies
- Cultural heritage exploration
- Technical questions and problem-solving
- Creative projects and ideas

How can I assist you today?`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Initialize speech recognition
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTranscript(transcript);
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setInput('');
      setTranscript('');
      toast.success('Listening... Speak now');
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
      console.log('🔄 EnhancedAIAssistant sending message:', input);
      
      // Use the new chatApi
      const response = await chatApi.sendMessage(
        input,
        undefined, // conversationId
        'auto', // provider
        currentModel === 'auto' ? undefined : currentModel // model
      );

      console.log('📥 EnhancedAIAssistant received response:', response);
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
        model: response.model,
        provider: response.provider
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
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
      
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
      setTranscript('');
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
      
      toast.success(rating > 3 ? 'Thanks for the positive feedback!' : 'Thanks for your feedback. We\'ll work to improve.');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  const availableModels = chatApi.getAvailableModels();

  return (
    <div className="flex flex-col h-[700px] bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-200 bg-white/80 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Genesis AI Assistant Pro</h2>
            <p className="text-xs text-gray-500">Powered by Advanced AI</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-blue-50/30">
        {messages.map((message, index) => (
          <motion.div 
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`flex items-start space-x-3 ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                
                <div className="mt-3 flex items-center justify-between text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.provider && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {message.provider.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            {message.role === 'assistant' && (
              <div className="flex items-center justify-end space-x-2 mt-2 ml-11">
                <button
                  onClick={() => handleFeedback(message.id, 5)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    message.feedback?.rating === 5 
                      ? 'bg-green-100 text-green-600 shadow-sm' 
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:shadow-sm'
                  }`}
                  title="This response was helpful"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedback(message.id, 1)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    message.feedback?.rating === 1 
                      ? 'bg-red-100 text-red-600 shadow-sm' 
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm'
                  }`}
                  title="This response was not helpful"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
        
        {streamingContent && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[85%] rounded-2xl p-4 bg-white text-gray-900 border border-gray-200 shadow-sm">
              <div className="whitespace-pre-wrap leading-relaxed">{streamingContent}</div>
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">AI is typing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {isLoading && !streamingContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-3 text-gray-500 py-8"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm font-medium">AI is thinking...</span>
          </motion.div>
        )}
        
        {isListening && transcript && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-50 border border-blue-200 p-4 rounded-xl mx-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Listening...</span>
            </div>
            <p className="text-sm text-blue-800">{transcript}</p>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-blue-200 bg-white rounded-b-xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-full transition-all duration-200 shadow-sm ${
                isListening 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about business automation, cultural heritage, or genealogy..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInput("Help me with genealogy research")}
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Genealogy Research
            </button>
            <button
              type="button"
              onClick={() => setInput("How can I automate my business processes?")}
              className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              Business Automation
            </button>
            <button
              type="button"
              onClick={() => setInput("Tell me about cultural heritage preservation")}
              className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              Cultural Heritage
            </button>
          </div>
        </form>
      </div>

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
                <h3 className="text-xl font-semibold text-gray-900">Assistant Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Model</h4>
                  <select
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Custom Instructions</h4>
                  <button
                    onClick={() => setShowCustomInstructionsEditor(true)}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Edit Custom Instructions</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      toast.success('Settings saved');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Instructions Editor */}
      {showCustomInstructionsEditor && (
        <AICustomInstructionsEditor
          isOpen={showCustomInstructionsEditor}
          onClose={() => setShowCustomInstructionsEditor(false)}
        />
      )}
    </div>
  );
};