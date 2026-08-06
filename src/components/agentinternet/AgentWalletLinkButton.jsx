import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Unlink, Shield, Wallet, Check, X } from "lucide-react";
import {
  getWallet, getWalletLink, linkWallet, unlinkWallet, LINK_SCOPES,
} from "@/lib/localKaspaWallet";

/**
 * "Link to AgentInternet" — explicit user consent that lets the TTT AI agent
 * SEE the local wallet address and call read-only tools with it (balance,
 * UTXOs, history). The private key is never shared. Sends still require
 * local signing + the confirm_money gate.
 */
export default function AgentWalletLinkButton({ compact = false, onLinked }) {
  const [wallet, setWallet] = useState(() => getWallet());
  const [link, setLink] = useState(() => getWalletLink());
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setWallet(getWallet());
      setLink(getWalletLink());
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const grant = () => {
    const l = linkWallet(LINK_SCOPES);
    setLink(l);
    setShowConsent(false);
    onLinked?.(l);
  };
  const revoke = () => { unlinkWallet(); setLink(null); };

  if (!wallet) return null;

  if (link) {
    return (
      <button
        onClick={revoke}
        className={
          compact
            ? "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-[9px] font-mono uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/20"
            : "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-[9px] font-mono uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/20"
        }
        title="Agent can read this wallet. Click to unlink."
      >
        {compact ? <Unlink className="w-3 h-3" /> : <Check className="w-3 h-3" />}
        {compact ? "Unlink" : "Linked to AgentInternet"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConsent(true)}
        className={
          compact
            ? "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-[9px] font-mono uppercase tracking-widest text-cyan-300 hover:bg-cyan-400/20"
            : "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-[9px] font-mono uppercase tracking-widest text-cyan-300 hover:bg-cyan-400/20"
        }
      >
        <Link2 className="w-3 h-3" /> Link to AgentInternet
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showConsent && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConsent(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-[360px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <Shield className="w-4 h-4 text-cyan-300" />
                <span className="text-white font-bold text-sm">Link wallet to AgentInternet</span>
                <button onClick={() => setShowConsent(false)} className="ml-auto text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Wallet className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
                  <div className="text-[10px] font-mono">
                    <div className="text-white/40">wallet</div>
                    <div className="text-cyan-300 break-all">{wallet.address}</div>
                  </div>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  This lets the TTT AI agent <b className="text-white">see your wallet address</b> and call
                  read-only tools with it — balance, UTXOs, and transaction history.
                </p>
                <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                    <Check className="w-3 h-3" /> Address shared with agent
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                    <Check className="w-3 h-3" /> Read-only: balance, UTXOs, history
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-red-300">
                    <X className="w-3 h-3" /> Private key NEVER shared
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-red-300">
                    <X className="w-3 h-3" /> Sends still need your local sign-off
                  </div>
                </div>
                <p className="text-[9px] text-white/40 leading-snug">
                  Revoke anytime — the agent instantly loses access. Clearing the wallet also unlinks.
                </p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowConsent(false)}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/60 hover:bg-white/10">
                    Cancel
                  </button>
                  <button onClick={grant}
                    className="flex-1 py-2.5 rounded-lg bg-cyan-400 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-300">
                    Grant access
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}