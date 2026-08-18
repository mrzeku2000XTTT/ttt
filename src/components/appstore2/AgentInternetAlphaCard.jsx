import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Github, Sparkles, CheckCircle, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Agent Internet Alpha — the "Build" side of the split hero.
 * Apple-style white card showing:
 *  - View-only TTT wallet balance (auth-gated)
 *  - "Train Your LLM" pitch with GitHub export readiness
 *  - CTA → /TTTBuilder (the real builder studio with GitHub export)
 */
export default function AgentInternetAlphaCard() {
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      const addr = u?.created_wallet_address || "";
      setWalletAddress(addr);
      if (addr) {
        setLoadingBalance(true);
        base44.functions.invoke("getKaspaBalance", { address: addr })
          .then(res => {
            const data = res?.data || res;
            setBalance(data?.balance ?? data?.available ?? null);
          })
          .catch(() => setBalance(null))
          .finally(() => setLoadingBalance(false));
      }
    }).catch(() => setUser(null));
  }, []);

  const isAuthenticated = !!user;
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-6)}`
    : "";

  const fmtBalance = (v) => {
    if (v == null) return "—";
    const n = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(n)) return "—";
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-white rounded-2xl ring-1 ring-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col"
    >
      {/* Subtle top accent line */}
      <div className="h-[3px] bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-400" />

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase">
            Alpha
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">Now in preview</span>
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-[800] tracking-tight text-zinc-900 mb-1.5">
          Agent Internet
        </h3>
        <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed mb-4">
          Train your own LLM agents with real Kaspa tools and workflows — then export straight to GitHub.
        </p>

        {/* View-only wallet balance */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3.5 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">TTT Wallet</span>
            </div>
            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider">View Only</span>
          </div>
          {isAuthenticated ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-[700] text-zinc-900 font-mono tracking-tight">
                  {loadingBalance ? "···" : fmtBalance(balance)}
                </span>
                <span className="text-xs font-medium text-zinc-400">KAS</span>
              </div>
              {shortAddr && (
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{shortAddr}</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-400">
              Connect to view your balance
            </div>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["AI Agents", "Live Tools", "Workflows"].map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
              {tag}
            </span>
          ))}
        </div>

        {/* GitHub export readiness */}
        <div className="flex items-center gap-2 mb-4 text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-zinc-700" />
            <span className="font-medium">Export to GitHub</span>
          </div>
          <span className="text-zinc-300">·</span>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="font-semibold text-green-600">Ready</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/TTTBuilder"
          className="mt-auto group flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          <Bot className="w-4 h-4" />
          Open Studio
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}