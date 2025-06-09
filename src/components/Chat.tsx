import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain, Upload, BookOpen, Briefcase, Users, Clock, Sparkles, ArrowRight, Workflow, ListChecks, Globe, Trophy, Mic, MicOff, LogIn, AlertCircle, Settings, Zap, CheckCircle, XCircle, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { streamResponse, getBestModelForTask, getMockResponse, checkAIServiceHealth, getAIProviderStatus, getAvailableModels, enableAIProvider, disableAIProvider, getProviderMetrics } from '../lib/production-ai';
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
  provider?: string;
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    confidence?: number;
  };
}

interface ChatProps {
  userName: string;
  ancestry: string;
  businessGoals: string;
}

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  requirements: string;
  budget: string;
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState<ContactFormData>({
    name: userName,
    email: '',
    company: '',
    requirements: '',
    budget: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [session, setSession] = useState<any>(null);
  const [aiServiceHealth, setAiServiceHealth] = useState<boolean>(true);
  const [providerStatus, setProviderStatus] = useState<Map<string, any>>(new Map());
  const [showProviderStatus, setShowProviderStatus] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [showProviderMetrics, setShowProviderMetrics] = useState(false);
  const [selectedProviderMetrics, setSelectedProviderMetrics] = useState<string | null>(null);
  const [providerMetrics, setProviderMetrics] = useState<Map<string, any>>(new Map());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      if (session) {
        const isHealthy = await checkAIServiceHealth();
        setAiServiceHealth(isHealthy);
        
        const status = await getAIProviderStatus();
        setProviderStatus(status);
      }
    };

    checkHealth();
    const healthInterval = setInterval(checkHealth, 60000);

    return () => clearInterval(healthInterval);
  }, [session]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const initialAnalysis = generatePersonalizedPlan(ancestry, businessGoals);
    const initialMessage: Message = {
      role: 'system',
      content: 'Welcome to Genesis Heritage Pro! I\'ve prepared some personalized insights based on your profile:',
      timestamp: new Date(),
      analysis: initialAnalysis
    };
    setMessages([initialMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your interest! Our team will contact you shortly.');
      setShowContactForm(false);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Thank you for your interest in our automation services! We've received your request and will contact you at ${contactData.email} shortly with a customized proposal.`,
        timestamp: new Date()
      }]);
    } catch (error) {
      toast.error('There was an error submitting your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAuthError = async (error: any) => {
    if (error.message === 'Authentication required') {
      toast.error('Your session has expired. Please sign in again.');
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const handleProviderToggle = async (providerId: string, isActive: boolean) => {
    try {
      if (isActive) {
        const apiKey = prompt(`Enter API key for ${providerId}:`);
        if (apiKey) {
          await enableAIProvider(providerId, apiKey);
        }
      } else {
        await disableAIProvider(providerId);
      }
      
      const status = await getAIProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      console.error('Error toggling provider:', error);
      toast.error('Failed to update provider status');
    }
  };

  const loadProviderMetrics = async (providerId: string) => {
    try {
      const metrics = await getProviderMetrics(providerId, 7);
      setProviderMetrics(prev => new Map(prev.set(providerId, metrics)));
    } catch (error) {
      console.error('Error loading provider metrics:', error);
      toast.error('Failed to load provider metrics');
    }
  };

  const isAuthenticated = session?.access_token;

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

    const startTime = Date.now();

    try {
      let fullResponse = '';
      let provider = '';
      
      if (isAuthenticated && aiServiceHealth) {
        for await (const chunk of streamResponse(
          agentPrompt(ancestry, businessGoals),
          getBestModelForTask(pathway) as any,
          `pathway:${pathway}`
        )) {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }
        provider = 'AI Router';
      } else {
        fullResponse = await getMockResponse(pathway);
        setStreamingContent(fullResponse);
        provider = 'Mock Response';
      }
      
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: currentModel,
        selectedPathway: pathway,
        provider,
        metadata: {
          responseTime,
          tokensUsed: Math.ceil(fullResponse.length / 4),
          confidence: 0.95
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');

      if (automationPathways.includes(pathway)) {
        setShowContactForm(true);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (isAuthenticated && await handleAuthError(error)) {
        return;
      }
      
      const fallbackResponse = await getMockResponse(pathway);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        model: 'fallback',
        provider: 'Fallback System'
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

    const startTime = Date.now();

    try {
      let fullResponse = '';
      let provider = '';
      
      if (isAuthenticated && aiServiceHealth) {
        for await (const chunk of streamResponse(
          option, 
          getBestModelForTask(option) as any
        )) {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }
        provider = 'AI Router';
      } else {
        fullResponse = await getMockResponse(option);
        setStreamingContent(fullResponse);
        provider = 'Mock Response';
      }
      
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: currentModel,
        provider,
        metadata: {
          responseTime,
          tokensUsed: Math.ceil(fullResponse.length / 4),
          confidence: 0.92
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error: any) {
      console.error('Error:', error);
      if (isAuthenticated && await handleAuthError(error)) {
        return;
      }
      
      const fallbackResponse = await getMockResponse(option);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        model: 'fallback',
        provider: 'Fallback System'
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

    const startTime = Date.now();

    try {
      let fullResponse = '';
      let provider = '';
      
      if (isAuthenticated && aiServiceHealth) {
        for await (const chunk of streamResponse(input, selectedModel as any)) {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }
        provider = 'AI Router';
      } else {
        fullResponse = await getMockResponse(input);
        setStreamingContent(fullResponse);
        provider = 'Mock Response';
      }
      
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: selectedModel,
        provider,
        metadata: {
          responseTime,
          tokensUsed: Math.ceil(fullResponse.length / 4),
          confidence: 0.88
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error: any) {
      console.error('Error:', error);
      if (isAuthenticated && await handleAuthError(error)) {
        return;
      }
      
      const fallbackResponse = await getMockResponse(input);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        model: 'fallback',
        provider: 'Fallback System'
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
      switch (message.agentType) {
        case 'Workflow Automation':
          return <Workflow className="w-6 h-6 text-purple-500" />;
        case 'Task Management Optimization':
          return <ListChecks className="w-6 h-6 text-green-500" />;
        case 'Meeting Efficiency':
          return <Users className="w-6 h-6 text-blue-500" />;
        case 'Cultural Identity Exploration':
          return <Globe className="w-6 h-6 text-amber-500" />;
        case 'Leadership Development':
          return <Trophy className="w-6 h-6 text-yellow-500" />;
        case 'Traditional Wisdom Integration':
          return <BookOpen className="w-6 h-6 text-red-500" />;
        default:
          return <Bot className="w-6 h-6 text-blue-500" />;
      }
    }
    return message.role === 'user' ? 
      <User className="w-6 h-6 text-gray-500" /> : 
      <Brain className="w-6 h-6 text-blue-500" />;
  };

  const availableModels = getAvailableModels();

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis AI Assistant Pro</span>
          {!aiServiceHealth && (
            <div className="flex items-center space-x-1 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Limited Mode</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In for Full AI</span>
            </button>
          )}
          
          <button
            onClick={() => setShowProviderStatus(!showProviderStatus)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>AI Status</span>
          </button>
          
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

      {showProviderStatus && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">AI Provider Status</h4>
            <div className="flex items-center space-x-2">
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setShowProviderSettings(!showProviderSettings)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowProviderMetrics(!showProviderMetrics)}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from(providerStatus.entries()).map(([id, status]) => (
              <div key={id} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${status.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-700 font-medium">{status.name}</span>
                  {status.circuitBreakerOpen && (
                    <AlertCircle className="w-3 h-3 text-red-500" title="Circuit breaker open" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{Math.round(status.performance * 100)}%</span>
                  {status.hasApiKey ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  {showProviderSettings && isAuthenticated && (
                    <button
                      onClick={() => handleProviderToggle(id, !status.isActive)}
                      className={`px-2 py-1 text-xs rounded ${
                        status.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {status.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                  {showProviderMetrics && isAuthenticated && (
                    <button
                      onClick={() => {
                        setSelectedProviderMetrics(id);
                        loadProviderMetrics(id);
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                    >
                      Metrics
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedProviderMetrics && providerMetrics.has(selectedProviderMetrics) && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h5 className="font-medium text-gray-900 mb-2">
                {providerStatus.get(selectedProviderMetrics)?.name} - 7 Day Metrics
              </h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {(() => {
                  const metrics = providerMetrics.get(selectedProviderMetrics);
                  return (
                    <>
                      <div>
                        <span className="text-gray-500">Requests:</span>
                        <div className="font-medium">{metrics?.total_requests || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <div className="font-medium">{Math.round((metrics?.success_rate || 0) * 100)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Response:</span>
                        <div className="font-medium">{metrics?.avg_response_time_ms || 0}ms</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 font-medium">
              🤖 You can explore basic features now, but sign in for full AI-powered insights!
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Access to GPT-4, Claude 3, Gemini Pro, DylanAllan.io, DeepSeek, Perplexity, and more specialized AI models
            </p>
          </div>
        )}
        
        {!aiServiceHealth && isAuthenticated && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 font-medium">
              ⚠️ AI services are temporarily limited. Basic responses are available.
            </p>
          </div>
        )}
        
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
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    {message.provider && (
                      <span>via {message.provider}</span>
                    )}
                    {message.metadata?.responseTime && (
                      <span>• {message.metadata.responseTime}ms</span>
                    )}
                    {message.metadata?.tokensUsed && (
                      <span>• {message.metadata.tokensUsed} tokens</span>
                    )}
                  </div>
                  {message.metadata?.confidence && (
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3" />
                      <span>{Math.round(message.metadata.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
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
        {showContactForm && (
          <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Custom Automation Solution</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={contactData.company}
                  onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requirements</label>
                <textarea
                  value={contactData.requirements}
                  onChange={(e) => setContactData({ ...contactData, requirements: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Budget Range</label>
                <select
                  value={contactData.budget}
                  onChange={(e) => setContactData({ ...contactData, budget: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a range</option>
                  <option value="5k-10k">$5,000 - $10,000</option>
                  <option value="10k-25k">$10,000 - $25,000</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k+">$50,000+</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Request Custom Solution'
                )}
              </button>
            </form>
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
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type or click the microphone to speak...'}
              className="w-full px-4 py-2 pr-10 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors",
                isListening 
                  ? "text-red-500 hover:text-red-600 bg-red-50" 
                  : "text-blue-500 hover:text-blue-600 bg-blue-50"
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !isListening)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};