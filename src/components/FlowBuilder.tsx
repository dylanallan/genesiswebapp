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
import { Brain, Workflow, Database, Send, Loader2, Bot, FileText, Users, Calendar, Mail, Settings, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const workflowCategories = [
  {
    id: 'documents',
    name: 'Document Management',
    icon: FileText,
    color: 'text-blue-400',
    description: 'Automate document processing and organization',
  },
  {
    id: 'meetings',
    name: 'Meeting Management',
    icon: Calendar,
    color: 'text-green-400',
    description: 'Streamline meeting scheduling and follow-ups',
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: Mail,
    color: 'text-purple-400',
    description: 'Enhance team and client communication',
  },
  {
    id: 'business',
    name: 'Business Processes',
    icon: Briefcase,
    color: 'text-amber-400',
    description: 'Optimize core business operations',
  },
];

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

      <div className="w-80 border-l border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-genesis-400" />
            <h3 className="font-semibold text-gray-100">Workflow Assistant</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Select a category and describe your workflow needs.
          </p>
        </div>

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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedCategory ? "Describe your workflow needs..." : "Select a category first"}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
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
      </div>
    </div>
  );
};