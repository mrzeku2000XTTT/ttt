import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

function CopyableField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 min-w-0 group">
      <span className={`text-white/50 text-[10px] truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors" />}
    </button>
  );
}

function BetRow({ bet }) {
  const isYes = bet.side === 'yes';
  const statusColors = {
    won: 'text-emerald-400',
    lost: 'text-red-400',
    confirmed: 'text-blue-400',
    refunded: 'text-amber-400',
    pending_deposit: 'text-amber-400/60',
  };

  return (
    <div className={`p-3 rounded-xl border space-y-2 ${
      isYes ? 'bg-emerald-500/[0.04] border-emerald-500/15' : 'bg-red-500/[0.04] border-red-500/15'
    }`}>
      {/* Top row: side + amount + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
            isYes ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}>{bet.side.toUpperCase()}</span>
          <span className="text-white font-bold text-sm">{bet.amount_kas} KAS</span>
        </div>
        <div className="flex items-center gap-2">
          {bet.payout_kas > 0 && (
            <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+{bet.payout_kas.toFixed(2)}
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase ${statusColors[bet.status] || 'text-white/30'}`}>
            {bet.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Wallet address */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-white/20 text-[9px] flex-shrink-0">Wallet</span>
        <CopyableField label="Address" value={bet.user_wallet_address?.startsWith('kaspa:') ? bet.user_wallet_address : `kaspa:${bet.user_wallet_address}`} />
      </div>

      {/* TX Hash In */}
      {bet.tx_hash_in && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-white/20 text-[9px] flex-shrink-0">TX In</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <CopyableField label="TX Hash" value={bet.tx_hash_in} />
            <a href={`https://explorer.kaspa.org/txs/${bet.tx_hash_in}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-400/40 hover:text-blue-400 flex-shrink-0 transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* TX Hash Out (payout) */}
      {bet.tx_hash_out && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-emerald-400/30 text-[9px] flex-shrink-0">TX Out</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <CopyableField label="Payout TX" value={bet.tx_hash_out} />
            <a href={`https://explorer.kaspa.org/txs/${bet.tx_hash_out}`} target="_blank" rel="noopener noreferrer"
              className="text-emerald-400/40 hover:text-emerald-400 flex-shrink-0 transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BetLedgerModal({ show, onClose, game, bets }) {
  if (!show) return null;

  const yesBets = bets.filter(b => b.side === 'yes');
  const noBets = bets.filter(b => b.side === 'no');
  const yesTotal = yesBets.reduce((s, b) => s + (b.amount_kas || 0), 0);
  const noTotal = noBets.reduce((s, b) => s + (b.amount_kas || 0), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-950 border border-emerald-500/20 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <h3 className="text-white font-bold text-sm">Bet Ledger</h3>
              <p className="text-white/25 text-[10px] font-mono">#{game.game_number} · {bets.length} bets · {(yesTotal + noTotal).toFixed(2)} KAS pool</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Escrow */}
          <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-white/25 text-[9px]">Escrow Address</span>
              <CopyableField label="Escrow" value={`kaspa:${game.escrow_address}`} />
            </div>
          </div>

          {/* Scrollable bets */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* YES section */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-black">YES</span>
                </div>
                <span className="text-white/25 text-[10px]">{yesBets.length} bets · {yesTotal.toFixed(2)} KAS</span>
              </div>
              {yesBets.length > 0 ? (
                <div className="space-y-2">
                  {yesBets.map(bet => <BetRow key={bet.id} bet={bet} />)}
                </div>
              ) : (
                <p className="text-white/10 text-[10px] text-center py-4">No YES bets</p>
              )}
            </div>

            {/* NO section */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 text-[11px] font-black">NO</span>
                </div>
                <span className="text-white/25 text-[10px]">{noBets.length} bets · {noTotal.toFixed(2)} KAS</span>
              </div>
              {noBets.length > 0 ? (
                <div className="space-y-2">
                  {noBets.map(bet => <BetRow key={bet.id} bet={bet} />)}
                </div>
              ) : (
                <p className="text-white/10 text-[10px] text-center py-4">No NO bets</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}