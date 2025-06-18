import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Brain, Workflow, Database, Send, Loader2, Bot, FileText, Users, Calendar, Mail, Settings, Briefcase, Zap, Globe, Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const workflowCategories = [
  {
    id: 'documents',
    name: 'Document Management',
    icon: FileText,
    color: 'text-blue-400',
    description: 'Automate document processing and organization',
    templates: [
      'Document Approval Flow',
      'Contract Management',
      'Invoice Processing'
    ]
  },
  {
    id: 'meetings',
    name: 'Meeting Management',
    icon: Calendar,
    color: 'text-green-400',
    description: 'Streamline meeting scheduling and follow-ups',
    templates: [
      'Meeting Scheduler',
      'Minutes Distribution',
      'Follow-up Tasks'
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: Mail,
    color: 'text-purple-400',
    description: 'Enhance team and client communication',
    templates: [
      'Client Updates',
      'Team Notifications',
      'Multi-channel Alerts'
    ]
  },
  {
    id: 'business',
    name: 'Business Processes',
    icon: Briefcase,
    color: 'text-amber-400',
    description: 'Optimize core business operations',
    templates: [
      'Lead Management',
      'Order Processing',
      'Inventory Updates'
    ]
  },
  {
    id: 'integrations',
    name: 'System Integrations',
    icon: Zap,
    color: 'text-indigo-400',
    description: 'Connect your essential business tools',
    templates: [
      'CRM Integration',
      'ERP Sync',
      'Analytics Pipeline'
    ]
  },
  {
    id: 'global',
    name: 'Global Operations',
    icon: Globe,
    color: 'text-cyan-400',
    description: 'Manage international business processes',
    templates: [
      'Multi-region Workflow',
      'Currency Management',
      'Timezone Handling'
    ]
  }
];

const pricingPlans = [
  {
    name: 'Pay-as-you-go',
    description: 'Perfect for occasional automation needs',
    price: '$0.10 per execution',
    features: [
      'No monthly commitment',
      'Access to all templates',
      'Basic support'
    ]
  },
  {
    name: 'Business',
    description: 'For growing businesses',
    price: '$99/month',
    features: [
      'Unlimited executions',
      'Priority support',
      'Custom integrations'
    ]
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom pricing',
    features: [
      'Dedicated support',
      'SLA guarantees',
      'Custom development'
    ]
  }
];

interface ContactForm {
  name: string;
  email: string;
  company: string;
  requirements: string;
  plan: string;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: {
      label: (
        <div className="flex items-center p-2">
          <Brain className="w-5 h-5 text-genesis-400 mr-2" />
          <span className="text-gray-100">AI Processor</span>
        </div>
      ),
    },
    position: { x: 250, y: 0 },
    className: 'bg-gray-800 border-2 border-gray-700 rounded-lg shadow-flow',
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const FlowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    company: '',
    requirements: '',
    plan: ''
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically send this to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your interest! Our team will contact you shortly.');
      setShowContactForm(false);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Thank you for your interest in our automation services! We'll contact you at ${contactForm.email} shortly with a customized proposal.`
      }]);
    } catch (error) {
      toast.error('There was an error submitting your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWorkflow = async (category: string, prompt: string) => {
    setIsLoading(true);
    try {
      const CategoryIcon = workflowCategories.find(cat => cat.id === category)?.icon || Workflow;
      
      const newNode: Node = {
        id: Date.now().toString(),
        type: 'default',
        data: {
          label: (
            <div className="flex items-center p-2">
              <CategoryIcon className={`w-5 h-5 ${workflowCategories.find(cat => cat.id === category)?.color || 'text-genesis-400'} mr-2`} />
              <span className="text-gray-100">{prompt}</span>
            </div>
          ),
        },
        position: { 
          x: Math.random() * 300 + 100, 
          y: Math.random() * 200 + 100 
        },
        className: 'bg-gray-800 border-2 border-gray-700 rounded-lg shadow-flow',
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
      
      const newEdge: Edge = {
        id: `e1-${newNode.id}`,
        source: '1',
        target: newNode.id,
        animated: true,
        className: workflowCategories.find(cat => cat.id === category)?.color || 'text-genesis-400',
      };
      
      setEdges((currentEdges) => [...currentEdges, newEdge]);

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Created a new ${workflowCategories.find(cat => cat.id === category)?.name.toLowerCase() || 'workflow'} node for: ${prompt}` 
        },
      ]);

      // Show contact form after successful workflow creation
      setShowContactForm(true);
    } catch (error) {
      console.error('Error generating workflow:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error generating workflow. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading || !selectedCategory) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    await generateWorkflow(selectedCategory, userMessage);
  };

  return (
    <div className="h-[600px] bg-gray-900 rounded-lg border border-gray-700 flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-gradient-to-br from-gray-900 to-gray-800"
        >
          <Background color="#374151" />
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'input':
                  return '#60A5FA';
                case 'output':
                  return '#F59E0B';
                default:
                  return '#4B5563';
              }
            }}
            className="bg-gray-800 border-gray-700"
          />
        </ReactFlow>
      </div>

      <div className="w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-genesis-400" />
              <h3 className="font-semibold text-gray-100">Workflow Assistant</h3>
            </div>
            <button
              onClick={() => setShowContactForm(true)}
              className="px-3 py-1 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors text-sm"
            >
              Contact Us
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Select a category and describe your workflow needs.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!showContactForm ? (
            <>
              <div className="p-4 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  {workflowCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-gray-700 border-2 border-gray-600'
                            : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${category.color} mb-2`} />
                        <div className="text-sm font-medium text-gray-100">
                          {category.name}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {category.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-genesis-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating workflow...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">Request Custom Solution</h4>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Requirements</label>
                  <textarea
                    value={contactForm.requirements}
                    onChange={(e) => setContactForm({ ...contactForm, requirements: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Plan</label>
                  <select
                    value={contactForm.plan}
                    onChange={(e) => setContactForm({ ...contactForm, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                    required
                  >
                    <option value="">Select a plan</option>
                    {pricingPlans.map(plan => (
                      <option key={plan.name} value={plan.name}>{plan.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {!showContactForm && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={selectedCategory ? "Describe your workflow needs..." : "Select a category first"}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-genesis-500"
                disabled={isLoading || !selectedCategory}
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim() || !selectedCategory}
                className="px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};