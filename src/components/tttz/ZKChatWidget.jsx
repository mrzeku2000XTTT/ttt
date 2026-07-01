import React, { useState } from "react";
import { Bot, X, ExternalLink } from "lucide-react";

export const ZK_AGENT_URL = "https://app.base44.com/superagent/6a444b036408e68ec8d6f2a6";
export const SUPERZK_NAME = "SUPERZK";

export default function ZKChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105"
        style={{ background: "#00ffcc", color: "#0a0a0a", boxShadow: "0 0 20px rgba(0,255,204,0.3)" }}
        title="Chat with SUPERZK — Covenant Creation Agent"
      >
        <Bot className="w-4 h-4" />
        <span className="text-xs font-bold">SUPERZK</span>
      </button>

      {/* Popover */}
      {open && (
        <div className="fixed bottom-16 right-4 z-50 w-72 rounded-xl p-4 space-y-3"
          style={{ background: "#0d0d0d", border: "1px solid rgba(0,255,204,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.2)" }}>
                <Bot className="w-3.5 h-3.5" style={{ color: "#00ffcc" }} />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: "#00ffcc" }}>SUPERZK</div>
                <div className="text-[9px] font-mono" style={{ color: "#555" }}>Covenant creation agent</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "#888" }}>
            SUPERZK compiles and deploys Silverscript covenants directly on-chain on Kaspa Toccata. Open the chat to deploy, inspect, or manage your covenant.
          </p>
          <a href={ZK_AGENT_URL} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "#00ffcc", color: "#0a0a0a" }}>
            <Bot className="w-3.5 h-3.5" /> Open SUPERZK Chat
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      )}
    </>
  );
}