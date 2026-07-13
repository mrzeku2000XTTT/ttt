import React, { useEffect, useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Desk KAS funding wallet — full copyable address so the admin can fund native swaps for users
export default function DeskFundingCard() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    let addr = null;
    const refreshBalance = async () => {
      if (!addr) return;
      try {
        const bal = await fetch(`https://api.kaspa.org/addresses/${encodeURIComponent(addr)}/balance`);
        const data = await bal.json();
        if (alive) setBalance((data.balance || 0) / 1e8);
      } catch { /* keep last known balance */ }
    };
    (async () => {
      try {
        const res = await base44.functions.invoke("igraBridge", { action: "info" });
        addr = res.data.kas_deposit_address;
        if (!alive || !addr) return;
        setAddress(addr);
        refreshBalance();
      } catch { /* card stays in loading state */ }
    })();
    const iv = setInterval(refreshBalance, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(8,7,4,0.75)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase"
          style={{ color: "rgba(201,162,75,0.85)", fontFamily: "monospace" }}>
          <Landmark className="w-3.5 h-3.5" /> DESK KAS FUNDING WALLET
        </div>
        <span className="text-[10px] font-black" style={{ color: "#6EE7B7", fontFamily: "monospace" }}>
          {balance == null ? "…" : `${balance.toFixed(4)} KAS`}
        </span>
      </div>
      {address ? (
        <button onClick={copy}
          className="w-full text-left flex items-start gap-2 px-3 py-2 rounded-xl focus:outline-none"
          style={{ border: "1px solid rgba(201,162,75,0.2)", background: "rgba(201,162,75,0.06)" }}>
          <span className="flex-1 text-[10px] break-all leading-relaxed"
            style={{ color: "#f5efe0", fontFamily: "monospace" }}>
            {address}
          </span>
          {copied
            ? <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#6EE7B7" }} />
            : <Copy className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "rgba(201,162,75,0.8)" }} />}
        </button>
      ) : (
        <div className="text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(201,162,75,0.5)", fontFamily: "monospace" }}>LOADING ADDRESS…</div>
      )}
      <p className="mt-2 text-[8px] tracking-[0.15em] uppercase leading-relaxed"
        style={{ color: "rgba(201,162,75,0.45)", fontFamily: "monospace" }}>
        ADMIN FUNDS THIS WALLET · POWERS NATIVE KAS → iKAS SWAPS (MIN 10 KAS) AND INSTANT iKAS → KAS PAYOUTS · EVERY DESK SWAP RETAINS A 0.5% FEE THAT REFILLS THE POOLS · TAP ADDRESS TO COPY
      </p>
    </div>
  );
}