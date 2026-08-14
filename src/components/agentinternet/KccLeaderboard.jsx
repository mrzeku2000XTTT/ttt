import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KccTokenCard from "./KccTokenCard";

/** KCC-20 leaderboard — KRON covenant tokens ranked by market cap in KAS. */
export default function KccLeaderboard() {
  const [tokens, setTokens] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setTokens(null);
    setError(null);
    base44.functions.invoke("kccLeaderboard", {})
      .then(raw => {
        const res = raw?.data ?? raw;
        if (res?.success) setTokens(res.tokens || []);
        else setError(res?.error || "Could not load KCC-20 tokens");
      })
      .catch(e => setError(e?.message || "Could not load KCC-20 tokens"));
  };

  useEffect(load, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">KRON · kascov · live scan</p>
        <button
          onClick={load}
          disabled={tokens === null && !error}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/60 hover:text-white text-[11px] disabled:opacity-40 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {tokens === null && !error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mb-3" />
          <p className="text-white/50 text-xs">Scanning KRON & kascov for KCC-20 covenant tokens…</p>
          <p className="text-white/25 text-[10px] mt-1">This live scan can take up to a minute.</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <AlertCircle className="w-5 h-5 text-white/40 mb-2" />
          <p className="text-white/50 text-xs mb-3">{error}</p>
          <button onClick={load} className="text-cyan-300 text-xs underline">Try again</button>
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-14">No KCC-20 tokens surfaced — try refreshing.</p>
      ) : (
        <div className="space-y-2">
          {tokens.map((t, i) => (
            <KccTokenCard
              key={t.ticker + i}
              token={t}
              rank={i + 1}
              expanded={openId === t.ticker + i}
              onToggle={() => setOpenId(openId === t.ticker + i ? null : t.ticker + i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}