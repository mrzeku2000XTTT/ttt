import React from "react";
import { ExternalLink } from "lucide-react";

const VIBE_WALLET_URL = "https://www.vibecodeapp.com/s/cml70h8sz001y07mdw8puh73k";

export default function VibeWalletPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-white/10">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f12be76ff_917DCBBE-5E2C-48AE-98CE-2E10DFA61973.png"
              alt="VibeWallet"
              className="w-full h-full object-contain"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
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

      {/* Hint message */}
      <div className="text-center py-1.5 bg-black border-b border-white/5 flex-shrink-0">
        <span className="text-white/40 text-xs">💡 Press and hold any QR code to save or open in your wallet app</span>
      </div>

      {/* Iframe - full fit */}
      <iframe
        src={VIBE_WALLET_URL}
        title="VibeWallet"
        allow="clipboard-read; clipboard-write"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          minHeight: 0
        }}
      />
    </div>
  );
}