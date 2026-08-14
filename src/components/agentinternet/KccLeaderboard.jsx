import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw, AlertCircle, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KccTokenCard from "./KccTokenCard";

/** KCC-20 board — live KRON launch registry only (no AI, no estimates). */
export default function KccLeaderboard() {
  const [tokens, setTokens] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState("");

  const load = () => {
    setTokens(null);
    setError(null);
    base44.functions.invoke("kccLeaderboard", {})
      .then(raw => {
        const res = raw?.data ?? raw;
        if (res?.success) setTokens(res.tokens || []);
        else setError(res?.error || "Could not load KRON registry");
      })
      .catch(e => setError(e?.message || "Could not load KRON registry"));
  };

  useEffect(load, []);

  const term = q.trim().toLowerCase();
  const list = (tokens || []).filter(t =>
    !term ||
    t.tick?.toLowerCase().includes(term) ||
    t.name?.toLowerCase().includes(term) ||
    t.x_handle?.toLowerCase().includes(term)
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full bg-white/[0.04] border border-white/10">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker, name or X handle"
            className="flex-1 bg-transparent text-white text-[12px] placeholder:text-white/30 outline-none"
          />
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/[0.05] border border-white/10 text-white/60 hover:text-white text-[11px] transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {tokens === null && !error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mb-3" />
          <p className="text-white/50 text-xs">Loading the live KRON launch registry…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <AlertCircle className="w-5 h-5 text-white/40 mb-2" />
          <p className="text-white/50 text-xs mb-3">{error}</p>
          <button onClick={load} className="text-cyan-300 text-xs underline">Try again</button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-14">No KCC-20 tokens match that search.</p>
      ) : (
        <>
          <p className="text-white/30 text-[10px] font-mono mb-2">{list.length} live KCC-20 launches · api.kron.technology</p>
          <div className="space-y-2">
            {list.map((t, i) => (
              <KccTokenCard
                key={t.tick + i}
                token={t}
                rank={i + 1}
                expanded={openId === t.tick + i}
                onToggle={() => setOpenId(openId === t.tick + i ? null : t.tick + i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}