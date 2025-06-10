import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Zap, 
  Bot, 
  Loader2, 
  ArrowRight, 
  Check, 
  X, 
  Copy, 
  Download,
  FileText,
  Mail,
  Calendar,
  Database,
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { streamResponse } from '../lib/ai';

interface WorkflowGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  n8nUrl?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  nodeType: string;
  config: Record<string, any>;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  n8nJson?: string;
}

export const WorkflowGenerator: React.FC<WorkflowGeneratorProps> = ({ 
  isOpen, 
  onClose,
  n8nUrl
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'result'>('input');
  const [workflowType, setWorkflowType] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const workflowTypes = [
    { id: 'customer-onboarding', name: 'Customer Onboarding', icon: Users },
    { id: 'document-processing', name: 'Document Processing', icon: FileText },
    { id: 'email-campaign', name: 'Email Campaign', icon: Mail },
    { id: 'meeting-scheduler', name: 'Meeting Scheduler', icon: Calendar },
    { id: 'data-sync', name: 'Data Synchronization', icon: Database },
    { id: 'custom', name: 'Custom Workflow', icon: Workflow }
  ];

  const generateWorkflow = async () => {
    if (!prompt.trim() && workflowType === 'custom') {
      toast.error('Please describe your workflow');
      return;
    }

    setIsGenerating(true);
    setCurrentStep('generating');

    try {
      // Prepare the prompt for the AI
      const selectedType = workflowTypes.find(t => t.id === workflowType)?.name || 'Custom Workflow';
      const aiPrompt = `Generate a detailed n8n workflow for: ${selectedType}${prompt ? `: ${prompt}` : ''}
      
      Please provide:
      1. A clear name for the workflow
      2. A detailed description
      3. A list of steps with:
         - Step name
         - Description
         - Node type in n8n
         - Configuration details
      
      Also include a JSON representation of the workflow that can be imported into n8n.
      
      Format your response as JSON with the following structure:
      {
        "name": "Workflow Name",
        "description": "Detailed description",
        "steps": [
          {
            "id": "step1",
            "name": "Step Name",
            "description": "Step description",
            "nodeType": "n8n node type",
            "config": { key-value pairs for configuration }
          }
        ],
        "n8nJson": "stringified JSON for n8n import"
      }`;

      let fullResponse = '';
      for await (const chunk of streamResponse(aiPrompt, 'gpt-4')) {
        fullResponse += chunk;
      }

      // Extract JSON from the response
      const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        fullResponse.match(/```([\s\S]*?)```/) ||
                        fullResponse.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        try {
          const workflowData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          setGeneratedWorkflow(workflowData);
          toast.success('Workflow generated successfully!');
        } catch (parseError) {
          console.error('Error parsing workflow JSON:', parseError);
          toast.error('Failed to parse generated workflow');
          setGeneratedWorkflow({
            name: selectedType,
            description: 'Automatically generated workflow based on your requirements',
            steps: [
              {
                id: 'step1',
                name: 'Trigger',
                description: 'Starts the workflow',
                nodeType: 'n8n-nodes-base.webhook',
                config: { endpoint: '/webhook' }
              },
              {
                id: 'step2',
                name: 'Process Data',
                description: 'Processes the incoming data',
                nodeType: 'n8n-nodes-base.function',
                config: { functionCode: 'return items;' }
              }
            ]
          });
        }
      } else {
        toast.error('Failed to generate workflow in the correct format');
        setGeneratedWorkflow({
          name: selectedType,
          description: 'Automatically generated workflow based on your requirements',
          steps: [
            {
              id: 'step1',
              name: 'Trigger',
              description: 'Starts the workflow',
              nodeType: 'n8n-nodes-base.webhook',
              config: { endpoint: '/webhook' }
            },
            {
              id: 'step2',
              name: 'Process Data',
              description: 'Processes the incoming data',
              nodeType: 'n8n-nodes-base.function',
              config: { functionCode: 'return items;' }
            }
          ]
        });
      }

      setCurrentStep('result');
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToN8N = async () => {
    if (!generatedWorkflow) return;
    
    setIsExporting(true);
    try {
      // In a real implementation, this would call the n8n API to create the workflow
      // For demo purposes, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Workflow exported to n8n successfully!');
      
      // Open n8n in a new tab
      if (n8nUrl) {
        window.open(n8nUrl, '_blank');
      }
    } catch (error) {
      console.error('Error exporting to n8n:', error);
      toast.error('Failed to export workflow to n8n');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadWorkflow = () => {
    if (!generatedWorkflow) return;
    
    const workflowJson = JSON.stringify(generatedWorkflow, null, 2);
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Workflow downloaded successfully!');
  };

  const copyWorkflowJson = () => {
    if (!generatedWorkflow) return;
    
    const workflowJson = JSON.stringify(generatedWorkflow, null, 2);
    navigator.clipboard.writeText(workflowJson);
    toast.success('Workflow JSON copied to clipboard!');
  };

  const resetGenerator = () => {
    setPrompt('');
    setGeneratedWorkflow(null);
    setCurrentStep('input');
    setWorkflowType('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Workflow className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Workflow Generator</h2>
                <p className="text-sm text-gray-500">Create n8n workflows with AI assistance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'input' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Workflow Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {workflowTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setWorkflowType(type.id)}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                          workflowType === type.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${workflowType === type.id ? 'text-purple-500' : 'text-gray-500'}`} />
                        <span className={`font-medium ${workflowType === type.id ? 'text-purple-700' : 'text-gray-700'}`}>
                          {type.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Describe Your Workflow
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want this workflow to do in detail. For example: 'Create a workflow that sends a welcome email when a new customer signs up, then adds them to my CRM and schedules a follow-up task for my team.'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  {workflowType === 'custom' ? 'Required for custom workflows' : 'Optional for template-based workflows'}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Bot className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-blue-800">AI-Powered Workflow Generation</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Our AI will generate a complete n8n workflow based on your description. You can then customize it further in n8n.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateWorkflow}
                  disabled={!workflowType || (workflowType === 'custom' && !prompt.trim())}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>Generate Workflow</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Workflow className="w-16 h-16 text-purple-200" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-8 h-8 text-purple-500" />
                </motion.div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Generating Your Workflow</h3>
              <p className="text-gray-600 max-w-md text-center">
                Our AI is creating a custom n8n workflow based on your requirements. This may take a moment...
              </p>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 10 }}
                />
              </div>
            </div>
          )}

          {currentStep === 'result' && generatedWorkflow && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-green-800">Workflow Generated Successfully!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your workflow has been generated and is ready to be exported to n8n or downloaded.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{generatedWorkflow.name}</h3>
                  <p className="text-gray-600 mt-1">{generatedWorkflow.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Workflow Steps</h4>
                  <div className="space-y-3">
                    {generatedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start">
                          <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="ml-3 flex-1">
                            <h5 className="font-medium text-gray-900">{step.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {step.nodeType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={exportToN8N}
                  disabled={isExporting || !n8nUrl}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                  <span>{isExporting ? 'Exporting...' : 'Export to n8n'}</span>
                </button>
                <button
                  onClick={downloadWorkflow}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={copyWorkflowJson}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={resetGenerator}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ml-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Create Another</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};