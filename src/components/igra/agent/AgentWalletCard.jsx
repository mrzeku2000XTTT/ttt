import React, { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";

// One Igra agent wallet card — address + live iKAS balance
export default function AgentWalletCard({ name, address, balance }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 rounded-2xl p-4"
      style={{ border: "1px solid rgba(249,115,22,0.3)", background: "rgba(40,16,4,0.6)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Bot className="w-4 h-4" style={{ color: "#fb923c" }} />
        </div>
        <span className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: "#fdba74", fontFamily: "monospace" }}>
          AGENT {name.toUpperCase()}
        </span>
      </div>
      <div className="text-2xl font-black" style={{ color: "#fff7ed", fontFamily: "monospace" }}>
        {balance !== null ? Number(balance).toFixed(4) : "—"}
        <span className="text-xs ml-1.5" style={{ color: "rgba(255,180,120,0.6)" }}>iKAS</span>
      </div>
      {address && (
        <button onClick={copy}
          className="mt-2 flex items-center gap-1.5 text-[8px] break-all text-left focus:outline-none"
          style={{ color: "rgba(255,200,160,0.55)", fontFamily: "monospace" }}>
          {address}
          {copied ? <Check className="w-3 h-3 flex-shrink-0 text-green-400" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
        </button>
      )}
    </div>
  );
}