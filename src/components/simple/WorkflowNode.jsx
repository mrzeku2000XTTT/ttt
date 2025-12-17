import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Settings, Trash2, Circle } from "lucide-react";

export default function WorkflowNode({ node, isSelected, onSelect, onMove, onDelete, onConnect, onConnectEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.connector') || e.target.closest('.action-button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
    onSelect();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      onMove(node.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getNodeColor = (type) => {
    const colors = {
      'Trigger': 'from-yellow-500 to-orange-500',
      'HTTP Request': 'from-blue-500 to-cyan-500',
      'Database': 'from-purple-500 to-pink-500',
      'AI Agent': 'from-green-500 to-emerald-500',
      'Email': 'from-red-500 to-pink-500',
      'Webhook': 'from-indigo-500 to-blue-500',
      'Schedule': 'from-orange-500 to-red-500',
      'Condition': 'from-yellow-500 to-green-500',
      'Transform': 'from-cyan-500 to-blue-500',
      'Function': 'from-purple-500 to-indigo-500',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  return (
    <motion.div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`w-48 bg-black/80 backdrop-blur-xl border-2 rounded-xl shadow-2xl ${
        isSelected ? 'border-purple-500' : 'border-white/20'
      }`}
      whileHover={{ scale: 1.02 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`h-2 rounded-t-xl bg-gradient-to-r ${getNodeColor(node.type)}`} />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-bold text-sm">{node.type}</h4>
          <button
            className="action-button text-white/40 hover:text-white/80 transition-colors"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        
        <p className="text-white/40 text-xs mb-3">
          Click to configure
        </p>

        <div className="flex items-center justify-between">
          <button
            className="connector w-6 h-6 bg-white/10 border border-white/30 rounded-full flex items-center justify-center hover:bg-purple-500/20 transition-colors"
            onMouseDown={(e) => {
              e.stopPropagation();
              onConnect(node.id);
            }}
          >
            <Circle className="w-3 h-3 text-white/60" />
          </button>
          
          <button
            className="connector w-6 h-6 bg-white/10 border border-white/30 rounded-full flex items-center justify-center hover:bg-purple-500/20 transition-colors"
            onMouseUp={(e) => {
              e.stopPropagation();
              onConnectEnd(node.id);
            }}
          >
            <Circle className="w-3 h-3 text-white/60" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}