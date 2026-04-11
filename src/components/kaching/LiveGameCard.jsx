import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Zap, ExternalLink, Gavel, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import BetLedgerModal from "@/components/kaching/BetLedgerModal";

export default function LiveGameCard({ game, userBets, onBet }) {
  const [copied, setCopied] = useState(false);
  const [allBets, setAllBets] = useState([]);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const isOpen = game.status === 'open' && new Date(game.end_time) > new Date();
  const isSettled = game.status === 'settled';
  const isJudging = game.status === 'judging' || game.status === 'locked';
  const myBets = userBets?.filter(b => b.game_id === game.id) || [];

  useEffect(() => {
    if (showLedgerModal || isSettled) {
      base44.entities.GameBet.filter({ game_id: game.id }, '-created_date', 50)
        .then(setAllBets).catch(() => {});
    }
  }, [game.id, showLedgerModal, isSettled, game.total_pool_kas]);

  const copyEscrow = () => {
    navigator.clipboard.writeText(`kaspa:${game.escrow_address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Escrow address copied');
  };

  const yesTotal = game.yes_pool_kas || 0;
  const noTotal = game.no_pool_kas || 0;
  const total = yesTotal + noTotal;
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50;

  // Kalshi-style implied odds
  const yesOdds = total > 0 && yesTotal > 0 ? (total / yesTotal).toFixed(2) : '—';
  const noOdds = total > 0 && noTotal > 0 ? (total / noTotal).toFixed(2) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-white/[0.06]"
    >
      {isOpen && <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />}

      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={copyEscrow} className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-md transition-all">
              <span className="text-emerald-400 text-[9px] font-mono font-bold">#{game.game_number}</span>
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-white/20" />}
            </button>
            <span className="text-white/15 text-[8px]">{game.subcategory}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/10 text-[8px] font-mono">
              Escrow: kaspa:{game.escrow_address?.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="text-white font-bold text-[13px] leading-snug mb-2.5">{game.question}</p>

        {/* Kalshi-style YES/NO odds bar */}
        <div className="mb-2.5">
          <div className="flex items-center gap-1 mb-1">
            <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${yesPct}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <div>
              <span className="text-emerald-400 font-bold">YES {yesPct}¢</span>
              <span className="text-white/15 ml-1">({yesTotal.toFixed(1)} KAS · {game.yes_count || 0})</span>
              {yesOdds !== '—' && <span className="text-white/10 ml-1">×{yesOdds}</span>}
            </div>
            <div className="text-right">
              <span className="text-red-400 font-bold">NO {100 - yesPct}¢</span>
              <span className="text-white/15 ml-1">({noTotal.toFixed(1)} KAS · {game.no_count || 0})</span>
              {noOdds !== '—' && <span className="text-white/10 ml-1">×{noOdds}</span>}
            </div>
          </div>
        </div>

        {/* TWO BOTS: Judge Bot + Payout Bot */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {/* Judge Bot */}
          <div className={`px-2.5 py-2 rounded-lg border ${
            isSettled ? 'bg-purple-500/8 border-purple-500/20' :
            isJudging ? 'bg-amber-500/8 border-amber-500/20' :
            'bg-white/[0.02] border-white/[0.05]'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Gavel className={`w-3 h-3 ${isSettled ? 'text-purple-400' : isJudging ? 'text-amber-400 animate-pulse' : 'text-white/20'}`} />
              <span className={`text-[8px] font-black uppercase tracking-wider ${
                isSettled ? 'text-purple-400' : isJudging ? 'text-amber-400' : 'text-white/20'
              }`}>Judge Bot</span>
            </div>
            {isSettled && game.result ? (
              <div>
                <span className={`text-[10px] font-black ${game.result === 'yes' ? 'text-emerald-400' : game.result === 'no' ? 'text-red-400' : 'text-white/40'}`}>
                  {game.result === 'yes' ? '✓ YES' : game.result === 'no' ? '✓ NO' : 'PUSH'}
                </span>
                <p className="text-white/20 text-[7px] mt-0.5 line-clamp-2">{game.judge_reason}</p>
              </div>
            ) : isJudging ? (
              <p className="text-amber-400/60 text-[8px]">Fetching live data...</p>
            ) : isOpen ? (
              <p className="text-white/15 text-[8px]">Waiting for round end</p>
            ) : (
              <p className="text-white/10 text-[8px]">Inactive</p>
            )}
            {isSettled && game.source_data && (
              <p className="text-white/10 text-[7px] font-mono mt-1 truncate">src: {game.source_data.split('|')[0]}</p>
            )}
          </div>

          {/* Payout Bot */}
          <div className={`px-2.5 py-2 rounded-lg border ${
            isSettled && game.settlement_tx_hashes?.length > 0 ? 'bg-emerald-500/8 border-emerald-500/20' :
            isSettled ? 'bg-amber-500/8 border-amber-500/20' :
            'bg-white/[0.02] border-white/[0.05]'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Send className={`w-3 h-3 ${
                isSettled && game.settlement_tx_hashes?.length > 0 ? 'text-emerald-400' :
                isSettled ? 'text-amber-400' : 'text-white/20'
              }`} />
              <span className={`text-[8px] font-black uppercase tracking-wider ${
                isSettled && game.settlement_tx_hashes?.length > 0 ? 'text-emerald-400' :
                isSettled ? 'text-amber-400' : 'text-white/20'
              }`}>Payout Bot</span>
            </div>
            {isSettled && game.settlement_tx_hashes?.length > 0 ? (
              <div>
                <span className="text-emerald-400 text-[10px] font-black">
                  {game.settlement_tx_hashes.length} TX sent
                </span>
                <p className="text-white/15 text-[7px] mt-0.5">
                  Pool: {total.toFixed(2)} KAS · 0% fee
                </p>
              </div>
            ) : isSettled ? (
              <p className="text-amber-400/60 text-[8px]">Processing payouts...</p>
            ) : isOpen ? (
              <p className="text-white/15 text-[8px]">Escrow collecting bets</p>
            ) : (
              <p className="text-white/10 text-[8px]">Inactive</p>
            )}
          </div>
        </div>

        {/* Result banner for settled */}
        {isSettled && (
          <div className={`mb-2.5 px-3 py-2 rounded-xl border text-center ${
            game.result === 'yes' ? 'bg-emerald-500/10 border-emerald-500/25' :
            game.result === 'no' ? 'bg-red-500/10 border-red-500/25' :
            'bg-white/5 border-white/10'
          }`}>
            <span className={`text-xs font-black ${
              game.result === 'yes' ? 'text-emerald-400' : game.result === 'no' ? 'text-red-400' : 'text-white/50'
            }`}>
              {game.result === 'yes' ? `✓ ${game.yes_label}` : game.result === 'no' ? `✓ ${game.no_label}` : 'PUSH — Refunded'}
            </span>
          </div>
        )}

        {/* Bet Ledger Button */}
        <button
          onClick={() => setShowLedgerModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white/30 hover:text-white/60 text-[10px] font-bold mb-2.5 transition-all w-full justify-center"
        >
          <Eye className="w-3 h-3" />
          Show Bet Ledger ({(game.yes_count || 0) + (game.no_count || 0)})
        </button>

        <BetLedgerModal
          show={showLedgerModal}
          onClose={() => setShowLedgerModal(false)}
          game={game}
          bets={allBets}
        />

        {/* My bets */}
        {myBets.length > 0 && (
          <div className="mb-2.5 space-y-1">
            {myBets.map(bet => (
              <div key={bet.id} className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                bet.status === 'won' ? 'bg-emerald-500/10 border-emerald-500/25' :
                bet.status === 'lost' ? 'bg-red-500/10 border-red-500/25' :
                'bg-white/5 border-white/10'
              }`}>
                <div>
                  <span className="text-white/50 text-[9px]">You: </span>
                  <span className={`text-[10px] font-bold ${bet.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bet.side.toUpperCase()} — {bet.amount_kas} KAS
                  </span>
                </div>
                <div>
                  {bet.status === 'won' && <span className="text-emerald-400 text-[10px] font-bold">+{bet.payout_kas?.toFixed(2)}</span>}
                  {bet.status === 'lost' && <span className="text-red-400 text-[10px] font-bold">Lost</span>}
                  {bet.status === 'confirmed' && <span className="text-blue-400 text-[9px] font-bold">Active</span>}
                  {bet.status === 'refunded' && <span className="text-amber-400 text-[10px] font-bold">Refunded</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bet buttons */}
        {isOpen && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBet(game, 'yes')}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all text-center"
            >
              <span className="text-emerald-400 text-sm font-black block">YES {yesPct}¢</span>
              <span className="text-emerald-400/40 text-[8px] font-medium block">{game.yes_label}</span>
            </button>
            <button
              onClick={() => onBet(game, 'no')}
              className="py-2.5 px-3 rounded-xl bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/40 transition-all text-center"
            >
              <span className="text-red-400 text-sm font-black block">NO {100 - yesPct}¢</span>
              <span className="text-red-400/40 text-[8px] font-medium block">{game.no_label}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-white/10" />
            <span className="text-white/15 text-[8px]">{(game.yes_count || 0) + (game.no_count || 0)} bettors</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-white/10" />
            <span className="text-white/15 text-[8px]">{total.toFixed(2)} KAS pool</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}