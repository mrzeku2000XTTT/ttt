import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Copy, Check, Trophy, ArrowDownRight, RefreshCw, Coins } from "lucide-react";
import { toast } from "sonner";

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 min-w-0 group">
      <span className="text-white/50 text-[10px] font-mono truncate">{value}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0" />}
    </button>
  );
}

export default function BetReceipt({ show, onClose, bet }) {
  if (!show || !bet?.receipt) return null;
  const r = bet.receipt;
  const isWin = bet.status === 'won';
  const isRefund = bet.status === 'refunded';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className={`px-5 py-4 ${
            isWin ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5' :
            isRefund ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5' :
            'bg-gradient-to-r from-red-500/20 to-red-500/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isWin ? <Trophy className="w-5 h-5 text-emerald-400" /> :
                 isRefund ? <RefreshCw className="w-5 h-5 text-amber-400" /> :
                 <ArrowDownRight className="w-5 h-5 text-red-400" />}
                <div>
                  <h3 className="text-white font-bold text-sm">
                    {isWin ? 'Winner Receipt' : isRefund ? 'Refund Receipt' : 'Settlement Receipt'}
                  </h3>
                  <p className="text-white/30 text-[10px] font-mono">#{bet.game_number}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Question */}
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">Question</p>
              <p className="text-white/80 text-xs font-medium">{r.question}</p>
            </div>

            {/* Result + Judge Reason */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">Result</p>
                <span className={`text-xs font-black ${
                  r.result === 'YES' || r.result === 'yes' ? 'text-emerald-400' :
                  r.result === 'NO' || r.result === 'no' ? 'text-rose-400' : 'text-amber-400'
                }`}>{(r.result || '').toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">Your Pick</p>
                <span className={`text-xs font-black ${
                  r.your_side === 'yes' ? 'text-emerald-400' : 'text-rose-400'
                }`}>{(r.your_side || '').toUpperCase()} · {r.your_bet_kas} KAS</span>
              </div>
            </div>

            {/* Payout */}
            <div className={`p-3 rounded-xl border ${
              isWin ? 'bg-emerald-500/8 border-emerald-500/20' :
              isRefund ? 'bg-amber-500/8 border-amber-500/20' :
              'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-[10px]">KAS Payout</span>
                <span className={`text-sm font-black ${isWin ? 'text-emerald-400' : isRefund ? 'text-amber-400' : 'text-white/30'}`}>
                  {r.payout_kas > 0 ? `+${r.payout_kas}` : '0'} KAS
                </span>
              </div>
              {r.kas_tx_hash && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-white/20 text-[9px]">TX</span>
                  <div className="flex items-center gap-1.5">
                    <CopyField value={r.kas_tx_hash} label="TX Hash" />
                    <a href={`https://explorer.kaspa.org/txs/${r.kas_tx_hash}`} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400/40 hover:text-blue-400 flex-shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* PACMAN Bonus */}
            {r.pacman_bonus > 0 && (
              <div className="p-3 rounded-xl border bg-yellow-500/8 border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-white/40 text-[10px]">PACMAN Bonus</span>
                  </div>
                  <span className="text-yellow-400 text-sm font-black">+{r.pacman_bonus} PACMAN</span>
                </div>
                {r.pacman_tx_commit && (
                  <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white/20 text-[9px]">Commit TX</span>
                      <CopyField value={r.pacman_tx_commit} label="Commit TX" />
                    </div>
                    {r.pacman_tx_reveal && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/20 text-[9px]">Reveal TX</span>
                        <CopyField value={r.pacman_tx_reveal} label="Reveal TX" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {r.notes && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">Notes</p>
                <p className="text-white/60 text-[11px] leading-relaxed">{r.notes}</p>
              </div>
            )}

            {/* Pool + Time */}
            <div className="flex items-center justify-between text-[9px] text-white/20 pt-2 border-t border-white/[0.04]">
              <span>Pool: {r.total_pool_kas} KAS</span>
              <span>{r.settled_at ? new Date(r.settled_at).toLocaleString() : ''}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}