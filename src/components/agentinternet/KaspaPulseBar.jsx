import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";

/**
 * Live Kaspa network heartbeat — price, hashrate and blue score, refreshed every 10s.
 * Sits at the top of Search Kaspa so the DAG feels alive while you browse.
 */
export default function KaspaPulseBar() {
  const [data, setData] = useState({ price: null, change: null, hashrate: null, blueScore: null });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next = {};
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true");
        const d = await r.json();
        next.price = d?.kaspa?.usd ?? null;
        next.change = d?.kaspa?.usd_24h_change ?? null;
      } catch { /* optional */ }
      try {
        const r = await fetch("https://api.kaspa.org/info/hashrate?stringOnly=false");
        const d = await r.json();
        next.hashrate = d?.hashrate ?? null;
      } catch { /* optional */ }
      try {
        const r = await fetch("https://api.kaspa.org/info/blockdag");
        const d = await r.json();
        next.blueScore = d?.virtualDaaScore ?? d?.blueScore ?? null;
      } catch { /* optional */ }
      if (alive) setData(prev => ({ ...prev, ...next }));
    };
    load();
    const id = setInterval(load, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const Stat = ({ label, value, tone = "text-white/80" }) => (
    <div className="flex items-baseline gap-1.5 flex-shrink-0">
      <span className="text-[9px] uppercase tracking-widest text-white/30 font-mono">{label}</span>
      <span className={`text-[11px] font-mono ${tone}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 overflow-x-auto scrollbar-hide border-b border-white/5 bg-cyan-500/[0.03] w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </span>
        <Activity className="w-3 h-3 text-cyan-400/70" />
      </div>
      <Stat label="KAS" value={data.price != null ? `$${data.price.toPrecision(4)}` : "—"} tone="text-cyan-200" />
      <Stat
        label="24h"
        value={data.change != null ? `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}%` : "—"}
        tone={data.change >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <Stat label="Hashrate" value={data.hashrate != null ? `${Number(data.hashrate).toFixed(2)} PH/s` : "—"} />
      <Stat label="DAA Score" value={data.blueScore != null ? Number(data.blueScore).toLocaleString() : "—"} />
    </div>
  );
}