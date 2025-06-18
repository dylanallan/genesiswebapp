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
  Clock,
  X,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
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
  const [isN8NConnected, setIsN8NConnected] = useState(true);
  const [n8nUrl, setN8nUrl] = useState('https://n8n.yourdomain.com');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      setWorkflows(data || []);
      // Optionally update metrics here
    } catch (error) {
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = async (workflowData: Partial<Workflow>) => {
    if (!isN8NConnected) {
      toast.error('Please connect to n8n first');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .insert([{ ...workflowData }]);
      if (error) throw error;
      toast.success('Workflow created');
      setShowAddForm(false);
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to create workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('automation_workflows')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Workflow updated');
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to update workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('automation_workflows').delete().eq('id', id);
      if (error) throw error;
      setWorkflows(workflows.filter(w => w.id !== id));
      toast.success('Workflow deleted');
    } catch (error) {
      toast.error('Failed to delete workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowCreateForm = () => {
    if (!isN8NConnected) {
      toast.error('Please connect to n8n first');
      return;
    }
    
    setShowAddForm(true);
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
            onClick={handleShowCreateForm}
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
                onClick={handleShowCreateForm}
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
                          handleEditWorkflow(workflow.id, { status: workflow.status === 'active' ? 'inactive' : 'active' });
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
                              handleDeleteWorkflow(workflow.id);
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
                  onClick={() => toast.info('Manage connection dialog would open here')}
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
                  onClick={() => {
                    setIsN8NConnected(true);
                    toast.success('Connected to n8n successfully');
                  }}
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
                    return;
                  }
                  toast.info('Workflow generator would open here');
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

      {/* Add Workflow Form Modal */}
      {showAddForm && (
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
                  onClick={() => setShowAddForm(false)}
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
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Redirecting to n8n workflow editor...');
                      setShowAddForm(false);
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

      {/* Automation Assistant Modal */}
      {showAssistant && (
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
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AI Ready</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAssistant(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-gray-100 text-gray-900">
                  <p className="whitespace-pre-wrap">👋 I'm your Automation Assistant. I can help you create, manage, and optimize your business automation workflows. How can I assist you today?</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg p-3 bg-blue-600 text-white">
                  <p className="whitespace-pre-wrap">I need to create a workflow that automatically sends welcome emails to new customers</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3 bg-gray-100 text-gray-900">
                  <p className="whitespace-pre-wrap">I'd be happy to help you create a welcome email workflow! Here's how we can set this up:

1. **Trigger**: We'll use a "New Customer" trigger that activates when a new customer is added to your CRM or signs up on your website.

2. **Email Template**: Create a personalized welcome email template that includes:
   - A warm greeting using their name
   - Introduction to your business
   - Next steps or getting started information
   - Contact information for support

3. **Automation Flow**:
   - Trigger on new customer → Delay (optional, 1-2 hours) → Send welcome email → Update CRM status → Add to nurture sequence

Would you like me to help you set up this workflow in n8n now?</p>
                </div>
              </div>
            </div>
            
            <form className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask about automation..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};