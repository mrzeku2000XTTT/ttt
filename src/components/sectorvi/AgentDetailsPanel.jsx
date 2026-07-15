import React from "react";
import { Bot, Wallet, Activity, User } from "lucide-react";

export default function AgentDetailsPanel({ agent, isUser }) {
  if (!agent) return null;
  return (
    <div className="absolute bottom-4 left-4 z-10 w-72 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 p-4 text-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: agent.color }}>
          {isUser ? <User className="w-5 h-5 text-black" /> : <Bot className="w-5 h-5 text-black" />}
        </div>
        <div>
          <div className="font-bold text-sm">{agent.name} {isUser && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded ml-1">YOU</span>}</div>
          <div className="text-xs text-white/50">{agent.role}</div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-white/40 flex items-center gap-1.5"><Wallet className="w-3 h-3" /> KAS Balance</span>
          <span className="text-emerald-300 font-mono font-bold">{agent.kas.toLocaleString()} KAS</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/40 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Status</span>
          <span className="text-white/80">{agent.status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/40">Agent ID</span>
          <span className="text-white/60 font-mono">{agent.id}</span>
        </div>
      </div>
    </div>
  );
}