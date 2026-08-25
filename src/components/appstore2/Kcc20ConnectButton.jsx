import React, { useState, useEffect, useRef } from "react";
import { Wallet, Check, Copy, LogOut, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { useKcc20Wallet, shortKaspaAddress, formatKas } from "@/lib/useKcc20Wallet";

// Black "Connect Wallet" button — top-right of App Store v2 header.
// Desktop: "Connect Wallet" label. Mobile (<420px): wallet icon only.
// Connected: compact black chip "Scorpion · 0.000 KAS" that expands into a
// panel with the full address, balance, copy, and disconnect.
export default function Kcc20ConnectButton() {
  const { address, kas, loading, error, connect, disconnect, refreshState } = useKcc20Wallet();
  const [narrow, setNarrow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 420);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const handleConnect = async (e) => {
    e?.stopPropagation();
    try { await connect(); } catch {}
  };

  const copyAddress = async (e) => {
    e?.stopPropagation();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(`kaspa:${address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const handleDisconnect = (e) => {
    e?.stopPropagation();
    setOpen(false);
    disconnect();
  };

  // ── Connected: compact black chip that expands ──
  if (address) {
    return (
      <div className="relative flex-shrink-0" ref={wrapRef} style={{ minWidth: narrow ? 40 : 44 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-full bg-black text-white text-[12px] sm:text-[13px] font-semibold hover:bg-zinc-800 transition-colors whitespace-nowrap"
          title={`kaspa:${address}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          {narrow ? (
            <span className="font-mono text-[11px]">{formatKas(kas)}</span>
          ) : (
            <>
              <span className="text-white/70">Scorpion</span>
              <span className="font-mono">{formatKas(kas)} KAS</span>
            </>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            // Mobile: fixed, centered, full-width-ish so it never clips left.
            // Desktop: anchored under the button, right-aligned.
            className="fixed left-2 right-2 top-[5rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200 overflow-hidden z-[60]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-black text-white">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/60 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                KCC20 · Scorpion
              </div>
              <div className="mt-1.5 text-2xl font-[800] tracking-tight">{formatKas(kas)} <span className="text-base text-white/60">KAS</span></div>
              <div className="text-[11px] font-mono text-white/50 break-all mt-1">kaspa:{address}</div>
            </div>
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy address"}
            </button>
            <button
              onClick={() => { refreshState(); }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              <Wallet className="w-4 h-4" />
              Refresh balance
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-[13px] text-red-600 hover:bg-red-50 border-t border-zinc-100"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Disconnected: black connect button (icon-only on mobile) ──
  return (
    <div className="relative flex-shrink-0" style={{ minWidth: narrow ? 40 : 44 }}>
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`flex items-center justify-center gap-1.5 h-9 sm:h-10 rounded-full bg-black text-white text-[12px] sm:text-[13px] font-semibold shadow-md hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap ${
          narrow ? "w-10 px-0" : "px-3.5 sm:px-4"
        }`}
        title="Connect KCC20 Wallet"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            {!narrow && <span>Connect Wallet</span>}
          </>
        )}
      </button>
      {error && (
        <div
          className="absolute right-0 top-full mt-1.5 w-52 rounded-lg bg-red-50 ring-1 ring-red-200 px-2.5 py-1.5 text-[11px] text-red-700 z-50 flex items-start gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}