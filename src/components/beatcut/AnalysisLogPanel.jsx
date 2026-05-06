import React from "react";
import { CheckCircle2, Loader2, Terminal } from "lucide-react";

export default function AnalysisLogPanel({ logs = [], active }) {
  return (
    <div className="rounded-2xl bg-black/35 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-white/55">
        {active ? <Loader2 className="w-3.5 h-3.5 text-fuchsia-300 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-cyan-300" />}
        Real-time analysis logs
      </div>
      <div className="max-h-48 overflow-y-auto p-3 space-y-1.5 font-mono text-[10px]">
        {logs.length === 0 ? (
          <div className="text-white/30">Waiting for video upload…</div>
        ) : logs.map((log, index) => (
          <div key={index} className="flex items-start gap-2 text-white/60">
            {log.done ? <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-300 flex-shrink-0" /> : <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-fuchsia-300 flex-shrink-0" />}
            <span>{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}