import React, { useState } from "react";
import { Loader2, Play, Square, ExternalLink, Server, Terminal } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function E2BLivePanel({ files }) {
  const [state, setState] = useState({ status: "idle", url: null, sandboxId: null, logs: [], error: null });

  const boot = async () => {
    setState({ status: "booting", url: null, sandboxId: null, logs: [], error: null });
    try {
      const res = await base44.functions.invoke("e2bSandbox", { action: "run", files });
      const d = res.data || {};
      setState({
        status: d.url ? "live" : "error",
        url: d.url || null,
        sandboxId: d.sandboxId || null,
        logs: d.logs || [],
        error: d.error || null,
      });
    } catch (err) {
      setState({ status: "error", url: null, sandboxId: null, logs: [], error: err.message });
    }
  };

  const stop = async () => {
    if (state.sandboxId) {
      try { await base44.functions.invoke("e2bSandbox", { action: "kill", sandboxId: state.sandboxId }); } catch { /* ignore */ }
    }
    setState({ status: "idle", url: null, sandboxId: null, logs: [], error: null });
  };

  return (
    <div className="absolute inset-0 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <Server className="w-3.5 h-3.5 text-[#70C7BA] flex-shrink-0" />
        <span className="text-xs text-white/50 flex-shrink-0">E2B cloud sandbox · real npm & Node</span>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {state.url && (
            <a href={state.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold whitespace-nowrap">
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          )}
          {state.status === "live" ? (
            <button onClick={stop}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold whitespace-nowrap">
              <Square className="w-3 h-3" /> Stop
            </button>
          ) : (
            <button onClick={boot} disabled={state.status === "booting" || !files.length}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#70C7BA] text-black text-xs font-bold disabled:opacity-40 whitespace-nowrap">
              {state.status === "booting" ? <><Loader2 className="w-3 h-3 animate-spin" /> Booting…</> : <><Play className="w-3 h-3" /> Run Live</>}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-black">
        {state.status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#70C7BA]/10 border border-[#70C7BA]/20 flex items-center justify-center">
                <Server className="w-7 h-7 text-[#70C7BA]/60" />
              </div>
              <p className="text-white/40 text-sm font-medium">Run this project on a real machine</p>
              <p className="text-white/25 text-xs mt-1 max-w-xs">Installs npm packages and starts your dev server or backend in a Linux microVM.</p>
            </div>
          </div>
        )}
        {state.status === "booting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-[#70C7BA] animate-spin mx-auto mb-3" />
              <p className="text-white/50 text-sm">Booting sandbox & installing packages…</p>
              <p className="text-white/25 text-xs mt-1">This can take up to a minute</p>
            </div>
          </div>
        )}
        {state.status === "live" && state.url && (
          <iframe src={state.url} className="w-full h-full border-0" title="Live Sandbox" />
        )}
        {state.status === "error" && (
          <div className="absolute inset-0 overflow-auto p-4">
            <p className="text-red-400 text-sm font-bold mb-2">Sandbox failed</p>
            <p className="text-white/40 text-xs mb-4">{state.error}</p>
          </div>
        )}
      </div>

      {state.logs.length > 0 && (
        <div className="flex-shrink-0 max-h-32 overflow-auto border-t border-white/5 bg-[#08090b] p-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/30 font-bold">
            <Terminal className="w-3 h-3" /> LOGS
          </div>
          <pre className="text-[10px] font-mono text-green-300/70 whitespace-pre-wrap leading-relaxed">
            {state.logs.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}