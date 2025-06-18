import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash, 
  Edit, 
  Copy, 
  ExternalLink, 
  Search,
  Loader2,
  Bot,
  Mic,
  MicOff,
  Send,
  ArrowRight,
  Calendar,
  Mail,
  FileText,
  Database,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { streamResponse } from '../lib/ai';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  lastRun: string;
  nextRun: string;
  tags: string[];
  n8nUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AutomationInterface: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AutomationAssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWorkflows();
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    if (showAssistant && assistantMessages.length === 0) {
      // Add initial assistant message
      setAssistantMessages([
        {
          role: 'assistant',
          content: "👋 I'm your Automation Assistant. I can help you create, manage, and optimize your business automation workflows. How can I assist you today?",
          timestamp: new Date()
        }
      ]);
    }
  }, [showAssistant]);

  useEffect(() => {
    scrollToBottom();
  }, [assistantMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        setVoiceTranscript(transcript);
        setAssistantInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsVoiceActive(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsVoiceActive(false);
      };
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isVoiceActive) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
    } else {
      recognitionRef.current.start();
      setIsVoiceActive(true);
      setVoiceTranscript('');
      toast.success('Listening... Speak now');
    }
  };

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your n8n instance via an API
      // For demo purposes, we'll use mock data
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Customer Onboarding',
          description: 'Automates the customer onboarding process including welcome emails, data collection, and CRM updates',
          status: 'active',
          lastRun: '2025-06-10T15:30:00Z',
          nextRun: '2025-06-11T15:30:00Z',
          tags: ['customer', 'email', 'crm'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/1',
          createdAt: '2025-05-15T10:00:00Z',
          updatedAt: '2025-06-09T14:20:00Z'
        },
        {
          id: '2',
          name: 'Invoice Processing',
          description: 'Extracts data from invoices, updates accounting system, and sends payment reminders',
          status: 'active',
          lastRun: '2025-06-10T12:15:00Z',
          nextRun: '2025-06-11T12:15:00Z',
          tags: ['finance', 'accounting', 'documents'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/2',
          createdAt: '2025-05-20T11:30:00Z',
          updatedAt: '2025-06-08T09:45:00Z'
        },
        {
          id: '3',
          name: 'Social Media Scheduler',
          description: 'Schedules and posts content to multiple social media platforms based on optimal timing',
          status: 'inactive',
          lastRun: '2025-06-05T08:00:00Z',
          nextRun: '',
          tags: ['marketing', 'social media', 'content'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/3',
          createdAt: '2025-05-25T14:20:00Z',
          updatedAt: '2025-06-05T16:10:00Z'
        },
        {
          id: '4',
          name: 'Lead Qualification',
          description: 'Scores and qualifies leads based on behavior, engagement, and demographic data',
          status: 'active',
          lastRun: '2025-06-10T09:00:00Z',
          nextRun: '2025-06-10T21:00:00Z',
          tags: ['sales', 'leads', 'crm'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/4',
          createdAt: '2025-06-01T13:45:00Z',
          updatedAt: '2025-06-07T11:30:00Z'
        },
        {
          id: '5',
          name: 'Data Backup',
          description: 'Automatically backs up critical business data to secure cloud storage',
          status: 'draft',
          lastRun: '',
          nextRun: '',
          tags: ['data', 'security', 'backup'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/5',
          createdAt: '2025-06-08T16:20:00Z',
          updatedAt: '2025-06-08T16:20:00Z'
        }
      ];

      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load automation workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim() || isAssistantLoading) return;

    const userMessage: AutomationAssistantMessage = {
      role: 'user',
      content: assistantInput,
      timestamp: new Date()
    };

    setAssistantMessages(prev => [...prev, userMessage]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
      let fullResponse = '';
      
      // Use the AI streaming function
      for await (const chunk of streamResponse(
        `As an automation assistant, help with this request about business automation: ${assistantInput}`,
        'gpt-4'
      )) {
        fullResponse += chunk;
      }
      
      const assistantMessage: AutomationAssistantMessage = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };

      setAssistantMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Fallback response
      setAssistantMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      }]);
    } finally {
      setIsAssistantLoading(false);
      setVoiceTranscript('');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getWorkflowIcon = (tags: string[]) => {
    if (tags.includes('email') || tags.includes('mail')) {
      return <Mail className="w-5 h-5 text-blue-500" />;
    } else if (tags.includes('document') || tags.includes('documents')) {
      return <FileText className="w-5 h-5 text-orange-500" />;
    } else if (tags.includes('data') || tags.includes('database')) {
      return <Database className="w-5 h-5 text-purple-500" />;
    } else if (tags.includes('customer') || tags.includes('crm') || tags.includes('leads')) {
      return <Users className="w-5 h-5 text-green-500" />;
    } else if (tags.includes('schedule') || tags.includes('calendar')) {
      return <Calendar className="w-5 h-5 text-red-500" />;
    } else {
      return <Workflow className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Business Automation Hub</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAssistant(!showAssistant)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Bot className="w-5 h-5" />
            <span>Automation Assistant</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workflows by name, description, or tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Workflow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? `No results for "${searchTerm}"` 
                  : 'Start by creating your first automation workflow'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Workflow
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedWorkflow?.id === workflow.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedWorkflow(
                    selectedWorkflow?.id === workflow.id ? null : workflow
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getWorkflowIcon(workflow.tags)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                            {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                          </span>
                          {workflow.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                          {workflow.tags.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{workflow.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`${workflow.status === 'active' ? 'Paused' : 'Activated'} ${workflow.name}`);
                          setWorkflows(workflows.map(w => 
                            w.id === workflow.id 
                              ? {...w, status: w.status === 'active' ? 'inactive' : 'active'} 
                              : w
                          ));
                        }}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(workflow.n8nUrl, '_blank');
                        }}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedWorkflow?.id === workflow.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Last Run</p>
                          <p className="text-sm text-gray-700">{formatDate(workflow.lastRun)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Next Run</p>
                          <p className="text-sm text-gray-700">{formatDate(workflow.nextRun)}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toast.info('Edit workflow in n8n')}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => toast.info('Duplicating workflow...')}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this workflow?')) {
                              toast.success('Workflow deleted');
                              setWorkflows(workflows.filter(w => w.id !== workflow.id));
                              setSelectedWorkflow(null);
                            }
                          }}
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Automation Assistant */}
        <div className={`lg:col-span-1 ${showAssistant ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-gray-900">Automation Assistant</h3>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {assistantMessages.map((message, index) => (
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
              
              {isAssistantLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
              
              {isVoiceActive && voiceTranscript && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">{voiceTranscript}</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleAssistantSubmit} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`p-2 rounded-full transition-colors ${
                    isVoiceActive 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder={isVoiceActive ? 'Listening...' : 'Ask about automation...'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAssistantLoading}
                />
                <button
                  type="submit"
                  disabled={isAssistantLoading || !assistantInput.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Time Saved with Automation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-700">127</p>
                <p className="text-sm text-blue-600">Hours/month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">$6,350</p>
                <p className="text-sm text-green-600">Monthly value</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Workflow</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter workflow name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe what this workflow does"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Trigger Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select trigger</option>
                      <option value="webhook">Webhook</option>
                      <option value="schedule">Schedule</option>
                      <option value="form">Form Submission</option>
                      <option value="email">Email Received</option>
                      <option value="database">Database Change</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., sales, email, customer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Start Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: 'Lead Nurturing', icon: Users },
                      { name: 'Document Processing', icon: FileText },
                      { name: 'Email Automation', icon: Mail },
                      { name: 'Data Synchronization', icon: Database }
                    ].map((template, index) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={index}
                          type="button"
                          className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Icon className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-700">{template.name}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Redirecting to n8n workflow editor...');
                      setShowCreateModal(false);
                      window.open('https://n8n.yourdomain.com/workflow/new', '_blank');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create in n8n
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};