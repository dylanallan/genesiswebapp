import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain, Upload, BookOpen, Briefcase, Users, Clock, Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { streamResponse, getBestModelForTask, getMockResponse } from '../lib/ai';
import { analyzeGenealogyData, generatePersonalizedPlan, AnalysisResult } from '../lib/analyzers';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: Date;
  model?: string;
  analysis?: AnalysisResult[];
  selectedPathway?: string;
  agentType?: string;
}

interface ChatProps {
  userName: string;
  ancestry: string;
  businessGoals: string;
}

const agentPrompts = {
  'Workflow Automation': (ancestry: string, businessGoals: string) => 
    `As a Workflow Automation Specialist with expertise in business process optimization, considering your cultural background (${ancestry}) and business context (${businessGoals}), I'll help you create efficient automated workflows that respect traditional practices while maximizing productivity. Let's identify key processes that can be streamlined.`,
  
  'Task Management Optimization': (ancestry: string, businessGoals: string) =>
    `As a Task Management Expert specializing in culturally-sensitive productivity systems, I understand your background (${ancestry}) and business needs (${businessGoals}). Let's create a personalized task management system that aligns with your values and maximizes efficiency.`,
  
  'Meeting Efficiency': (ancestry: string, businessGoals: string) =>
    `As a Meeting Optimization Specialist with experience in diverse business cultures, I'll help you create meeting protocols that respect your cultural background (${ancestry}) while achieving your business objectives (${businessGoals}) efficiently.`,
  
  'Cultural Identity Exploration': (ancestry: string, businessGoals: string) =>
    `As a Cultural Identity Guide with deep knowledge of heritage integration, I'll help you explore and integrate your rich heritage (${ancestry}) into your business practices (${businessGoals}), creating authentic connections with your roots.`,
  
  'Leadership Development': (ancestry: string, businessGoals: string) =>
    `As a Leadership Development Coach with cultural expertise, I'll help you develop leadership skills that honor your heritage (${ancestry}) while advancing your business goals (${businessGoals}) using proven methodologies.`,
  
  'Traditional Wisdom Integration': (ancestry: string, businessGoals: string) =>
    `As a Traditional Wisdom Integration Specialist, I'll help you incorporate ancestral knowledge (${ancestry}) into modern business practices (${businessGoals}), creating a unique competitive advantage through cultural wisdom.`
};

const automationPathways = ['Workflow Automation', 'Task Management Optimization', 'Meeting Efficiency'];

export const Chat: React.FC<ChatProps> = ({ userName, ancestry, businessGoals }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialAnalysis = generatePersonalizedPlan(ancestry, businessGoals);
    const initialMessage: Message = {
      role: 'system',
      content: 'Welcome to Genesis Heritage Pro! I\'ve prepared some personalized insights based on your profile:',
      timestamp: new Date(),
      analysis: initialAnalysis
    };
    setMessages([initialMessage]);
  }, [ancestry, businessGoals]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingMessage: Message = {
      role: 'system',
      content: `Analyzing your family tree data from ${file.name}...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    setIsLoading(true);
    try {
      const analysis = await analyzeGenealogyData(file);
      setMessages(prev => prev.filter(msg => msg !== loadingMessage));
      
      const analysisMessage: Message = {
        role: 'system',
        content: `I've analyzed your family tree data from ${file.name}. Here's what I found:`,
        timestamp: new Date(),
        analysis
      };
      
      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Error analyzing file:', error);
      setMessages(prev => [...prev.filter(msg => msg !== loadingMessage), {
        role: 'assistant',
        content: 'I apologize, but I encountered an error analyzing your file. Please ensure it\'s a CSV file with family tree data and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePathwayClick = async (pathway: string, category: string) => {
    const agentPrompt = agentPrompts[pathway as keyof typeof agentPrompts];
    if (!agentPrompt) return;

    const userMessage: Message = {
      role: 'user',
      content: `I'd like to explore the ${pathway} pathway`,
      timestamp: new Date(),
      selectedPathway: pathway
    };

    const agentMessage: Message = {
      role: 'agent',
      content: `👋 Hello ${userName}, I'm your ${pathway} specialist.`,
      timestamp: new Date(),
      agentType: pathway
    };

    setMessages(prev => [...prev, userMessage, agentMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullResponse = '';
      
      for await (const chunk of streamResponse(
        agentPrompt(ancestry, businessGoals),
        getBestModelForTask(pathway) as any
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: currentModel,
        selectedPathway: pathway
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error: any) {
      console.error('Error:', error);
      
      const fallbackResponse = await getMockResponse(agentPrompt(ancestry, businessGoals));
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

  const handleOptionClick = async (option: string) => {
    const userMessage: Message = {
      role: 'user',
      content: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      let fullResponse = '';
      
      const promptWithContext = `User ${userName} with ancestry ${ancestry} and business goals ${businessGoals} says: ${option}`;

      for await (const chunk of streamResponse(
        promptWithContext, 
        getBestModelForTask(option) as any
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: currentModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error: any) {
      console.error('Error:', error);
      
      const fallbackResponse = await getMockResponse(option);
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
      
      const promptWithContext = `User ${userName} with ancestry ${ancestry} and business goals ${businessGoals} says: ${input}`;

      for await (const chunk of streamResponse(
        promptWithContext, 
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
      
      // Improved error handling with more detailed fallback
      let fallbackResponse;
      try {
        fallbackResponse = await getMockResponse(input);
      } catch (fallbackError) {
        fallbackResponse = "I apologize, but I'm experiencing technical difficulties at the moment. Please try again in a few moments.";
      }
      
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

  const renderAnalysis = (analysis: AnalysisResult[]) => (
    <div className="space-y-4 mt-2">
      {analysis.map((result, index) => (
        <div 
          key={index} 
          className={cn(
            "bg-blue-50 p-4 rounded-lg transition-all duration-200",
            selectedCategory === result.category
              ? "ring-2 ring-blue-500"
              : "hover:bg-blue-100 cursor-pointer"
          )}
          onClick={() => setSelectedCategory(
            selectedCategory === result.category ? null : result.category
          )}
        >
          <div className="flex items-center space-x-2">
            {result.category === 'time' && <Clock className="w-5 h-5 text-blue-600" />}
            {result.category === 'growth' && <Sparkles className="w-5 h-5 text-blue-600" />}
            {result.category === 'ancestry' && <BookOpen className="w-5 h-5 text-blue-600" />}
            {result.category === 'business' && <Briefcase className="w-5 h-5 text-blue-600" />}
            <h3 className="font-semibold text-blue-900">{result.title}</h3>
          </div>
          
          <p className="text-blue-800 mt-2">{result.summary}</p>
          
          <div className="mt-4 space-y-4">
            {selectedCategory === result.category && result.pathways && (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Available Pathways:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.pathways.map((pathway, idx) => (
                    <button
                      key={idx}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePathwayClick(pathway, result.title);
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{pathway}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900">Recommendations:</h4>
              {result.recommendations.map((rec, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(`Help me with: ${rec}`);
                  }}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const getMessageIcon = (message: Message) => {
    if (message.role === 'agent') {
      return <Bot className="w-6 h-6 text-blue-500" />;
    }
    return message.role === 'user' ? 
      <User className="w-6 h-6 text-gray-500" /> : 
      <Brain className="w-6 h-6 text-blue-500" />;
  };

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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            disabled={isLoading}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Family Tree (CSV)</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={cn(
              "flex items-start space-x-2",
              message.role === 'assistant' || message.role === 'system' || message.role === 'agent' ? 'justify-start' : 'justify-end'
            )}>
              {(message.role === 'assistant' || message.role === 'system' || message.role === 'agent') && getMessageIcon(message)}
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === 'user' ? "bg-gray-50 text-gray-900" : 
                message.role === 'agent' ? "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900" :
                "bg-blue-50 text-gray-900"
              )}>
                <ReactMarkdown className="prose prose-sm">
                  {message.content}
                </ReactMarkdown>
                {message.analysis && renderAnalysis(message.analysis)}
              </div>
              {message.role === 'user' && getMessageIcon(message)}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex items-start space-x-2">
            <Brain className="w-6 h-6 text-blue-500 mt-2" />
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
        <div className="flex space-x-2 mb-2">
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
        </div>
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