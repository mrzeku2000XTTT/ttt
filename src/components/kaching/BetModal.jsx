import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertTriangle, Zap, CheckCircle, Send, Copy, Check, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function BetModal({ game, side, walletAddress, onClose, onSuccess }) {
  const [step, setStep] = useState('send'); // send -> verify -> done
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [autoSign, setAutoSign] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const isAutoSign = localStorage.getItem('kaching_autosign') === 'true';
    setAutoSign(isAutoSign);
    if (isAutoSign) {
      try {
        const terraWallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
        const linkedAddr = localStorage.getItem('kaching_linked_wallet');
        const w = linkedAddr
          ? terraWallets.find(w => w.address === linkedAddr && w.mnemonic)
          : terraWallets.find(w => w.mnemonic);
        if (w) setLinkedWallet(w);
      } catch {}
    }
  }, []);

  const escrowFull = game.escrow_address?.startsWith('kaspa:')
    ? game.escrow_address
    : `kaspa:${game.escrow_address}`;

  const copyEscrow = () => {
    navigator.clipboard.writeText(escrowFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Escrow address copied');
  };

  // Step 1: Auto-sign sends KAS and gets TX hash automatically
  const handleAutoSend = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 0.1) { toast.error('Min 0.1 KAS'); return; }
    if (!linkedWallet?.mnemonic) { toast.error('No linked wallet'); return; }

    setLoading(true);
    try {
      const txRes = await base44.functions.invoke('sendKaspaTransaction', {
        mnemonic: linkedWallet.mnemonic,
        fromAddress: linkedWallet.address,
        toAddress: escrowFull,
        amountKas: amt,
      });

      if (txRes.data?.error) throw new Error(txRes.data.error);
      const hash = txRes.data.txId || '';
      setTxHash(hash);
      toast.success(`KAS sent! TX: ${hash.slice(0, 16)}...`);

      // Wait a moment for TX to propagate, then verify
      setStep('verify');
      setTimeout(() => verifyTx(hash), 3000);
    } catch (err) {
      toast.error(`Send failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify TX hash on-chain via backend
  const verifyTx = async (hash) => {
    const h = hash || txHash.trim();
    if (!h) { toast.error('Enter a transaction hash'); return; }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('kachingPlaceBet', {
        game_id: game.id,
        side,
        tx_hash_in: h,
      });

      if (!res.data?.success) throw new Error(res.data?.error || 'Verification failed');

      setVerifiedData(res.data);
      setStep('done');
      toast.success('Bet verified on-chain!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);
    } catch (err) {
      toast.error(err.message || 'Verification failed');
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

        {/* STEP 1: Send KAS to escrow */}
        {step === 'send' && (
          <div className="space-y-3">
            {/* Escrow address — copy to send KAS */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-1">Send KAS to this escrow</p>
              <div className="flex items-center gap-2">
                <p className="text-emerald-400/80 text-[10px] font-mono flex-1 truncate">{escrowFull}</p>
                <button onClick={copyEscrow} className="text-white/30 hover:text-emerald-400 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Auto-sign flow */}
            {autoSign && linkedWallet ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400/80 text-[10px] font-bold">Auto-Sign — sends real KAS on-chain</span>
                </div>
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
                <button
                  onClick={handleAutoSend}
                  disabled={loading || !parseFloat(amount) || parseFloat(amount) < 0.1}
                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    isYes
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
                  } disabled:opacity-30`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Send {amount || '0'} KAS & Verify
                </button>
              </>
            ) : (
              <>
                {/* Manual flow: user sends KAS externally then pastes TX */}
                <div className="px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                  <p className="text-amber-300/80 text-[10px] font-bold mb-1">Manual Bet — 3 Steps:</p>
                  <ol className="text-amber-300/50 text-[9px] space-y-0.5 list-decimal list-inside">
                    <li>Copy the escrow address above</li>
                    <li>Send KAS to it from your wallet (Kasware, etc.)</li>
                    <li>Paste your TX hash below to verify</li>
                  </ol>
                </div>
                <button
                  onClick={() => setStep('verify')}
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  I've sent KAS — Enter TX Hash
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Verify TX hash */}
        {step === 'verify' && (
          <div className="space-y-3">
            <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-2">Kaspa Transaction Hash</p>
              <input
                type="text"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="Paste your TX hash here..."
                className="w-full bg-black/30 border border-white/[0.08] focus:border-emerald-500/40 rounded-lg px-3 py-2.5 text-white text-xs font-mono focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/8 border border-blue-500/15 rounded-xl">
              <Search className="w-3.5 h-3.5 text-blue-400/70" />
              <span className="text-blue-300/60 text-[10px]">
                We'll verify this TX on the Kaspa blockchain to confirm your bet
              </span>
            </div>

            <button
              onClick={() => verifyTx()}
              disabled={loading || !txHash.trim()}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                isYes
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20'
              } disabled:opacity-30`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Verifying on-chain...' : 'Verify & Place Bet'}
            </button>
          </div>
        )}

        {/* STEP 3: Done — show verified on-chain data */}
        {step === 'done' && verifiedData && (
          <div className="space-y-3">
            <div className="flex flex-col items-center py-4 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-bold text-sm">Verified On-Chain!</p>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
              <div>
                <p className="text-white/30 text-[8px] uppercase tracking-wider">Sender Wallet</p>
                <p className="text-emerald-400 text-[10px] font-mono truncate">{verifiedData.sender_address}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">Amount Verified</p>
                  <p className="text-white font-bold text-sm">{verifiedData.amount_kas} KAS</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[8px] uppercase tracking-wider">Side</p>
                  <p className={`font-black text-sm ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>{side.toUpperCase()}</p>
                </div>
              </div>
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
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}