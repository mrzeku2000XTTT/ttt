import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Loader2, CheckCircle2, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PRESETS = [1, 5, 10, 50];

/**
 * Tip a KNS-verified listing owner in KAS. Sends via Kasware when available,
 * otherwise shows the address to pay manually. Successful sends are recorded
 * so they show up on the tip leaderboard.
 */
export default function TipListingModal({ target, onClose }) {
  const [amount, setAmount] = useState(5);
  const [status, setStatus] = useState(null); // 'sending' | 'sent' | 'error'
  const [txId, setTxId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const address = target?.address;

  const send = async () => {
    const kas = Number(amount);
    if (!kas || kas <= 0 || !address) return;
    setStatus("sending");
    setErrorMsg(null);
    try {
      if (!window.kasware?.sendKaspa) throw new Error("Kasware wallet not found — copy the address and tip manually.");
      const accounts = await window.kasware.requestAccounts();
      const from = accounts?.[0];
      const hash = await window.kasware.sendKaspa(address, Math.round(kas * 1e8));
      const tx = typeof hash === "string" ? hash : hash?.id || String(hash);
      await base44.entities.TipTransaction.create({
        sender_wallet: from || "unknown",
        recipient_wallet: address,
        recipient_name: target.name,
        amount: kas,
        token_type: "KAS",
        tx_hash: tx,
        description: `Tip to ${target.name} (${target.url}) from Search Kaspa`,
      });
      setTxId(tx);
      setStatus("sent");
    } catch (e) {
      setErrorMsg(e?.message || "Tip failed");
      setStatus("error");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border border-amber-500/25 bg-zinc-950 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-white font-bold text-sm">Tip {target.name}</span>
              <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === "sent" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-white text-sm mb-1">{amount} KAS sent</p>
                <p className="text-white/40 text-[10px] font-mono break-all">{txId}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5 mb-3">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        Number(amount) === p
                          ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                          : "bg-white/[0.04] border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 h-11 rounded-lg bg-white/[0.06] border border-white/15 text-white text-sm mb-3 focus:outline-none focus:border-amber-500/50"
                  placeholder="Amount in KAS"
                />

                <button
                  onClick={send}
                  disabled={status === "sending"}
                  className="w-full h-11 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-semibold hover:bg-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {status === "sending" ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : `Send ${amount || 0} KAS`}
                </button>

                {errorMsg && <p className="text-red-300 text-[11px] mt-2">{errorMsg}</p>}

                <button onClick={copy} className="w-full mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 hover:text-white text-[10px] font-mono">
                  <Copy className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{copied ? "Address copied" : address}</span>
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}