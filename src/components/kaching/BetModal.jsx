import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('amount'); // amount -> confirm -> sending

  const handlePlace = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!walletAddress) { toast.error('Connect wallet first'); return; }

    setStep('sending');
    setLoading(true);

    try {
      // 1. Register bet on backend
      const res = await base44.functions.invoke('kachingPlaceBet', {
        game_id: game.id,
        side,
        amount_kas: amt,
        user_wallet_address: walletAddress
      });

      if (!res.data?.success) throw new Error(res.data?.error || 'Failed to register bet');

      // 2. Send KAS to escrow via Kasware (if available)
      if (window.kasware) {
        try {
          const txid = await window.kasware.sendKaspa(
            `kaspa:${game.escrow_address}`,
            Math.round(amt * 1e8)
          );
          toast.success(`Bet placed! TX: ${txid?.slice(0, 12)}...`);
        } catch (e) {
          toast.info('Bet registered. Please send manually to escrow address.');
        }
      } else {
        toast.success(`Bet registered! Send ${amt} KAS to escrow address to confirm.`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Bet error:', err);
      toast.error(err.message || 'Failed to place bet');
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
        <p className="text-white/30 text-[10px] mb-4">
          {isYes ? game.yes_label : game.no_label} · Escrow: kaspa:{game.escrow_address?.slice(0, 10)}...
        </p>

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
                <span className="text-white/40 text-xs">Escrow</span>
                <span className="text-white/50 font-mono text-[10px]">kaspa:{game.escrow_address?.slice(0, 10)}...</span>
              </div>
            </div>

            <p className="text-white/30 text-[10px] text-center">
              {window.kasware ? 'Kasware will prompt you to sign the transaction' : 'You will need to send KAS manually to the escrow address'}
            </p>

            <button
              onClick={handlePlace}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-40`}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Confirm — {amount} KAS</>}
            </button>

            <button onClick={() => setStep('amount')} className="w-full text-center text-white/30 text-xs hover:text-white/50 transition-colors py-1">
              Go back
            </button>
          </div>
        )}

        {step === 'sending' && loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-white/40 text-sm">Processing transaction...</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}