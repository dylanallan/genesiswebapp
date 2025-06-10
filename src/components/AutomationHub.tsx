import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  FileText,
  Calendar,
  Mail,
  Database,
  Users,
  Filter,
  BarChart3,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { AutomationAssistant } from './AutomationAssistant';
import { WorkflowGenerator } from './WorkflowGenerator';
import { N8NIntegration } from './N8NIntegration';

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
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
}

export const AutomationHub: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showWorkflowGenerator, setShowWorkflowGenerator] = useState(false);
  const [showN8NIntegration, setShowN8NIntegration] = useState(false);
  const [isN8NConnected, setIsN8NConnected] = useState(false);
  const [n8nUrl, setN8nUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    timeSaved: 0
  });

  useEffect(() => {
    checkN8NConnection();
    fetchWorkflows();
    fetchMetrics();
  }, []);

  const checkN8NConnection = () => {
    const isConnected = localStorage.getItem('n8n_connected') === 'true';
    const url = localStorage.getItem('n8n_url') || '';
    setIsN8NConnected(isConnected);
    setN8nUrl(url);
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
          updatedAt: '2025-06-09T14:20:00Z',
          executionCount: 342,
          successRate: 98.5,
          averageExecutionTime: 1.2
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
          updatedAt: '2025-06-08T09:45:00Z',
          executionCount: 156,
          successRate: 99.2,
          averageExecutionTime: 2.5
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
          updatedAt: '2025-06-05T16:10:00Z',
          executionCount: 87,
          successRate: 92.1,
          averageExecutionTime: 1.8
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
          updatedAt: '2025-06-07T11:30:00Z',
          executionCount: 215,
          successRate: 97.3,
          averageExecutionTime: 0.9
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
          updatedAt: '2025-06-08T16:20:00Z',
          executionCount: 0,
          successRate: 0,
          averageExecutionTime: 0
        },
        {
          id: '6',
          name: 'Cultural Event Notifications',
          description: 'Sends notifications about upcoming cultural events and heritage celebrations',
          status: 'active',
          lastRun: '2025-06-10T08:00:00Z',
          nextRun: '2025-06-11T08:00:00Z',
          tags: ['culture', 'events', 'notifications'],
          n8nUrl: 'https://n8n.yourdomain.com/workflow/6',
          createdAt: '2025-06-02T10:15:00Z',
          updatedAt: '2025-06-09T11:20:00Z',
          executionCount: 78,
          successRate: 100,
          averageExecutionTime: 0.7
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

  const fetchMetrics = async () => {
    try {
      // In a real implementation, this would fetch metrics from your database or n8n API
      // For demo purposes, we'll use mock data
      const mockMetrics = {
        totalWorkflows: 6,
        activeWorkflows: 4,
        totalExecutions: 878,
        successRate: 97.5,
        averageExecutionTime: 1.42,
        timeSaved: 127 // hours
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchWorkflows(),
        fetchMetrics(),
        checkN8NConnection()
      ]);
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateWorkflow = (workflowType: string) => {
    if (!isN8NConnected) {
      toast.error('Please connect to n8n first');
      setShowN8NIntegration(true);
      return;
    }
    
    setShowWorkflowGenerator(true);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    // Filter by search term
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by category (tag)
    const matchesCategory = !selectedCategory || workflow.tags.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

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
    } else if (tags.includes('culture') || tags.includes('events')) {
      return <Calendar className="w-5 h-5 text-indigo-500" />;
    } else {
      return <Workflow className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get unique tags for filtering
  const allTags = Array.from(new Set(workflows.flatMap(w => w.tags)));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Automation Hub</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAssistant(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Bot className="w-5 h-5" />
            <span>Automation Assistant</span>
          </button>
          <button
            onClick={() => {
              if (!isN8NConnected) {
                toast.error('Please connect to n8n first');
                setShowN8NIntegration(true);
                return;
              }
              setShowWorkflowGenerator(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Workflows</h3>
            <Workflow className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.activeWorkflows}</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-600">of {metrics.totalWorkflows} total</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Time Saved</h3>
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.timeSaved} hrs</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-green-600">~${(metrics.timeSaved * 50).toLocaleString()} value</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.successRate}%</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-purple-600">{metrics.totalExecutions} executions</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Avg. Execution Time</h3>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.averageExecutionTime}s</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-amber-600">Optimized performance</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search workflows by name, description, or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedCategory(selectedCategory === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === tag
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={refreshData}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
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
                  : selectedCategory
                    ? `No workflows with tag "${selectedCategory}"`
                    : 'Start by creating your first automation workflow'}
              </p>
              <button
                onClick={() => {
                  if (!isN8NConnected) {
                    toast.error('Please connect to n8n first');
                    setShowN8NIntegration(true);
                    return;
                  }
                  setShowWorkflowGenerator(true);
                }}
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
                        <div>
                          <p className="text-xs text-gray-500">Success Rate</p>
                          <p className="text-sm text-gray-700">{workflow.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Executions</p>
                          <p className="text-sm text-gray-700">{workflow.executionCount}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            window.open(workflow.n8nUrl, '_blank');
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit in n8n</span>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">n8n Connection</h3>
              {isN8NConnected ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Not Connected
                </span>
              )}
            </div>
            
            {isN8NConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Your Genesis Heritage account is connected to n8n for workflow automation.
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">URL:</span>
                  <a 
                    href={n8nUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span className="truncate max-w-[150px]">{n8nUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  onClick={() => setShowN8NIntegration(true)}
                  className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Manage Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect to n8n to enable powerful workflow automation capabilities.
                </p>
                <button
                  onClick={() => setShowN8NIntegration(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Connect to n8n
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowAssistant(true)}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Automation Assistant</span>
              </button>
              <button
                onClick={() => {
                  if (!isN8NConnected) {
                    toast.error('Please connect to n8n first');
                    setShowN8NIntegration(true);
                    return;
                  }
                  setShowWorkflowGenerator(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Workflow with AI</span>
              </button>
              <button
                onClick={() => {
                  if (!isN8NConnected) {
                    toast.error('Please connect to n8n first');
                    setShowN8NIntegration(true);
                    return;
                  }
                  window.open(n8nUrl, '_blank');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open n8n Dashboard</span>
              </button>
            </div>
          </div>
          
          {/* Time Saved Stats */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Time Saved with Automation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-700">{metrics.timeSaved}</p>
                <p className="text-sm text-blue-600">Hours/month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">${(metrics.timeSaved * 50).toLocaleString()}</p>
                <p className="text-sm text-green-600">Monthly value</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Assistant Modal */}
      <AutomationAssistant 
        isOpen={showAssistant} 
        onClose={() => setShowAssistant(false)}
        onCreateWorkflow={handleCreateWorkflow}
      />

      {/* Workflow Generator Modal */}
      <WorkflowGenerator 
        isOpen={showWorkflowGenerator} 
        onClose={() => setShowWorkflowGenerator(false)}
        n8nUrl={n8nUrl}
      />

      {/* N8N Integration Modal */}
      <N8NIntegration 
        isOpen={showN8NIntegration} 
        onClose={() => {
          setShowN8NIntegration(false);
          checkN8NConnection();
        }}
      />
    </div>
  );
};