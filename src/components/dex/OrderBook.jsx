import React, { useMemo } from "react";

// AMM depth ladder — levels derived from a constant-product curve around the live price
export default function OrderBook({ price, kasReserve = 5000 }) {
  const { asks, bids, spread } = useMemo(() => {
    if (!price) return { asks: [], bids: [], spread: 0 };
    const k = kasReserve * (kasReserve * price); // x·y invariant from desk reserve
    const mk = (side) => Array.from({ length: 11 }, (_, i) => {
      const p = price * (1 + (side === "ask" ? 1 : -1) * (i + 1) * 0.0008);
      const size = Math.sqrt(k / p) * 0.004 * (1 + (i * 7919 % 13) / 13);
      return { p, size };
    });
    return { asks: mk("ask").reverse(), bids: mk("bid"), spread: price * 0.0016 };
  }, [price, kasReserve]);

  const maxSize = Math.max(...[...asks, ...bids].map(r => r.size), 1);
  const Row = ({ r, side }) => (
    <div className="relative flex justify-between px-3 py-[3px] text-[10px] font-mono">
      <div className={`absolute inset-y-0 right-0 ${side === "ask" ? "bg-red-500/10" : "bg-emerald-500/10"}`}
        style={{ width: `${(r.size / maxSize) * 100}%` }} />
      <span className={side === "ask" ? "text-red-400 relative" : "text-emerald-400 relative"}>{r.p.toFixed(6)}</span>
      <span className="text-white/50 relative">{(r.size / 1000).toFixed(1)}K</span>
    </div>
  );

  return (
    <div className="w-full lg:w-56 flex-shrink-0 border-l border-white/[0.06]">
      <div className="px-3 py-2 border-b border-white/[0.06] flex justify-between text-[9px] text-white/35 font-semibold uppercase tracking-wider">
        <span>Price (USDC)</span><span>Size (KAS)</span>
      </div>
      <div className="max-h-[190px] overflow-hidden flex flex-col justify-end">{asks.map((r, i) => <Row key={i} r={r} side="ask" />)}</div>
      <div className="px-3 py-2 border-y border-white/[0.06] flex items-center justify-between">
        <span className="text-white font-mono font-bold text-xs">{price ? price.toFixed(6) : "—"}</span>
        <span className="text-[9px] text-white/30 font-mono">spr {spread.toFixed(6)}</span>
      </div>
      <div className="max-h-[190px] overflow-hidden">{bids.map((r, i) => <Row key={i} r={r} side="bid" />)}</div>
    </div>
  );
}