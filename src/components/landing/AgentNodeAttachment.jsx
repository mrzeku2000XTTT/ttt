import React from "react";
import { Network, ArrowDownLeft, ArrowUpRight, Check, X } from "lucide-react";

const BORDER = "1px solid rgba(77,107,254,0.3)";
const BG = "rgba(77,107,254,0.08)";
const shorten = (s) => (s && s.length > 20 ? `${s.slice(0, 14)}…${s.slice(-6)}` : s);
const fmtTime = (t) => (t ? new Date(Number(t)).toLocaleString() : "—");

export default function AgentNodeAttachment({ a }) {
  if (a.type === "node") return (
    <div className="mt-3 px-4 py-3 rounded-xl" style={{ background: BG, border: BORDER }}>
      <div className="flex items-center gap-2 mb-2">
        <Network className="w-4 h-4" style={{ color: "#8fa3ff" }} />
        <span className="text-sm font-bold text-white">Live Kaspa Node</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(48,209,88,0.12)", color: "#30D158" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" /> CONNECTED
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-white/40">Network</span><span className="text-white/80 font-mono">{a.network}</span>
        <span className="text-white/40">Blocks</span><span className="text-white/80 font-mono">{Number(a.blockCount).toLocaleString()}</span>
        <span className="text-white/40">DAA Score</span><span className="text-white/80 font-mono">{Number(a.virtualDaaScore).toLocaleString()}</span>
        <span className="text-white/40">Difficulty</span><span className="text-white/80 font-mono">{Number(a.difficulty).toExponential(2)}</span>
      </div>
    </div>
  );

  if (a.type === "txlist") return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ background: BG, border: BORDER }}>
      <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(77,107,254,0.2)" }}>
        <div className="text-sm font-bold" style={{ color: "#8fa3ff" }}>{Number(a.balanceKAS).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</div>
        <div className="text-[10px] text-white/40 font-mono">{shorten(a.address)}</div>
      </div>
      {a.txs.length === 0 ? (
        <div className="px-4 py-3 text-xs text-white/40">No transactions found</div>
      ) : a.txs.map((tx) => (
        <div key={tx.txId} className="flex items-center gap-2 px-4 py-2 text-xs" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {tx.direction === "in"
            ? <ArrowDownLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#30D158" }} />
            : <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF453A" }} />}
          <span className="font-semibold" style={{ color: tx.direction === "in" ? "#30D158" : "#FF453A" }}>
            {tx.direction === "in" ? "+" : "−"}{Number(tx.amountKAS).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
          </span>
          <span className="text-white/30 font-mono truncate flex-1">{shorten(tx.txId)}</span>
          <span className="text-white/40 whitespace-nowrap">{fmtTime(tx.time)}</span>
        </div>
      ))}
    </div>
  );

  if (a.type === "txdetail") return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ background: BG, border: BORDER }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(77,107,254,0.2)" }}>
        <span className="text-xs font-bold text-white">Transaction</span>
        {a.accepted
          ? <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(48,209,88,0.12)", color: "#30D158" }}><Check className="w-2.5 h-2.5" /> Accepted</span>
          : <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,69,58,0.12)", color: "#FF453A" }}><X className="w-2.5 h-2.5" /> Not accepted</span>}
        <span className="text-[10px] text-white/40 ml-auto">{fmtTime(a.blockTime)}</span>
      </div>
      <div className="px-4 py-2 text-[10px] text-white/40 font-mono break-all">{a.txId}</div>
      <div className="grid grid-cols-3 gap-2 px-4 pb-2 text-xs">
        <div><div className="text-white/40 text-[10px]">In</div><div className="text-white/80 font-semibold">{Number(a.totalInKAS).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</div></div>
        <div><div className="text-white/40 text-[10px]">Out</div><div className="text-white/80 font-semibold">{Number(a.totalOutKAS).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</div></div>
        <div><div className="text-white/40 text-[10px]">Fee</div><div className="text-white/80 font-semibold">{Number(a.feeKAS).toFixed(6)} KAS</div></div>
      </div>
      <div className="px-4 pb-3 space-y-1">
        {a.outputs.slice(0, 5).map((o, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <ArrowUpRight className="w-3 h-3 flex-shrink-0 text-white/30" />
            <span className="text-white/40 font-mono truncate flex-1">{shorten(o.address)}</span>
            <span className="text-white/70 font-semibold whitespace-nowrap">{Number(o.amountKAS).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</span>
          </div>
        ))}
        {a.outputs.length > 5 && <div className="text-[10px] text-white/30">+{a.outputs.length - 5} more outputs</div>}
      </div>
    </div>
  );

  return null;
}