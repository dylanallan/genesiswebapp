import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Loader2, 
  Zap, 
  Workflow, 
  Calendar, 
  Mail, 
  FileText, 
  Database, 
  Users, 
  X,
  ArrowRight,
  Mic,
  MicOff,
  Settings,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { streamResponse } from '../lib/ai';
import { N8NIntegration } from './N8NIntegration';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AutomationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkflow?: (workflowType: string) => void;
}

export const AutomationAssistant: React.FC<AutomationAssistantProps> = ({ 
  isOpen, 
  onClose,
  onCreateWorkflow
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showN8NIntegration, setShowN8NIntegration] = useState(false);
  const [isN8NConnected, setIsN8NConnected] = useState(false);
  const [n8nUrl, setN8nUrl] = useState('');
  const [generatedWorkflows, setGeneratedWorkflows] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const session = useSession();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial welcome message
      setMessages([
        {
          role: 'assistant',
          content: "👋 I'm your Automation Assistant. I can help you create, manage, and optimize your business automation workflows. How can I assist you today?",
          timestamp: new Date()
        }
      ]);
    }

    initializeSpeechRecognition();
    checkN8NConnection();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkN8NConnection = () => {
    const isConnected = localStorage.getItem('n8n_connected') === 'true';
    const url = localStorage.getItem('n8n_url') || '';
    setIsN8NConnected(isConnected);
    setN8nUrl(url);
  };

  const initializeSpeechRecognition = () => {
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
        setTranscript(transcript);
        setInput(transcript);
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
      
      // Enhanced prompt for automation-specific guidance
      const automationPrompt = `As an automation assistant for Genesis Heritage, help with this request about business automation: ${input}
      
      Consider the following automation capabilities:
      1. Workflow automation using n8n
      2. Document processing and data extraction
      3. Email and communication automation
      4. Calendar and scheduling automation
      5. CRM and customer journey automation
      6. Data synchronization between systems
      
      If the user is asking to create a specific automation workflow, provide detailed steps on how to implement it with n8n.
      If they're asking about connecting systems, explain the integration options available.
      If they're asking about best practices, provide actionable advice for their specific use case.
      
      Be specific, practical, and focus on actionable steps they can take.`;
      
      for await (const chunk of streamResponse(
        automationPrompt,
        selectedModel as any
      )) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      // Check if this is a workflow creation request
      if (input.toLowerCase().includes('create') && 
          (input.toLowerCase().includes('workflow') || 
           input.toLowerCase().includes('automation'))) {
        // Generate a workflow
        await generateWorkflow(input, fullResponse);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Fallback response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or check your n8n connection if you're trying to create a workflow.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTranscript('');
    }
  };

  const generateWorkflow = async (input: string, aiResponse: string) => {
    if (!isN8NConnected) {
      toast.error('Please connect to n8n first to generate workflows');
      setShowN8NIntegration(true);
      return;
    }

    try {
      // Extract workflow type from input
      const workflowTypes = [
        'customer onboarding', 'lead nurturing', 'document processing', 
        'invoice processing', 'email campaign', 'data sync', 
        'meeting scheduler', 'social media', 'cultural event'
      ];
      
      let workflowType = 'custom workflow';
      for (const type of workflowTypes) {
        if (input.toLowerCase().includes(type)) {
          workflowType = type;
          break;
        }
      }
      
      // Generate a mock workflow
      const newWorkflow = {
        id: Date.now().toString(),
        name: `${workflowType.charAt(0).toUpperCase() + workflowType.slice(1)} Workflow`,
        description: `Automatically generated ${workflowType} workflow based on your request`,
        createdAt: new Date(),
        n8nUrl: `${n8nUrl}/workflow/new`,
        status: 'draft',
        nodes: []
      };
      
      setGeneratedWorkflows(prev => [...prev, newWorkflow]);
      
      // Notify the user
      toast.success(`Created ${workflowType} workflow! Open in n8n to customize.`);
      
      // Call the callback if provided
      if (onCreateWorkflow) {
        onCreateWorkflow(workflowType);
      }
      
      // Add a message about the workflow creation
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've created a ${workflowType} workflow template for you. You can now open it in n8n to customize it further. Would you like me to explain how to set it up?`,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast.error('Failed to generate workflow');
    }
  };

  const automationTemplates = [
    { name: 'Customer Onboarding', icon: Users, description: 'Automate the customer onboarding process' },
    { name: 'Document Processing', icon: FileText, description: 'Extract data from documents and process automatically' },
    { name: 'Email Campaigns', icon: Mail, description: 'Schedule and send personalized email campaigns' },
    { name: 'Meeting Scheduler', icon: Calendar, description: 'Automate meeting scheduling and reminders' },
    { name: 'Data Synchronization', icon: Database, description: 'Keep data in sync across multiple systems' },
    { name: 'Cultural Event Notifications', icon: Calendar, description: 'Send notifications for cultural events and celebrations' },
    { name: 'Lead Nurturing', icon: Users, description: 'Automatically nurture leads with personalized content' },
    { name: 'Invoice Processing', icon: FileText, description: 'Automate invoice processing and payment tracking' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Automation Assistant</h2>
            <div className="flex items-center space-x-1 ml-2">
              {isN8NConnected ? (
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>n8n Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                  <Clock className="w-3 h-3" />
                  <span>n8n Not Connected</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowN8NIntegration(true)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Connect to n8n"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Start Templates */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <h3 className="font-medium text-blue-900 mb-3">Quick Start Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {automationTemplates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isN8NConnected) {
                        toast.error('Please connect to n8n first');
                        setShowN8NIntegration(true);
                        return;
                      }
                      
                      if (onCreateWorkflow) {
                        onCreateWorkflow(template.name);
                      }
                      
                      // Generate a workflow
                      const newWorkflow = {
                        id: Date.now().toString(),
                        name: template.name,
                        description: template.description,
                        createdAt: new Date(),
                        n8nUrl: `${n8nUrl}/workflow/new`,
                        status: 'draft',
                        nodes: []
                      };
                      
                      setGeneratedWorkflows(prev => [...prev, newWorkflow]);
                      
                      // Add a message about the workflow creation
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `I've created a ${template.name} workflow template for you. You can now open it in n8n to customize it further. Would you like me to explain how to set it up?`,
                        timestamp: new Date()
                      }]);
                      
                      toast.success(`Creating ${template.name} workflow...`);
                    }}
                    className="flex items-center space-x-2 p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">{template.name}</p>
                      <p className="text-xs text-blue-700 line-clamp-1">{template.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Generated Workflows */}
          {generatedWorkflows.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
              <h3 className="font-medium text-green-900 mb-3">Generated Workflows</h3>
              <div className="space-y-3">
                {generatedWorkflows.map((workflow, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{workflow.name}</p>
                      <p className="text-xs text-gray-500">{workflow.description}</p>
                    </div>
                    <a 
                      href={workflow.n8nUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in n8n</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && !streamingContent && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-gray-100 text-gray-900">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
              </div>
            </div>
          )}
          
          {isListening && transcript && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">{transcript}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask about automation...'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-500">AI Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1"
              >
                <option value="gpt-4">GPT-4 (Advanced)</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            
            {!isN8NConnected && (
              <button
                type="button"
                onClick={() => setShowN8NIntegration(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Connect to n8n for workflow automation
              </button>
            )}
          </div>
        </form>
      </motion.div>
      
      {/* N8N Integration Modal */}
      {showN8NIntegration && (
        <N8NIntegration 
          isOpen={showN8NIntegration} 
          onClose={() => {
            setShowN8NIntegration(false);
            checkN8NConnection();
          }}
        />
      )}
    </div>
  );
};