import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowDownLeft, ArrowUpRight, Copy, Wallet } from "lucide-react";

const BRIGHT = "#f59e0b";
const FONT = "'Impact', 'Arial Black', 'Arial Narrow', sans-serif";
const KASPA_STREAM = "https://kaspa.stream/txs/";

// View-only: ZK reads the user's local Terra wallets, checks balances + main wallet
// transaction history. No keys touched — addresses only.
export default function ZKWalletHistoryCard() {
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [txs, setTxs] = useState(null);

  useEffect(() => {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem("terra_wallets") || "[]"); } catch {}
    setWallets(stored);
    if (!stored.length) { setTxs([]); return; }

    (async () => {
      const balMap = {};
      for (const w of stored) {
        try {
          const res = await base44.functions.invoke("getKaspaBalance", { address: w.address });
          balMap[w.address] = res?.data?.balanceKAS ?? "?";
        } catch { balMap[w.address] = "?"; }
        setBalances({ ...balMap });
      }
      try {
        const main = stored.find(w => w.mnemonic) || stored[0];
        const res = await base44.functions.invoke("getKaspaTransactionHistory", { address: main.address });
        setTxs(res.data?.transactions || []);
      } catch { setTxs([]); }
    })();
  }, []);

  const box = { background: "rgba(0,0,0,0.4)", border: "2px solid rgba(217,119,6,0.35)", boxShadow: "3px 3px 0px #78350f" };

  if (!wallets.length) {
    return (
      <div className="max-w-[78%] px-4 py-3" style={box}>
        <p className="text-[11px]" style={{ color: "rgba(217,119,6,0.6)" }}>No local wallets found — create or import one in Terra.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[92%] sm:max-w-[80%] p-4" style={box}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: BRIGHT, fontFamily: FONT }}>
        <Wallet className="w-3.5 h-3.5" /> YOUR WALLETS · VIEW ONLY
      </div>

      {/* Balances */}
      <div className="space-y-1.5 mb-3">
        {wallets.map((w, i) => (
          <div key={w.address} className="flex items-center justify-between px-3 py-2" style={{ background: "rgba(217,119,6,0.05)", border: "1px solid rgba(217,119,6,0.2)" }}>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase" style={{ color: "rgba(245,158,11,0.85)", fontFamily: FONT }}>{w.label || `WALLET ${i + 1}`}{w.mnemonic ? " ◆" : ""}</div>
              <div className="text-[9px] font-mono truncate" style={{ color: "rgba(217,119,6,0.4)" }}>{w.address.slice(0, 16)}…{w.address.slice(-6)}</div>
            </div>
            <div className="text-[11px] font-bold flex-shrink-0 ml-2" style={{ color: BRIGHT }}>
              {balances[w.address] === undefined ? <Loader2 className="w-3 h-3 animate-spin" /> : balances[w.address] === "?" ? "—" : `${Number(balances[w.address]).toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS`}
            </div>
          </div>
        ))}
      </div>

      {/* Main wallet history */}
      <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: "rgba(217,119,6,0.55)", fontFamily: FONT }}>MAIN WALLET HISTORY</div>
      {txs === null ? (
        <div className="flex items-center gap-2 py-3 text-[10px]" style={{ color: "rgba(217,119,6,0.5)" }}>
          <Loader2 className="w-3 h-3 animate-spin" /> Loading transactions…
        </div>
      ) : txs.length === 0 ? (
        <div className="py-2 text-[10px]" style={{ color: "rgba(217,119,6,0.4)" }}>No transactions yet.</div>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {txs.slice(0, 10).map((tx, idx) => (
            <div key={idx} className="flex items-center gap-2 px-2.5 py-2" style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(217,119,6,0.15)" }}>
              {tx.type === "receive"
                ? <ArrowDownLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34c759" }} />
                : <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold" style={{ color: tx.type === "receive" ? "#34c759" : "#ef4444" }}>
                  {tx.type === "receive" ? "+" : "-"}{Number(tx.amount).toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS
                </div>
                <a href={`${KASPA_STREAM}${tx.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-[9px] font-mono hover:underline" style={{ color: "rgba(245,158,11,0.6)" }}>
                  {String(tx.id).slice(0, 10)}…{String(tx.id).slice(-6)}
                </a>
              </div>
              {tx.timestamp && (
                <span className="text-[8px] flex-shrink-0" style={{ color: "rgba(217,119,6,0.35)" }}>
                  {new Date(tx.timestamp).toLocaleString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
              <button onClick={() => navigator.clipboard.writeText(tx.id).catch(() => {})}
                className="flex-shrink-0 p-1" style={{ color: "rgba(217,119,6,0.5)" }} title="Copy TX ID">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}