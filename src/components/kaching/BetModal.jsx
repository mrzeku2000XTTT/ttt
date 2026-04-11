import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Zap, CheckCircle, ExternalLink, Wallet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [step, setStep] = useState('amount'); // amount -> sending -> verifying -> done
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    // Find active Terra wallet with mnemonic
    try {
      const wallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
      const linked = localStorage.getItem('kaching_linked_wallet');
      const w = linked
        ? wallets.find(w => w.address === linked && w.mnemonic)
        : wallets.find(w => w.mnemonic);
      if (w) {
        setActiveWallet(w);
        fetchBalance(w.address);
      }
    } catch {}
  }, []);

  const fetchBalance = async (addr) => {
    try {
      const clean = addr.replace('kaspa:', '');
      const res = await fetch(`https://api.kaspa.org/addresses/kaspa:${clean}/balance`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance((data.balance || 0) / 1e8);
      }
    } catch {}
  };

  const escrowFull = game.escrow_address?.startsWith('kaspa:')
    ? game.escrow_address
    : `kaspa:${game.escrow_address}`;

  const handlePlaceBet = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 0.1) { toast.error('Min bet: 0.1 KAS'); return; }
    if (!activeWallet?.mnemonic) { toast.error('No wallet with seed phrase found'); return; }
    if (walletBalance !== null && amt > walletBalance) { toast.error('Insufficient balance'); return; }

    setLoading(true);
    setStep('sending');

    try {
      // Step 1: Send KAS from native wallet to escrow
      const txRes = await base44.functions.invoke('sendKaspaTransaction', {
        mnemonic: activeWallet.mnemonic,
        fromAddress: activeWallet.address,
        toAddress: escrowFull,
        amountKas: amt,
      });

      if (txRes.data?.error) throw new Error(txRes.data.error);
      const txHash = txRes.data.txId || '';
      if (!txHash) throw new Error('No transaction ID returned');

      toast.success(`KAS sent! Verifying...`);
      setStep('verifying');

      // Step 2: Wait for TX to propagate then verify on-chain
      await new Promise(r => setTimeout(r, 4000));

      const verifyRes = await base44.functions.invoke('kachingPlaceBet', {
        game_id: game.id,
        side,
        tx_hash_in: txHash,
      });

      if (!verifyRes.data?.success) throw new Error(verifyRes.data?.error || 'Verification failed');

      setVerifiedData({ ...verifyRes.data, tx_hash_in: txHash });
      setStep('done');
      toast.success('Bet placed & verified on-chain!');

      // Refresh balance
      fetchBalance(activeWallet.address);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);
    } catch (err) {
      toast.error(err.message || 'Transaction failed');
      setStep('amount');
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
        <p className="text-white/30 text-[10px] mb-4">{isYes ? game.yes_label : game.no_label}</p>

        {/* No wallet warning */}
        {!activeWallet && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold">No Wallet Found</span>
            </div>
            <p className="text-amber-300/60 text-[10px]">
              Import or create a wallet in Terra first. Your wallet needs a seed phrase to sign transactions.
            </p>
          </div>
        )}

        {/* STEP: Enter amount */}
        {step === 'amount' && activeWallet && (
          <div className="space-y-3">
            {/* Wallet info */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <Wallet className="w-3.5 h-3.5 text-emerald-400/60" />
              <span className="text-white/40 text-[10px] font-mono truncate flex-1">
                {activeWallet.address?.slice(0, 24)}...
              </span>
              {walletBalance !== null && (
                <span className="text-emerald-400 text-[10px] font-bold">{walletBalance.toFixed(2)} KAS</span>
              )}
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount in KAS (min 0.1)"
                className="w-full bg-black/30 border border-white/[0.08] focus:border-emerald-500/40 rounded-xl px-4 py-3 text-white text-lg font-bold pr-16 focus:outline-none transition-colors"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">KAS</span>
            </div>

            {/* Quick amounts */}
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

            {/* Potential payout */}
            {parseFloat(amount) > 0 && (
              <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Potential payout if {side} wins:</span>
                  <span className="text-emerald-400 font-bold">
                    {(() => {
                      const pool = (game.yes_pool_kas || 0) + (game.no_pool_kas || 0) + parseFloat(amount);
                      const sidePool = (side === 'yes' ? game.yes_pool_kas || 0 : game.no_pool_kas || 0) + parseFloat(amount);
                      const share = sidePool > 0 ? (parseFloat(amount) / sidePool) * pool * 0.98 : 0;
                      return share.toFixed(2);
                    })()} KAS
                  </span>
                </div>
              </div>
            )}

            {/* Place bet button */}
            <button
              onClick={handlePlaceBet}
              disabled={loading || !parseFloat(amount) || parseFloat(amount) < 0.1}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-30`}
            >
              <Zap className="w-4 h-4" />
              Place {amount || '0'} KAS on {side.toUpperCase()}
            </button>

            <p className="text-white/15 text-[8px] text-center">
              Sends KAS directly from your wallet to escrow · Verified on Kaspa blockchain
            </p>
          </div>
        )}

        {/* STEP: Sending TX */}
        {step === 'sending' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-white font-bold text-sm">Sending {amount} KAS...</p>
            <p className="text-white/30 text-[10px]">Signing transaction from your wallet</p>
          </div>
        )}

        {/* STEP: Verifying on-chain */}
        {step === 'verifying' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-white font-bold text-sm">Verifying on-chain...</p>
            <p className="text-white/30 text-[10px]">Confirming transaction on Kaspa blockchain</p>
          </div>
        )}

        {/* STEP: Done */}
        {step === 'done' && verifiedData && (
          <div className="space-y-3">
            <div className="flex flex-col items-center py-4 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-bold text-sm">Bet Placed!</p>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">Amount</p>
                  <p className="text-white font-bold text-sm">{verifiedData.amount_kas} KAS</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">Side</p>
                  <p className={`font-black text-sm ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>{side.toUpperCase()}</p>
                </div>
              </div>
              <div>
                <p className="text-white/30 text-[8px] uppercase tracking-wider">Wallet</p>
                <p className="text-emerald-400 text-[10px] font-mono truncate">{verifiedData.sender_address}</p>
              </div>
              {verifiedData.tx_hash_in && (
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">TX Hash</p>
                  <a
                    href={`https://explorer.kaspa.org/txs/${verifiedData.tx_hash_in}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400/60 text-[9px] font-mono truncate flex items-center gap-1 hover:text-blue-400"
                  >
                    {verifiedData.tx_hash_in}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}