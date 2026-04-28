import React from "react";
import { motion } from "framer-motion";
import {
  X, Brain, Image as ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch
} from "lucide-react";

export const NODE_TEMPLATES = [
  {
    type: "ai_prompt",
    label: "AI Prompt",
    icon: "Brain",
    color: "from-purple-500 to-pink-500",
    desc: "Run a prompt through the LLM",
    defaultConfig: { prompt: "Write a haiku about Kaspa" },
  },
  {
    type: "ai_image",
    label: "AI Image",
    icon: "ImageIcon",
    color: "from-cyan-500 to-blue-500",
    desc: "Generate an image with AI",
    defaultConfig: { prompt: "A glowing crystal in space, cinematic" },
  },
  {
    type: "send_email",
    label: "Send Email",
    icon: "Mail",
    color: "from-amber-500 to-orange-500",
    desc: "Email the result somewhere",
    defaultConfig: { to: "", subject: "RMX Workflow", body: "{{result}}" },
  },
  {
    type: "delay",
    label: "Delay",
    icon: "Clock",
    color: "from-zinc-500 to-zinc-600",
    desc: "Wait N seconds",
    defaultConfig: { seconds: 2 },
  },
  {
    type: "filter",
    label: "Filter",
    icon: "Filter",
    color: "from-emerald-500 to-green-500",
    desc: "Continue only if previous output contains text",
    defaultConfig: { contains: "" },
  },
  {
    type: "webhook",
    label: "Webhook",
    icon: "Webhook",
    color: "from-rose-500 to-red-500",
    desc: "POST result to a URL",
    defaultConfig: { url: "https://", method: "POST" },
  },
  {
    type: "save_data",
    label: "Save Output",
    icon: "Database",
    color: "from-indigo-500 to-violet-500",
    desc: "Store result for the next step",
    defaultConfig: {},
  },
  {
    type: "branch",
    label: "Branch",
    icon: "GitBranch",
    color: "from-yellow-500 to-amber-500",
    desc: "Mark a branching point",
    defaultConfig: {},
  },
];

const ICONS = { Brain, ImageIcon, Mail, Clock, Filter, Webhook, Database, GitBranch };

export default function RMXNodeLibrary({ onPick, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-black text-lg">Add a Node</h2>
            <p className="text-white/40 text-xs">Pick a step to run in your workflow</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {NODE_TEMPLATES.map((tpl) => {
            const Icon = ICONS[tpl.icon];
            return (
              <button
                key={tpl.type}
                onClick={() => onPick(tpl)}
                className="text-left p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 rounded-xl transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${tpl.color} rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity`} />
                    <div className={`relative w-full h-full bg-gradient-to-br ${tpl.color} rounded-2xl flex items-center justify-center shadow-xl border border-white/20 overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                      <Icon className="relative w-5 h-5 text-white drop-shadow" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm mb-0.5">{tpl.label}</h3>
                    <p className="text-white/50 text-xs leading-snug">{tpl.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}