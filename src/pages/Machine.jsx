import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu, Database, Brain, Eye, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MachinePage() {
  const nodes = [
    { id: 1, icon: Database, label: "Data Input", x: 50, y: 50, color: "blue" },
    { id: 2, icon: Zap, label: "Preprocessing", x: 250, y: 50, color: "cyan" },
    { id: 3, icon: Brain, label: "Neural Network", x: 450, y: 50, color: "purple" },
    { id: 4, icon: Eye, label: "Validation", x: 250, y: 200, color: "pink" },
    { id: 5, icon: BarChart3, label: "Output", x: 650, y: 50, color: "green" },
  ];

  const connections = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 2 },
    { from: 3, to: 5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" className="mb-8 text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gate
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Cpu className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
            MACHINE
          </h1>
          <p className="text-white/50 text-lg">AI-Powered System Control</p>
        </motion.div>

        {/* ML Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 relative"
        >
          <h2 className="text-2xl font-bold text-white mb-12 text-center">Machine Learning Pipeline</h2>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {connections.map((conn, i) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              return (
                <motion.line
                  key={i}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                  x1={fromNode.x + 60}
                  y1={fromNode.y + 60}
                  x2={toNode.x + 60}
                  y2={toNode.y + 60}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>

          <div className="relative" style={{ height: '300px' }}>
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="absolute backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 text-center"
                style={{ 
                  left: `${node.x}px`, 
                  top: `${node.y}px`,
                  width: '120px'
                }}
              >
                <div className={`w-12 h-12 mx-auto bg-${node.color}-500/20 rounded-lg flex items-center justify-center mb-3`}>
                  <node.icon className={`w-6 h-6 text-${node.color}-400`} />
                </div>
                <p className="text-white text-sm font-semibold">{node.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}