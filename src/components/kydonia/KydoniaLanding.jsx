import React from "react";
import { Store, Wallet } from "lucide-react";
import KydoniaMark from "./KydoniaMark";
import KydoniaLandingHero from "./KydoniaLandingHero";
import KydoniaLandingSections from "./KydoniaLandingSections";
import KydoniaLandingFooter from "./KydoniaLandingFooter";

export default function KydoniaLanding({ hasWallet, wallet, loading, error, onConnect, onEnter, onSeed, onExit }) {
  return (
    <div className="kydonia-page">
      <header className="sticky top-0 z-30 border-b border-[#23262d] bg-[#08090c]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <KydoniaMark />
            <div className="leading-tight">
              <p className="text-[13px] tracking-[0.16em]">KYDONIA</p>
              <p className="kyd-sans text-[11px] text-[#8f8a83]">Paste a URL. Index it. Query it.</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-[11px] tracking-[0.1em] text-[#a29d94] uppercase md:flex">
            <a href="#workflow" className="transition-colors hover:text-[#e8dcc8]">Workflow</a>
            <a href="#produces" className="transition-colors hover:text-[#e8dcc8]">What it produces</a>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" className="kyd-btn" onClick={onExit}>
              <Store className="h-3.5 w-3.5" />
              Store
            </button>
            <button type="button" className="kyd-btn" onClick={() => (hasWallet ? onEnter() : onConnect())}>
              <Wallet className="h-3.5 w-3.5" />
              {hasWallet ? wallet : "Account"}
            </button>
          </div>
        </div>
      </header>

      <KydoniaLandingHero
        hasWallet={hasWallet}
        loading={loading}
        error={error}
        onConnect={onConnect}
        onSeed={onSeed}
      />

      <KydoniaLandingSections onEnter={onEnter} hasWallet={hasWallet} onConnect={onConnect} />

      <KydoniaLandingFooter onExit={onExit} />
    </div>
  );
}