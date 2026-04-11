import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertTriangle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('amount'); // amount -> confirm -> sending -> done

  const handlePlace = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!walletAddress) { toast.error('Connect wallet first'); return; }

    setStep('sending');
    setLoading(true);

    try {
      // Register bet on backend — immediately confirmed & pool updated
      const res = await base44.functions.invoke('kachingPlaceBet', {
        game_id: game.id,
        side,
        amount_kas: amt,
        user_wallet_address: walletAddress
      });

      if (!res.data?.success) throw new Error(res.data?.error || 'Failed to register bet');

      // Try to send KAS on-chain via Kasware extension
      let txSent = false;
      if (window.kasware) {
        try {
          const escrowFull = `kaspa:${game.escrow_address}`;
          const sompi = Math.round(amt * 1e8);
          const txid = await window.kasware.sendKaspa(escrowFull, sompi);
          if (txid) {
            txSent = true;
            toast.success(`KAS sent! TX: ${txid.slice(0, 12)}...`);
          }
        } catch (e) {
          console.log('Kasware send failed (bet still recorded):', e.message);
        }
      }

      if (!txSent) {
        toast.success(`Bet recorded! ${amt} KAS on ${side.toUpperCase()}`);
      }

      setStep('done');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Bet error:', err);
      toast.error(err.message || 'Failed to place bet');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const isYes = side === 'yes';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 border border-white/10 rounded-2xl p-5 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${
              isYes ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'
            }`}>
              {side.toUpperCase()}
            </div>
            <span className="text-white/30 text-[10px] font-mono">#{game.game_number}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-white text-sm font-bold mb-1">{game.question}</p>
        <p className="text-white/30 text-[10px] mb-4">{isYes ? game.yes_label : game.no_label}</p>

        {step === 'amount' && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/30 border border-white/[0.08] focus:border-emerald-500/40 rounded-xl px-4 py-3 text-white text-lg font-bold pr-16 focus:outline-none transition-colors"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">KAS</span>
            </div>

            <div className="flex gap-1.5">
              {[1, 5, 10, 25, 50].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v.toString())}
                  className="flex-1 py-2 bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/20 rounded-lg text-xs text-white/40 hover:text-emerald-300 font-bold transition-all"
                >
                  {v}
                </button>
              ))}
            </div>

            {!walletAddress && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
                <span className="text-amber-300/60 text-[10px]">Connect wallet in settings first</span>
              </div>
            )}

            <button
              onClick={() => { if (parseFloat(amount) > 0) setStep('confirm'); }}
              disabled={!parseFloat(amount) || parseFloat(amount) <= 0}
              className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                isYes
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
              } disabled:opacity-30`}
            >
              Continue
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40 text-xs">Amount</span>
                <span className="text-white font-bold text-sm">{amount} KAS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-xs">Side</span>
                <span className={`font-bold text-sm ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>{side.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-xs">Your wallet</span>
                <span className="text-white/50 font-mono text-[10px]">kaspa:{walletAddress?.slice(0, 8)}...</span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
              <p className="text-emerald-400/70 text-[10px] text-center font-medium">
                Your bet will be recorded with your Kaspa address. Winners split the losing pool proportionally.
              </p>
            </div>

            <button
              onClick={handlePlace}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-40`}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing bet...</> : <><Send className="w-4 h-4" /> Confirm — {amount} KAS</>}
            </button>

            <button onClick={() => setStep('amount')} className="w-full text-center text-white/30 text-xs hover:text-white/50 transition-colors py-1">
              Go back
            </button>
          </div>
        )}

        {step === 'sending' && loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-white/40 text-sm">Placing your bet...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-white font-bold text-sm">Bet placed!</p>
            <p className="text-white/40 text-[10px]">{amount} KAS on {side.toUpperCase()}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}