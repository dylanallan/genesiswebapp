import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Brain, Workflow, Database } from 'lucide-react';

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

export const FlowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
  );
};