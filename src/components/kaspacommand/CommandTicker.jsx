import React from "react";

// Bottom scrolling live ticker — OSIRIS-style
export default function CommandTicker({ price, hashrate, aggs, blockdag }) {
  const total = Object.values(aggs?.countries || {}).reduce((a, b) => a + b, 0);
  const items = [
    `KAS $${price?.price ? Number(price.price).toFixed(4) : "—"}`,
    `HASHRATE ${hashrate?.hashrate ? `${(Number(hashrate.hashrate)).toFixed(2)} EH/s` : "—"}`,
    `PUBLIC NODES ${total || "—"}`,
    `DAA ${blockdag?.virtualDaaScore ? Number(blockdag.virtualDaaScore).toLocaleString() : "—"}`,
    `BLOCK COUNT ${blockdag?.blockCount ? Number(blockdag.blockCount).toLocaleString() : "—"}`,
    `NET ${blockdag?.networkName?.toUpperCase() || "KASPA-MAINNET"}`,
  ];
  const line = items.join("   ·   ");

  return (
    <div className="flex items-center gap-3 border-t flex-shrink-0 overflow-hidden"
      style={{ borderColor: "rgba(45,212,191,0.15)", background: "rgba(2,8,10,0.95)", fontFamily: "monospace" }}>
      <span className="px-3 py-1.5 text-[9px] font-black tracking-widest flex-shrink-0"
        style={{ background: "#14b8a6", color: "#02110e" }}>LIVE</span>
      <div className="relative flex-1 overflow-hidden">
        <div className="whitespace-nowrap text-[10px] tracking-wider py-1.5 animate-[cmdticker_40s_linear_infinite]"
          style={{ color: "rgba(94,234,212,0.85)" }}>
          {line}   ·   {line}
        </div>
      </div>
      <style>{`@keyframes cmdticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}