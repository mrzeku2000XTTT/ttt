import React, { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";

// One Igra agent wallet card — address + live iKAS balance
export default function AgentWalletCard({ name, address, balance, local }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 rounded-2xl p-4"
      style={{ border: "1px solid rgba(201,162,75,0.3)", background: "rgba(12,10,6,0.65)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.35)" }}>
          <Bot className="w-4 h-4" style={{ color: "#C9A24B" }} />
        </div>
        <span className="text-[10px] font-black tracking-[0.25em] uppercase"
          style={{ color: "#C9A24B", fontFamily: "monospace" }}>
          AGENT {name.toUpperCase()}
        </span>
        {local && (
          <span className="ml-auto text-[7px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
            style={{ border: "1px solid rgba(110,231,183,0.4)", color: "#6EE7B7", fontFamily: "monospace" }}>
            LOCAL
          </span>
        )}
      </div>
      <div className="text-2xl font-black" style={{ color: "#ffffff", fontFamily: "monospace" }}>
        {balance !== null ? Number(balance).toFixed(4) : "—"}
        <span className="text-xs ml-1.5" style={{ color: "rgba(201,162,75,0.7)" }}>iKAS</span>
      </div>
      {address && (
        <button onClick={copy}
          className="mt-2 flex items-center gap-1.5 text-[8px] break-all text-left focus:outline-none"
          style={{ color: "rgba(201,162,75,0.6)", fontFamily: "monospace" }}>
          {address}
          {copied ? <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#6EE7B7" }} /> : <Copy className="w-3 h-3 flex-shrink-0" />}
        </button>
      )}
    </div>
  );
}