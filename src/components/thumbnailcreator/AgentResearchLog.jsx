import React from "react";
import { Bot, CheckCircle2, Loader2, Search, ShieldCheck } from "lucide-react";

const iconMap = {
  research: Search,
  factcheck: ShieldCheck,
  plan: Bot,
  done: CheckCircle2,
};

export default function AgentResearchLog({ logs = [], researchNotes, agentPlan }) {
  if (!logs.length && !researchNotes && !agentPlan) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-4 w-4 text-white" />
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">Agent workspace</h3>
      </div>
      <div className="space-y-2">
        {logs.map((log, index) => {
          const Icon = iconMap[log.type] || Bot;
          const active = log.status === "running";
          return (
            <div key={`${log.label}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                {log.label}
              </div>
              {log.detail && <p className="mt-1 text-xs leading-5 text-zinc-400">{log.detail}</p>}
            </div>
          );
        })}
      </div>
      {researchNotes && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-3 text-xs leading-5 text-zinc-300">{researchNotes}</p>}
      {agentPlan && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-3 text-xs leading-5 text-zinc-300">{agentPlan}</p>}
    </div>
  );
}