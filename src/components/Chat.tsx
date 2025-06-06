import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Brain, Upload, BookOpen, Briefcase, Users, Clock, Sparkles, ArrowRight, Workflow, ListChecks, Globe, Trophy, Mic, MicOff, LogIn } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { streamResponse, AIModel, getBestModelForTask } from '../lib/ai';
import { analyzeGenealogyData, generatePersonalizedPlan, AnalysisResult } from '../lib/analyzers';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'assistant' | 'user' | 'system' | 'agent';
  content: string;
  timestamp: Date;
  model?: AIModel;
  analysis?: AnalysisResult[];
  selectedPathway?: string;
  agentType?: string;
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
    `As a Workflow Automation Specialist, considering the cultural background (${ancestry}) and business context (${businessGoals}), I'll help optimize your workflows. Let's start by identifying key processes that can be automated while respecting traditional practices.`,
  
  'Task Management Optimization': (ancestry: string, businessGoals: string) =>
    `As a Task Management Expert with cultural sensitivity, I understand your background (${ancestry}) and business needs (${businessGoals}). Let's create a personalized task management system that aligns with your values and goals.`,
  
  'Meeting Efficiency': (ancestry: string, businessGoals: string) =>
    `As a Meeting Optimization Specialist familiar with diverse business practices, I'll help you create meeting protocols that respect your cultural background (${ancestry}) while achieving your business objectives (${businessGoals}).`,
  
  'Cultural Identity Exploration': (ancestry: string, businessGoals: string) =>
    `As a Cultural Identity Guide, I'll help you explore and integrate your rich heritage (${ancestry}) into your business practices (${businessGoals}), creating authentic connections with your roots.`,
  
  'Leadership Development': (ancestry: string, businessGoals: string) =>
    `As a Leadership Development Coach with cultural expertise, I'll help you develop leadership skills that honor your heritage (${ancestry}) while advancing your business goals (${businessGoals}).`,
  
  'Traditional Wisdom Integration': (ancestry: string, businessGoals: string) =>
    `As a Traditional Wisdom Integration Specialist, I'll help you incorporate ancestral knowledge (${ancestry}) into modern business practices (${businessGoals}), creating a unique competitive advantage.`
};

const automationPathways = ['Workflow Automation', 'Task Management Optimization', 'Meeting Efficiency'];

export const Chat: React.FC<ChatProps> = ({ userName, ancestry, businessGoals }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel>('gpt-4');
  const [streamingContent, setStreamingContent] = useState('');
  const [isAutoModel, setIsAutoModel] = useState(true);
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      content: 'Based on your information, I\'ve prepared some initial insights and recommendations:',
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
      // Here you would typically send this to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your interest! Our team will contact you shortly.');
      setShowContactForm(false);
      
      // Add a confirmation message to the chat
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
      // Sign out the user and clear their session
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

  const isAuthenticated = session?.access_token;

  const handlePathwayClick = async (pathway: string, category: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to continue');
      return;
    }

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
        currentModel
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

      if (automationPathways.includes(pathway)) {
        setShowContactForm(true);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (handleAuthError(error)) {
        return; // Stop execution if authentication error is handled
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        model: currentModel
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to continue');
      return;
    }

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
      for await (const chunk of streamResponse(option, currentModel)) {
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
      if (handleAuthError(error)) {
        return; // Stop execution if authentication error is handled
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        model: currentModel
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to continue');
      return;
    }

    const selectedModel = isAutoModel ? getBestModelForTask(input) : currentModel;
    if (isAutoModel) {
      setCurrentModel(selectedModel);
    }

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
      for await (const chunk of streamResponse(input, selectedModel)) {
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
      if (handleAuthError(error)) {
        return; // Stop execution if authentication error is handled
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        model: selectedModel
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
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors",
                        isAuthenticated
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePathwayClick(pathway, result.title);
                      }}
                      disabled={!isAuthenticated}
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
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    isAuthenticated
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "bg-gray-50 text-gray-400 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(`Help me with: ${rec}`);
                  }}
                  disabled={!isAuthenticated}
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

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis Assistant</span>
        </div>
        <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors",
              isAuthenticated
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            )}
            disabled={isLoading || !isAuthenticated}
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
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              Please sign in to access the full chat functionality and AI features.
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
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !isAuthenticated 
                  ? 'Please sign in to chat...' 
                  : isListening 
                    ? 'Listening...' 
                    : 'Type or click the microphone to speak...'
              }
              className={cn(
                "w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none",
                isAuthenticated
                  ? "border-blue-200 focus:ring-2 focus:ring-blue-500"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              )}
              disabled={isLoading || !isAuthenticated}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors",
                !isAuthenticated
                  ? "text-gray-400 cursor-not-allowed"
                  : isListening 
                    ? "text-red-500 hover:text-red-600 bg-red-50" 
                    : "text-blue-500 hover:text-blue-600 bg-blue-50"
              )}
              disabled={!isAuthenticated}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !isListening) || !isAuthenticated}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              isAuthenticated
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};