import React, { useEffect, useState } from "react";

/** Live crypto Fear & Greed index dial for the Search Crypto home screen. */
export default function FearGreedDial() {
  const [fng, setFng] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://api.alternative.me/fng/?limit=1");
        const d = await r.json();
        const row = d?.data?.[0];
        if (row) setFng({ value: Number(row.value), label: row.value_classification });
      } catch { /* optional */ }
    })();
  }, []);

  if (!fng) return null;

  const pct = Math.max(0, Math.min(100, fng.value));
  const color = pct < 25 ? "#f87171" : pct < 45 ? "#fb923c" : pct < 55 ? "#facc15" : pct < 75 ? "#a3e635" : "#34d399";

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 mb-5">
      <div className="flex items-end justify-between mb-2">
        <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Fear &amp; Greed</span>
        <div className="text-right">
          <div className="text-white font-bold text-lg leading-none" style={{ color }}>{fng.value}</div>
          <div className="text-white/50 text-[10px] font-mono uppercase">{fng.label}</div>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400">
        <div
          className="absolute -top-1 w-3.5 h-3.5 rounded-full border-2 border-black shadow-lg"
          style={{ left: `calc(${pct}% - 7px)`, background: color }}
        />
      </div>
    </div>
  );
}