import React, { useState, useEffect, useCallback } from "react";
import { Plus, Bot, Trash2, Zap, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getAgentWallet } from "@/lib/agentInternetWallet";

export default function AgentDashboard({ onOpen, onNew }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setAuthed(true);
      const list = await base44.entities.AgentInternetAgent.list("-updated_date", 50);
      setAgents(list || []);
    } catch {
      setAuthed(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const wallet = getAgentWallet();

  return (
    <div className="max-w-5xl mx-auto px-5 pb-24">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-[800] text-zinc-900">Your agents</h2>
          <p className="text-sm text-zinc-500">Each agent is your own trained model — only visible to you.</p>
        </div>
        <button
          onClick={onNew}
          disabled={!authed || !wallet}
          className="h-10 px-4 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New agent
        </button>
      </div>

      {!authed ? (
        <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-8 text-center">
          <Bot className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700 mb-1">Sign in to train your agents</p>
          <p className="text-xs text-zinc-400 mb-4">Your trained models are saved to your account.</p>
          <a href="/login" className="inline-flex h-10 px-5 rounded-full bg-zinc-900 text-white text-sm font-bold items-center gap-1.5">
            Log in <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your agents…
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-8 text-center">
          <Zap className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700 mb-1">No agents yet</p>
          <p className="text-xs text-zinc-400 mb-4">
            {wallet ? "Create your first agent and start training it." : "Generate an AgentInternet wallet first, then create an agent."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => onOpen(a)}
              className="text-left bg-white rounded-2xl ring-1 ring-zinc-200 p-5 hover:ring-zinc-300 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                {a.is_trained && (
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-wider">Trained</span>
                )}
              </div>
              <h3 className="font-bold text-zinc-900 text-sm mb-0.5">{a.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{a.task || a.system_prompt}</p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Lvl {a.level}</span>
                <span>·</span>
                <span>{a.epochs} epochs</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}