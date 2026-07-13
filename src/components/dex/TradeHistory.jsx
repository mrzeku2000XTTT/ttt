import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Real settled swaps from the desk AMM ledger
export default function TradeHistory({ refreshKey }) {
  const [swaps, setSwaps] = useState([]);
  useEffect(() => {
    base44.entities.IgraBridgeSwap.list("-created_date", 15).then(setSwaps).catch(() => {});
  }, [refreshKey]);

  return (
    <div className="border-t border-white/[0.06]">
      <div className="px-5 py-2.5 text-[11px] font-semibold text-white border-b border-white/[0.06]">Trade History <span className="text-white/30 font-normal">· real on-chain settlements</span></div>
      <div className="grid grid-cols-4 px-5 py-2 text-[9px] uppercase tracking-wider text-white/30 font-semibold">
        <span>Time</span><span>Side</span><span className="text-right">Qty (KAS)</span><span className="text-right">Tx</span>
      </div>
      {swaps.length === 0 && <div className="px-5 pb-4 text-[11px] text-white/25">No settled trades yet.</div>}
      {swaps.map(s => (
        <div key={s.id} className="grid grid-cols-4 px-5 py-1.5 text-[10px] font-mono border-t border-white/[0.03]">
          <span className="text-white/40">{new Date(s.created_date).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          <span className={s.direction === "kas_to_ikas" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
            {s.direction === "kas_to_ikas" ? "BUY iKAS" : "SELL iKAS"}
          </span>
          <span className="text-right text-white/70">{Number(s.amount).toFixed(4)}</span>
          <span className="text-right text-cyan-400/70 truncate pl-4">{(s.tx_out || "").slice(0, 10)}…</span>
        </div>
      ))}
    </div>
  );
}