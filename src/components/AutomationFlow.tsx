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
import { Brain, Workflow, Database, Send, Loader2, Bot, FileText, Users, Calendar, Mail, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: {
      label: (
        <div className="flex items-center p-2">
          <Brain className="w-5 h-5 text-blue-400 mr-2" />
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

export const AutomationFlow: React.FC = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading || !selectedCategory) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    setIsLoading(true);
    try {
      // Create a new node based on user input
      const newNode: Node = {
        id: Date.now().toString(),
        type: 'default',
        data: {
          label: (
            <div className="flex items-center p-2">
              <Workflow className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-100">{userMessage}</span>
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
        className: 'text-blue-400',
      };
      
      setEdges((currentEdges) => [...currentEdges, newEdge]);

      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `Created a new automation node for: ${userMessage}` 
        },
      ]);

      // Create Zapier webhook
      const zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/123/abc/';
      await fetch(zapierWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: userMessage,
          timestamp: new Date().toISOString()
        })
      });

      toast.success('Automation flow updated and Zapier webhook triggered');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create automation');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-gray-100">Automation Assistant</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Select a category and describe your automation needs.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'docs', name: 'Documents', icon: FileText, color: 'text-blue-400' },
                { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'text-green-400' },
                { id: 'email', name: 'Email', icon: Mail, color: 'text-purple-400' },
                { id: 'users', name: 'Users', icon: Users, color: 'text-amber-400' }
              ].map(category => {
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
                      ? 'bg-blue-600 text-white'
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
                <span>Creating automation...</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedCategory ? "Describe your automation needs..." : "Select a category first"}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !selectedCategory}
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim() || !selectedCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};