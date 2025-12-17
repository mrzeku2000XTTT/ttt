import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Play, Save, Settings, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WorkflowNode from "./WorkflowNode";

export default function WorkflowCanvas({ workflow, onClose, onSave }) {
  const [nodes, setNodes] = useState(workflow?.nodes || []);
  const [connections, setConnections] = useState(workflow?.connections || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || "Untitled Workflow");
  const canvasRef = useRef(null);

  const addNode = (type, position) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: position || { x: 100, y: 100 },
      config: {},
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodePosition = (id, position) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, position } : n));
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const startConnection = (nodeId) => {
    setDraggingFrom(nodeId);
  };

  const endConnection = (nodeId) => {
    if (draggingFrom && draggingFrom !== nodeId) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        from: draggingFrom,
        to: nodeId,
      };
      setConnections([...connections, newConnection]);
    }
    setDraggingFrom(null);
  };

  const handleSave = () => {
    onSave({
      ...workflow,
      name: workflowName,
      nodes,
      connections,
      updated: new Date().toISOString(),
    });
  };

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.position || { x: 0, y: 0 };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-black/80 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-white/5 border-white/10 text-white font-semibold w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-black/60 border-r border-white/10 p-4 overflow-y-auto">
            <h3 className="text-white font-bold mb-4">Nodes</h3>
            <div className="space-y-2">
              {['Trigger', 'HTTP Request', 'Database', 'AI Agent', 'Email', 'Webhook', 'Schedule', 'Condition', 'Transform', 'Function'].map((type) => (
                <button
                  key={type}
                  onClick={() => addNode(type, { x: 200, y: 200 })}
                  className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm text-left transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 relative bg-black/40 overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((conn) => {
                const from = getNodePosition(conn.from);
                const to = getNodePosition(conn.to);
                return (
                  <line
                    key={conn.id}
                    x1={from.x + 100}
                    y1={from.y + 40}
                    x2={to.x}
                    y2={to.y + 40}
                    stroke="rgba(139, 92, 246, 0.5)"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onSelect={() => setSelectedNode(node)}
                onMove={updateNodePosition}
                onDelete={deleteNode}
                onConnect={startConnection}
                onConnectEnd={endConnection}
              />
            ))}
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-80 bg-black/60 border-l border-white/10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">{selectedNode.type}</h3>
                <Button
                  onClick={() => deleteNode(selectedNode.id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Node Name</label>
                  <Input
                    defaultValue={selectedNode.type}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Configuration</label>
                  <textarea
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}