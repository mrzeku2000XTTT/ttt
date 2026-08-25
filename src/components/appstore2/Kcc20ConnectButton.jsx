import React, { useState, useEffect } from "react";
import { Wallet, Check, Copy, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";

// Connect KCC20 button — top-right of App Store v2 header.
// Responsive: "Connect KCC20" >= 420px, "KCC20" below. Never wraps, never clips.
export default function Kcc20ConnectButton() {
  const { address, loading, error, connect, disconnect } = useKcc20Wallet();
  const [narrow, setNarrow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 420);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const handleConnect = async (e) => {
    e?.stopPropagation();
    try {
      await connect();
    } catch {
      // error surfaced via hook state
    }
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
    setMenuOpen(false);
    disconnect();
  };

  // Connected — address chip with tap menu
  if (address) {
    return (
      <div className="relative flex-shrink-0" style={{ minWidth: 44 }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-full bg-emerald-50 ring-1 ring-emerald-300 text-emerald-700 text-[12px] sm:text-[13px] font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap"
          title={`kaspa:${address}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono">{shortKaspaAddress(address)}</span>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-zinc-200 overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2.5 border-b border-zinc-100">
              <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">KCC20 Wallet</div>
              <div className="text-[11px] font-mono text-zinc-600 break-all mt-0.5">kaspa:{address}</div>
            </div>
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy address"}
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Disconnected — connect button
  return (
    <div className="relative flex-shrink-0" style={{ minWidth: 44 }}>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-[12px] sm:text-[13px] font-semibold shadow-md shadow-violet-500/30 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{narrow ? "…" : "Connecting…"}</span>
          </>
        ) : (
          <>
            <Wallet className="w-3.5 h-3.5" />
            <span>{narrow ? "KCC20" : "Connect KCC20"}</span>
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