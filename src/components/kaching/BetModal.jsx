import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertTriangle, Zap, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('amount'); // amount -> sending -> done
  const [txHash, setTxHash] = useState("");
  const [autoSign, setAutoSign] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState(null);

  useEffect(() => {
    const isAutoSign = localStorage.getItem('kaching_autosign') === 'true';
    setAutoSign(isAutoSign);
    if (isAutoSign) {
      try {
        const terraWallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
        const linkedAddr = localStorage.getItem('kaching_linked_wallet');
        if (linkedAddr) {
          const w = terraWallets.find(w => w.address === linkedAddr && w.mnemonic);
          if (w) setLinkedWallet(w);
        }
        if (!linkedAddr) {
          const w = terraWallets.find(w => w.mnemonic);
          if (w) setLinkedWallet(w);
        }
      } catch {}
    }
  }, []);

  const escrowFull = game.escrow_address?.startsWith('kaspa:')
    ? game.escrow_address
    : `kaspa:${game.escrow_address}`;

  const handleBet = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!walletAddress) { toast.error('Connect wallet first'); return; }

    setStep('sending');
    setLoading(true);

    let sentTxHash = null;

    // Step 1: If auto-sign is on AND we have a linked wallet with mnemonic, send real KAS
    if (autoSign && linkedWallet?.mnemonic) {
      try {
        const txRes = await base44.functions.invoke('sendKaspaTransaction', {
          mnemonic: linkedWallet.mnemonic,
          fromAddress: linkedWallet.address,
          toAddress: escrowFull,
          amountKas: amt,
        });

        if (txRes.data?.error) throw new Error(txRes.data.error);
        sentTxHash = txRes.data.txId || '';
        setTxHash(sentTxHash);
        toast.success(`KAS sent on-chain! TX: ${String(sentTxHash).slice(0, 16)}...`);
      } catch (err) {
        console.error('Auto-sign send failed:', err);
        toast.error(`Transaction failed: ${err.message}`);
        setStep('amount');
        setLoading(false);
        return;
      }
    }

    // Step 2: Register bet on backend
    try {
      const res = await base44.functions.invoke('kachingPlaceBet', {
        game_id: game.id,
        side,
        amount_kas: amt,
        user_wallet_address: walletAddress,
        tx_hash_in: sentTxHash || undefined,
      });

      if (!res.data?.success) throw new Error(res.data?.error || 'Failed to register bet');

      setStep('done');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Bet registration error:', err);
      toast.error(err.message || 'Failed to place bet');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const isYes = side === 'yes';
  const sideColor = isYes ? 'emerald' : 'red';

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
        {/* Header */}
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
        <p className="text-white/30 text-[10px] mb-2">{isYes ? game.yes_label : game.no_label}</p>

        {/* Auto-sign indicator */}
        {autoSign && linkedWallet && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg mb-3">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400/80 text-[10px] font-bold">Auto-Sign ON — sends real KAS to escrow</span>
          </div>
        )}

        {/* Escrow destination */}
        <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg mb-4">
          <p className="text-white/20 text-[9px] mb-0.5">Game Escrow Address</p>
          <p className="text-white/40 text-[10px] font-mono truncate">{escrowFull}</p>
        </div>

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
              {[1, 5, 10, 25, 50, 100].map(v => (
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

            {!autoSign && walletAddress && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
                <span className="text-amber-300/60 text-[10px]">Enable Auto-Sign in settings to send real KAS with bets</span>
              </div>
            )}

            <button
              onClick={handleBet}
              disabled={!parseFloat(amount) || parseFloat(amount) <= 0 || !walletAddress}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-30`}
            >
              {autoSign && linkedWallet ? (
                <><Zap className="w-4 h-4" /> Bet {amount || '0'} KAS — Send Now</>
              ) : (
                <><Send className="w-4 h-4" /> Place Bet — {amount || '0'} KAS</>
              )}
            </button>
          </div>
        )}

        {step === 'sending' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-white font-bold text-sm">
              {autoSign ? 'Sending KAS to escrow...' : 'Placing bet...'}
            </p>
            <p className="text-white/30 text-[10px]">
              {autoSign ? 'Signing & broadcasting transaction' : 'Registering your prediction'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
            <p className="text-white font-bold text-sm">Bet placed!</p>
            <p className="text-white/40 text-[10px]">{amount} KAS on {side.toUpperCase()}</p>
            {txHash && (
              <div className="mt-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg w-full">
                <p className="text-white/20 text-[9px]">On-chain TX</p>
                <p className="text-emerald-400/60 text-[10px] font-mono truncate">{txHash}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}