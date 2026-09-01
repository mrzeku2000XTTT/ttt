import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Copy, Check, Loader2, Shield, Zap, Clock } from "lucide-react";
import { shortKaspaAddress } from "@/lib/useKcc20Wallet";
import { useAppStoreAccess } from "@/lib/useAppStoreAccess";

// Modal shown when a user tries to OPEN an app without an active access window.
// Browsing the store and reading app docs stay open; only the launch is gated.
// Flow: Connect Scorpion → self-send KAS to your own address (pays the Kaspa
// miner fee) → we off-chain verify → 30-minute access to every app.
export default function AppAccessGate({ open, onClose, onAuthorized }) {
  const access = useAppStoreAccess();
  const { address, connect, loading, walletError, verifying, verifyError, verify, valid } = access;
  const [copied, setCopied] = useState(false);
  const firedRef = useRef(false);

  // When access becomes valid while the gate is open, fire onAuthorized once.
  useEffect(() => { if (open) firedRef.current = false; }, [open]);
  useEffect(() => {
    if (open && valid && !firedRef.current) {
      firedRef.current = true;
      onAuthorized?.();
    }
  }, [open, valid, onAuthorized]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(`kaspa:${address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60 sticky top-0 bg-[#F5F5F7] z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🦂</span>
                <span className="text-[15px] font-[800] tracking-tight text-zinc-900">Unlock this app</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                TTT apps run on Kaspa. To open this app, pay the Kaspa miner fee — send KAS to yourself from your Scorpion wallet. We verify it off-chain and unlock <b>every app in the store</b> for 30 minutes.
              </p>

              {/* Steps */}
              <div className="rounded-xl bg-white ring-1 ring-zinc-200/70 p-4 space-y-3 mb-4">
                <Step n="1" title="Connect Scorpion" desc="The KCC-20 wallet powers the store." />
                <Step n="2" title="Self-send KAS" desc="In Scorpion, send any amount to your own address." />
                <Step n="3" title="We verify off-chain" desc="Auto-detected — no signatures, no custody." />
                <Step n="4" title="30-minute access" desc="All apps unlock. Renew by self-sending again." />
              </div>

              {/* Action */}
              {!address ? (
                <button
                  onClick={connect}
                  disabled={loading}
                  className="w-full h-11 rounded-full bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-zinc-800 transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                  Connect Scorpion
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-400 font-semibold mb-1.5">
                      Your Scorpion address
                    </div>
                    <button
                      onClick={copy}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white ring-1 ring-zinc-200/60 hover:bg-zinc-50 transition"
                    >
                      <span className="font-mono text-xs text-zinc-700 break-all text-left">
                        {shortKaspaAddress(address)}
                      </span>
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>
                  </div>

                  <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside pl-1">
                    <li>Open Scorpion → <b>Send</b>.</li>
                    <li>Paste your own address as the recipient.</li>
                    <li>Send any amount of KAS (the miner fee is all you pay).</li>
                  </ol>

                  <button
                    onClick={verify}
                    disabled={verifying}
                    className="w-full h-11 rounded-full bg-black text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-zinc-800 transition-colors"
                  >
                    {verifying ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Verifying…</>
                    ) : (
                      <><Shield className="w-5 h-5" />I sent it — Verify</>
                    )}
                  </button>

                  {verifying && (
                    <p className="text-[11px] text-zinc-400 text-center">
                      Watching for your self-send… (checks every few seconds, up to 3 min)
                    </p>
                  )}
                  {verifyError && !verifying && (
                    <p className="text-xs text-red-500 text-center">{verifyError}</p>
                  )}
                  {walletError && (
                    <p className="text-xs text-red-500 text-center">{walletError}</p>
                  )}
                </div>
              )}

              <p className="text-center text-[11px] text-zinc-400 mt-4">
                No subscriptions. No middleman. Just the Kaspa network fee.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 flex-shrink-0 text-[11px] font-bold">
        {n}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}