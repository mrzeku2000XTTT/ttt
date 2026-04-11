import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Coins } from "lucide-react";
import { toast } from "sonner";

function CopyHash({ hash, label }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return null;
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-white/25 text-[9px] flex-shrink-0">{label}:</span>
      <button onClick={copy} className="flex items-center gap-1 min-w-0 group">
        <span className="text-white/40 text-[9px] font-mono truncate">{hash.slice(0, 16)}...</span>
        {copied ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0" />}
      </button>
      <a
        href={`https://explorer.kaspa.org/txs/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="text-blue-400/30 hover:text-blue-400 flex-shrink-0"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

export default function BetRow({ bet, game, onReceipt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border space-y-2 ${
        bet.status === 'won' ? 'bg-emerald-500/[0.06] border-emerald-500/15' :
        bet.status === 'lost' ? 'bg-red-500/[0.06] border-red-500/15' :
        'bg-white/[0.02] border-white/[0.06]'
      }`}
    >
      {/* Top row: side + question + status */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
          bet.side === 'yes' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
        }`}>
          {bet.side.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium truncate">{game?.question || 'Game #' + bet.game_number}</p>
          <p className="text-white/25 text-[10px] mt-0.5">
            {bet.amount_kas} KAS{(bet.amount_pacman || 0) > 0 ? ` + ${bet.amount_pacman} PAC` : ''} · #{bet.game_number}
          </p>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            <span className={`text-xs font-bold block ${
              bet.status === 'won' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-red-400' :
              bet.status === 'confirmed' ? 'text-blue-400' : 'text-amber-400'
            }`}>
              {bet.status === 'won' ? `+${bet.payout_kas?.toFixed(2)} KAS` : bet.status.toUpperCase()}
            </span>
            {bet.status === 'won' && (bet.payout_pacman || 0) > 0 && (
              <span className="text-yellow-400 text-[10px] font-bold block">+{bet.payout_pacman} PAC</span>
            )}
          </div>
          {bet.receipt && (
            <button
              onClick={onReceipt}
              className="text-[9px] text-cyan-400/60 hover:text-cyan-400 font-bold border border-cyan-500/20 px-1.5 py-0.5 rounded transition-colors"
            >
              Receipt
            </button>
          )}
        </div>
      </div>

      {/* TX Logs */}
      <div className="space-y-1 pl-13">
        {bet.tx_hash_in && (
          <CopyHash hash={bet.tx_hash_in} label="Deposit TX" />
        )}
        {bet.tx_hash_out && (
          <CopyHash hash={bet.tx_hash_out} label="Payout TX" />
        )}
        {bet.receipt?.pacman_bonus > 0 && (
          <div className="flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-yellow-400/50" />
            <span className="text-yellow-400/50 text-[9px]">+{bet.receipt.pacman_bonus} PACMAN</span>
            {bet.receipt.pacman_tx_commit && (
              <CopyHash hash={bet.receipt.pacman_tx_commit} label="KRC20" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}