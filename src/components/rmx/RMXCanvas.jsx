import React from "react";
import { motion } from "framer-motion";
import {
  Plus, Brain, Image as ImageIcon, Mail, Clock, Filter, Webhook,
  Database, GitBranch, ChevronDown, Trash2, CheckCircle2
} from "lucide-react";

const ICONS = { Brain, ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch };

export default function RMXCanvas({ nodes, selectedNodeId, onSelect, onDelete, onAdd }) {
  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center mb-5 shadow-2xl shadow-purple-500/10">
          <Plus className="w-9 h-9 text-purple-300" />
        </div>
        <h2 className="text-white font-black text-2xl mb-2">Build your Ultra Workflow</h2>
        <p className="text-white/50 text-sm max-w-md mb-6">
          Chain together AI prompts, images, emails, webhooks, and more into a single one-click automation.
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl text-white font-bold shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4" /> Add your first node
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
        {nodes.map((node, i) => {
          const Icon = ICONS[node.icon] || Brain;
          const isSelected = selectedNodeId === node.id;
          const hasOutput = node.output !== null && node.output !== undefined;

          return (
            <React.Fragment key={node.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelect(node.id)}
                className={`w-full max-w-md cursor-pointer rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/30"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="text-white/30 font-mono text-xs w-6 text-center flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-br ${node.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-sm truncate">{node.label}</h3>
                      {hasOutput && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">
                      {summary(node)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node.id);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>

              {i < nodes.length - 1 && (
                <ChevronDown className="w-4 h-4 text-white/20" />
              )}
            </React.Fragment>
          );
        })}

        <button
          onClick={onAdd}
          className="mt-4 flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 hover:border-purple-400/50 rounded-xl text-white/60 hover:text-purple-300 text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Add Step
        </button>
      </div>
    </div>
  );
}

function summary(node) {
  const c = node.config || {};
  if (c.prompt) return c.prompt;
  if (c.to) return `to: ${c.to}`;
  if (c.url) return c.url;
  if (c.seconds) return `${c.seconds}s`;
  if (c.contains) return `contains: ${c.contains}`;
  return "Tap to configure";
}