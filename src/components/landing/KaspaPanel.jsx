import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Wallet, Loader2, RefreshCw, ArrowLeft, Copy, Check, AlertCircle, ExternalLink } from "lucide-react";

const SESSION_KEY = "kaspa_panel_wallet";

function truncateAddress(addr) {
  if (!addr) return "";
  const clean = addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

/**
 * KaspaPanel — full-screen wallet-gated panel for the landing page.
 *
 * Detection order (first hit wins, persisted to localStorage so refresh survives):
 *   1. Kasware extension (window.kasware) — connected or connectable
 *   2. Logged-in user's saved wallet (created_wallet_address / kasware_address)
 *
 * If no wallet is found, the user is sent to generate one (in-app link, no new
 * tab); returning to the landing and reopening the panel re-detects it.
 */
export default function KaspaPanel({ onClose }) {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [source, setSource] = useState(null); // "kasware" | "profile" | "session"
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Restore session instantly so refresh doesn't blank the panel
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (saved?.address) {
        setAddress(saved.address);
        setSource(saved.source || "session");
      }
    } catch {}
    detectWallet();
  }, []);

  const persist = (addr, src) => {
    setAddress(addr);
    setSource(src);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ address: addr, source: src }));
    } catch {}
  };

  const detectWallet = async () => {
    setChecking(true);
    setError(null);

    // 1. Kasware extension — already-connected accounts
    if (typeof window.kasware !== "undefined") {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts && accounts.length > 0) {
          persist(accounts[0], "kasware");
          setChecking(false);
          return;
        }
      } catch {}
    }

    // 2. Logged-in user's saved wallet
    try {
      const me = await base44.auth.me();
      const saved = me?.created_wallet_address || me?.kasware_address;
      if (saved) {
        persist(saved, "profile");
        setChecking(false);
        return;
      }
    } catch {
      // not logged in — fine, fall through
    }

    // 3. Already have a session address from a prior detection
    if (address) {
      setChecking(false);
      return;
    }

    setChecking(false);
  };

  const connectKasware = async () => {
    if (typeof window.kasware === "undefined") {
      setError("Kasware wallet not detected. Generate a wallet below to continue.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts && accounts.length > 0) {
        persist(accounts[0], "kasware");
      }
    } catch (err) {
      setError(err?.message || "Failed to connect Kasware.");
    } finally {
      setConnecting(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // "Generate a wallet" — in-app navigation (no new tab). User comes back after.
  const goToGenerate = () => {
    navigate("/WalletHub");
  };

  const cleanAddress = address
    ? address.startsWith("kaspa:") ? address : `kaspa:${address}`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "#050505", fontFamily: "'Georgia', serif" }}
    >
      {/* Top bar with TTT logo (click → back to landing) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/30 bg-black/60">
        <button
          onClick={onClose}
          className="flex items-center gap-2 group focus:outline-none"
          title="Back to landing"
        >
          <span
            className="text-2xl font-black tracking-tight"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              background: "linear-gradient(180deg, #fff5cc 0%, #f0d060 25%, #c8960c 60%, #6b4200 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TTT
          </span>
          <ArrowLeft className="w-4 h-4 text-amber-700/60 group-hover:text-amber-500 transition-colors" />
        </button>
        <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700/50 font-mono">KASPA</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Wallet card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(20,14,4,0.8)",
              border: "1px solid rgba(200,150,40,0.25)",
              boxShadow: "0 0 40px rgba(200,140,0,0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-700/20 border border-amber-600/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Kaspa Wallet</h2>
                <p className="text-amber-700/60 text-xs font-mono uppercase tracking-wider">
                  {source === "kasware" ? "Kasware · Connected" : source === "profile" ? "Profile Wallet" : source === "session" ? "Session Wallet" : "Not connected"}
                </p>
              </div>
              <button
                onClick={detectWallet}
                className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-amber-700/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Re-detect wallet"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              </button>
            </div>

          {checking ? (
            <div className="flex items-center justify-center gap-2 py-8 text-amber-600/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono uppercase tracking-wider">Detecting wallet…</span>
            </div>
          ) : cleanAddress ? (
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-amber-700/50 font-mono mb-1.5">Connected Address</div>
              <button
                onClick={copyAddress}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 group transition-colors"
                style={{ background: "rgba(200,150,40,0.08)", border: "1px solid rgba(200,150,40,0.2)" }}
              >
                <span className="font-mono text-sm text-amber-200 truncate">{truncateAddress(cleanAddress)}</span>
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-600/50 group-hover:text-amber-400 flex-shrink-0" />
                )}
              </button>
              <div className="mt-2 text-[10px] text-amber-800/50 font-mono">Tap to copy full address</div>

              <button
                onClick={onClose}
                className="w-full mt-5 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
                style={{
                  background: "linear-gradient(180deg, #f0d060 0%, #c8960c 100%)",
                  color: "#1a1000",
                }}
              >
                Continue →
              </button>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <p className="text-amber-100/70 text-sm mb-5 leading-relaxed">
                No Kaspa wallet detected. Connect your Kasware extension, or generate a wallet to get started.
              </p>

              <button
                onClick={connectKasware}
                disabled={connecting}
                className="w-full mb-3 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: "rgba(200,150,40,0.12)",
                  border: "1px solid rgba(200,150,40,0.4)",
                  color: "#f0d060",
                }}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {connecting ? "Connecting…" : "Connect Kasware"}
              </button>

              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-amber-900/30" />
                <span className="text-[9px] uppercase tracking-[0.3em] text-amber-800/50 font-mono">or</span>
                <div className="flex-1 h-px bg-amber-900/30" />
              </div>

              <button
                onClick={goToGenerate}
                className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(180deg, #f0d060 0%, #c8960c 100%)",
                  color: "#1a1000",
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Generate a Wallet
              </button>
              <p className="mt-3 text-[10px] text-amber-800/50 font-mono leading-relaxed">
                Generate a wallet, then return here — it'll be detected automatically.
              </p>
            </div>
          )}
          </div>

          <div className="mt-6 text-center text-[9px] tracking-[0.4em] uppercase text-amber-900/40 font-mono">
            © TTT PLATFORM · POWERED BY KASPA
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}