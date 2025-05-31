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
import { Brain, Workflow, Database, Send, Loader2, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: {
      label: (
        <div className="flex items-center p-2">
          <Brain className="w-5 h-5 text-genesis-600 mr-2" />
          <span>AI Processor</span>
        </div>
      ),
    },
    position: { x: 250, y: 0 },
    className: 'bg-white border-2 border-genesis-200 rounded-lg shadow-flow',
  },
  {
    id: '2',
    data: {
      label: (
        <div className="flex items-center p-2">
          <Workflow className="w-5 h-5 text-genesis-600 mr-2" />
          <span>Workflow</span>
        </div>
      ),
    },
    position: { x: 250, y: 100 },
    className: 'bg-white border-2 border-genesis-200 rounded-lg shadow-flow',
  },
  {
    id: '3',
    data: {
      label: (
        <div className="flex items-center p-2">
          <Database className="w-5 h-5 text-genesis-600 mr-2" />
          <span>Data Storage</span>
        </div>
      ),
    },
    position: { x: 250, y: 200 },
    className: 'bg-white border-2 border-genesis-200 rounded-lg shadow-flow',
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, className: 'text-genesis-600' },
  { id: 'e2-3', source: '2', target: '3', animated: true, className: 'text-genesis-600' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const FlowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const generateWorkflow = async (prompt: string) => {
    setIsLoading(true);
    try {
      // Here we would normally call an AI service to generate the workflow
      // For now, we'll simulate a response
      const newNodes: Node[] = [
        {
          id: Date.now().toString(),
          type: 'input',
          data: {
            label: (
              <div className="flex items-center p-2">
                <Brain className="w-5 h-5 text-genesis-600 mr-2" />
                <span>{prompt}</span>
              </div>
            ),
          },
          position: { x: Math.random() * 300, y: Math.random() * 300 },
          className: 'bg-white border-2 border-genesis-200 rounded-lg shadow-flow',
        },
      ];

      setNodes((currentNodes) => [...currentNodes, ...newNodes]);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Created a new node for: ${prompt}` },
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
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    await generateWorkflow(userMessage);
  };

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200 flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-gradient-to-br from-genesis-50/50 to-spiritual-50/50"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'input':
                  return '#0c8ee8';
                case 'output':
                  return '#dd7a25';
                default:
                  return '#666';
              }
            }}
          />
        </ReactFlow>
      </div>

      <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-genesis-600" />
            <h3 className="font-semibold text-gray-900">Flow Assistant</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Describe your workflow needs and I'll help you build it.
          </p>
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
                    ? 'bg-genesis-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating workflow...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe your workflow needs..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
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