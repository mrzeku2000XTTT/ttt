import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

// Real settlement: BUY = KAS→iKAS via native Igra Entry (desk-funded, min 10 KAS).
// SELL = iKAS→KAS instant payout from desk liquidity (deposit iKAS to pool, paste tx hash).
export default function TradePanel({ price, poolAddress, onTrade }) {
  const [side, setSide] = useState("buy");
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [l2Tx, setL2Tx] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const usd = price && amount ? (Number(amount) * price).toFixed(2) : "0.00";

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      if (side === "buy") {
        if (!(Number(amount) >= 10)) throw new Error("Minimum buy is 10 KAS (native entry)");
        if (!/^0x[0-9a-fA-F]{40}$/.test(dest)) throw new Error("Enter a valid 0x iKAS receive address");
        const res = await base44.functions.invoke("igraNativeEntry", { action: "entry", amount_kas: Number(amount), l2_address: dest });
        setMsg({ ok: true, text: `Filled · native entry mined & submitted — tx ${res.data.tx_id.slice(0, 14)}… · iKAS mints to your address` });
      } else {
        if (!/^0x[0-9a-fA-F]{64}$/.test(l2Tx)) throw new Error("Paste your iKAS deposit tx hash (0x…)");
        if (!/^kaspa:[a-z0-9]{61,63}$/.test(dest)) throw new Error("Enter a valid kaspa: payout address");
        const res = await base44.functions.invoke("igraBridge", { action: "ikas_to_kas", l2_tx_hash: l2Tx, kaspa_address: dest });
        setMsg({ ok: true, text: `Filled · ${res.data.amount} KAS paid to your wallet — tx ${String(res.data.tx_out).slice(0, 14)}…` });
      }
      onTrade?.();
    } catch (err) {
      setMsg({ ok: false, text: err?.response?.data?.error || err.message });
    }
    setBusy(false);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50";

  return (
    <div className="w-full lg:w-72 flex-shrink-0 border-l border-white/[0.06] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.04]">
        <button onClick={() => { setSide("buy"); setMsg(null); }}
          className={`py-2 rounded-lg text-xs font-bold ${side === "buy" ? "bg-emerald-500 text-black" : "text-white/50"}`}>Buy iKAS</button>
        <button onClick={() => { setSide("sell"); setMsg(null); }}
          className={`py-2 rounded-lg text-xs font-bold ${side === "sell" ? "bg-red-500 text-white" : "text-white/50"}`}>Sell iKAS</button>
      </div>
      <div className="text-[9px] uppercase tracking-wider text-white/30 font-semibold">Market · AMM · 1:1 KAS/iKAS</div>

      {side === "buy" ? (
        <>
          <input className={inputCls} placeholder="Amount (KAS, min 10)" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
          <input className={inputCls} placeholder="Your iKAS address (0x…)" value={dest} onChange={e => setDest(e.target.value)} />
        </>
      ) : (
        <>
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] uppercase tracking-wider text-white/30 font-semibold mb-1">Step 1 · Send iKAS to pool</div>
            <div className="text-[9px] font-mono text-cyan-400/80 break-all">{poolAddress || "loading pool…"}</div>
          </div>
          <input className={inputCls} placeholder="Your deposit tx hash (0x…)" value={l2Tx} onChange={e => setL2Tx(e.target.value)} />
          <input className={inputCls} placeholder="Your kaspa: payout address" value={dest} onChange={e => setDest(e.target.value)} />
        </>
      )}

      <div className="flex justify-between text-[10px] text-white/40 font-mono">
        <span>Order value</span><span>{usd} USDC</span>
      </div>

      <button onClick={submit} disabled={busy}
        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${side === "buy" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy ? "Settling on-chain…" : "Place Order"}
      </button>

      {msg && (
        <div className={`px-3 py-2 rounded-xl text-[10px] leading-relaxed ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
          {msg.text}
        </div>
      )}
      <p className="text-[9px] text-white/25 leading-relaxed">
        Buys mint real iKAS via the native Igra Entry bridge. Sells pay real KAS instantly from desk liquidity.
      </p>
    </div>
  );
}