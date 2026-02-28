import React from "react";
import { ExternalLink } from "lucide-react";

const VIBE_WALLET_URL = "https://www.vibecodeapp.com/s/cml70h8sz001y07mdw8puh73k";

export default function VibeWalletPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-bold text-sm tracking-widest">VIBE WALLET</span>
        </div>
        <a
          href={VIBE_WALLET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src={VIBE_WALLET_URL}
        className="flex-1 w-full border-0"
        title="VibeWallet"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}