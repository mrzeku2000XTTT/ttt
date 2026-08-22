import React from "react";
import { Loader2, Check, AlertCircle, ChevronDown } from "lucide-react";

export default function SkyAgentCard({ agent, expanded, onToggle }) {
  const status = agent.status;
  const count = agent.findings?.length || 0;
  return (
    <div className={`rounded-2xl border bg-white/[0.04] overflow-hidden transition-colors ${status === "done" ? "border-cyan-400/30" : status === "error" ? "border-rose-400/30" : "border-white/10"}`}>
      <button onClick={onToggle} disabled={status !== "done" || count === 0} className="w-full flex items-center gap-3 p-3 text-left disabled:cursor-default">
        <span className="text-2xl flex-shrink-0">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{agent.name}</span>
            {status === "gathering" && <Loader2 className="w-3 h-3 animate-spin text-cyan-400 flex-shrink-0" />}
            {status === "done" && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
            {status === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-white/40 truncate">
            {status === "waiting" && "Waiting in queue…"}
            {status === "gathering" && agent.gatherNote}
            {status === "done" && `${count} real source${count !== 1 ? "s" : ""} — tap to expand`}
            {status === "error" && "Research failed — send a new message to retry"}
          </p>
        </div>
        {status === "done" && count > 0 && <ChevronDown className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`} />}
      </button>
      {expanded && status === "done" && count > 0 && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-2.5">
          {agent.findings.map((f, i) => (
            <div key={i} className="text-[11px]">
              <p className="font-semibold text-white/90">{f.insight}</p>
              {f.evidence && <p className="text-white/55 mt-0.5">{f.evidence}</p>}
              {f.source_url && f.source_url !== "unverified" && (
                <a href={f.source_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline block mt-1 truncate">
                  ↗ {f.source_title || f.source_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}