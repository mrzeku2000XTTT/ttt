import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";

const ACCENT = "#d97706";
const BRIGHT = "#f59e0b";
const FONT = "'Impact', 'Arial Black', 'Arial Narrow', sans-serif";
const KASPA_STREAM = "https://kaspa.stream/txs/";

// Dark industrial "transaction sent" notification. Truncated TX id links to
// kaspa.stream, copyable, auto-dismisses.
export default function ZKTxToast({ tx, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(onClose, 10000);
    return () => clearTimeout(t);
  }, [onClose]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(tx.txId); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const short = tx.txId ? `${tx.txId.slice(0, 10)}…${tx.txId.slice(-8)}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      className="fixed top-16 right-4 z-[130] w-[300px]"
      style={{ background: "#141414", border: `2px solid ${ACCENT}`, boxShadow: "4px 4px 0px #78350f, 0 8px 30px rgba(0,0,0,0.7)", fontFamily: "'Arial Narrow', Arial, sans-serif" }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(217,119,6,0.25)", background: "rgba(217,119,6,0.08)" }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center" style={{ background: "#16a34a" }}>
            <Check className="w-3 h-3 text-black" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRIGHT, fontFamily: FONT }}>TRANSACTION SENT</span>
        </div>
        <button onClick={onClose} style={{ color: "rgba(217,119,6,0.5)" }}><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[11px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
          {tx.amount} KAS → <span className="font-mono text-[10px]" style={{ color: "rgba(245,158,11,0.7)" }}>{tx.to ? `${tx.to.slice(6, 14)}…${tx.to.slice(-5)}` : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`${KASPA_STREAM}${tx.txId}`} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono hover:underline flex-1 truncate" style={{ color: BRIGHT }} title="View on kaspa.stream">
            {short}
          </a>
          <button onClick={copy} className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase flex-shrink-0"
            style={{ border: "1px solid rgba(217,119,6,0.4)", color: copied ? "#34c759" : "rgba(217,119,6,0.7)", fontFamily: FONT }}>
            <Copy className="w-2.5 h-2.5" /> {copied ? "COPIED" : "COPY"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}