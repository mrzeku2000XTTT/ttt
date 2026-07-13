import React from "react";

const TEAL = "#2dd4bf";
const row = { fontFamily: "monospace" };

// Right-side intel panel — node totals + top countries
export default function NodeStatsPanel({ aggs, blockdag }) {
  const countries = aggs?.countries || {};
  const total = Object.values(countries).reduce((a, b) => a + b, 0);
  const top = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = top[0]?.[1] || 1;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={row}>
      <div className="px-3 py-2 text-[9px] tracking-[0.3em] uppercase border-b"
        style={{ color: TEAL, borderColor: "rgba(45,212,191,0.15)" }}>
        ▚ NODE INTEL
      </div>
      <div className="grid grid-cols-2 gap-px p-2 flex-shrink-0">
        <Stat label="PUBLIC NODES" value={total || "—"} />
        <Stat label="COUNTRIES" value={Object.keys(countries).length || "—"} />
        <Stat label="DAA SCORE" value={blockdag?.virtualDaaScore ? Number(blockdag.virtualDaaScore).toLocaleString() : "—"} small />
        <Stat label="NETWORK" value={blockdag?.networkName?.replace("kaspa-", "").toUpperCase() || "MAINNET"} small />
      </div>
      <div className="px-3 py-1.5 text-[8px] tracking-[0.3em] uppercase" style={{ color: "rgba(45,212,191,0.5)" }}>
        TOP DEPLOYMENT ZONES
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {top.map(([code, n]) => (
          <div key={code} className="flex items-center gap-2">
            <span className="w-7 text-[10px]" style={{ color: "#eafaf7" }}>{code}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(45,212,191,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: "linear-gradient(90deg,#0d9488,#5eead4)" }} />
            </div>
            <span className="w-8 text-right text-[10px]" style={{ color: TEAL }}>{n}</span>
          </div>
        ))}
        {top.length === 0 && <div className="text-[10px] text-white/30">ACQUIRING SIGNAL…</div>}
      </div>
      <div className="px-3 py-2 border-t text-[8px] tracking-widest uppercase" style={{ borderColor: "rgba(45,212,191,0.12)", color: "rgba(255,255,255,0.3)" }}>
        SOURCE: NODES.KASPA.WS · OPEN DATA
      </div>
    </div>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="p-2" style={{ background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.1)" }}>
      <div className="text-[7px] tracking-[0.25em] uppercase" style={{ color: "rgba(45,212,191,0.55)" }}>{label}</div>
      <div className={`${small ? "text-xs" : "text-lg"} font-black mt-0.5`} style={{ color: "#eafaf7" }}>{value}</div>
    </div>
  );
}