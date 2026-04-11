import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Zap, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import GameTimer from "./GameTimer";

export default function LiveGameCard({ game, userBets, onBet }) {
  const [copied, setCopied] = useState(false);
  const [allBets, setAllBets] = useState([]);
  const isOpen = game.status === 'open' && new Date(game.end_time) > new Date();
  const isSettled = game.status === 'settled';
  const myBets = userBets?.filter(b => b.game_id === game.id) || [];
  const myTotalKas = myBets.reduce((s, b) => s + b.amount_kas, 0);
  const myWinnings = myBets.reduce((s, b) => s + (b.payout_kas || 0), 0);

  // Load all verified bets for this game
  useEffect(() => {
    base44.entities.GameBet.filter({ game_id: game.id, status: 'confirmed' }, '-created_date', 50)
      .then(setAllBets)
      .catch(() => {});
  }, [game.id, game.total_pool_kas]);

  const copyGameId = () => {
    navigator.clipboard.writeText(`kaspa:${game.escrow_address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Escrow address copied');
  };

  const yesTotal = game.yes_pool_kas || 0;
  const noTotal = game.no_pool_kas || 0;
  const total = yesTotal + noTotal;
  const yesPct = total > 0 ? Math.round((yesTotal / total) * 100) : 50;
  const noPct = 100 - yesPct;

  const botColor = game.bot_status === 'ready' ? 'bg-emerald-400' : game.bot_status === 'processing' ? 'bg-amber-400' : 'bg-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/[0.06] backdrop-blur-sm"
    >
      {isOpen && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />}
      
      <div className="p-4">
        {/* Header: Game # + Bot status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyGameId}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all"
            >
              <span className="text-emerald-400 text-[10px] font-mono font-bold">#{game.game_number}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30" />}
            </button>
            <span className="text-white/15 text-[9px] font-medium">{game.category} · {game.subcategory}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${botColor} ${game.bot_status === 'ready' ? 'animate-pulse' : ''}`} />
            <span className="text-white/30 text-[9px] font-medium">Bot {game.bot_status || 'ready'}</span>
          </div>
        </div>

        {/* Question */}
        <p className="text-white font-bold text-sm leading-snug mb-3">{game.question}</p>

        {/* Timer — all open games share the same UTC 15-min round clock */}
        {isOpen && (
          <div className="mb-3">
            <GameTimer />
          </div>
        )}

        {/* Pool visualization */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-emerald-400 text-[10px] font-bold">YES {yesPct}%</span>
            <span className="text-red-400 text-[10px] font-bold">NO {noPct}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${yesPct}%` }} />
            <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${noPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/20 text-[9px]">{yesTotal.toFixed(2)} KAS · {game.yes_count || 0} bets</span>
            <span className="text-white/20 text-[9px]">{noTotal.toFixed(2)} KAS · {game.no_count || 0} bets</span>
          </div>
        </div>

        {/* Result banner */}
        {isSettled && (
          <div className={`mb-3 px-3 py-2 rounded-xl border text-center ${
            game.result === 'yes' ? 'bg-emerald-500/15 border-emerald-500/30' : 
            game.result === 'no' ? 'bg-red-500/15 border-red-500/30' : 
            'bg-white/5 border-white/10'
          }`}>
            <span className={`text-sm font-black ${
              game.result === 'yes' ? 'text-emerald-400' : game.result === 'no' ? 'text-red-400' : 'text-white/50'
            }`}>
              {game.result === 'yes' ? `✓ ${game.yes_label}` : game.result === 'no' ? `✓ ${game.no_label}` : 'PUSH — Refunded'}
            </span>
            {game.judge_reason && <p className="text-white/30 text-[9px] mt-1">{game.judge_reason}</p>}
          </div>
        )}

        {/* On-chain verified bets */}
        {allBets.length > 0 && (
          <div className="mb-3">
            <p className="text-white/20 text-[8px] font-bold uppercase tracking-wider mb-1.5">Verified Bets ({allBets.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {allBets.map(bet => (
                <div key={bet.id} className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                  bet.side === 'yes' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
                }`}>
                  <span className={`text-[9px] font-black w-6 ${
                    bet.side === 'yes' ? 'text-emerald-400' : 'text-red-400'
                  }`}>{bet.side.toUpperCase()}</span>
                  <span className="text-white/40 text-[9px] font-mono truncate flex-1">
                    kaspa:{bet.user_wallet_address?.slice(0, 12)}...
                  </span>
                  <span className="text-white font-bold text-[10px]">{bet.amount_kas} KAS</span>
                  {bet.tx_hash_in && (
                    <a
                      href={`https://explorer.kaspa.org/txs/${bet.tx_hash_in}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400/40 hover:text-blue-400 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User's own bet indicator */}
        {myBets.length > 0 && (
          <div className="mb-3 space-y-1">
            {myBets.map(bet => (
              <div key={bet.id} className={`px-3 py-1.5 rounded-lg border flex items-center justify-between ${
                bet.status === 'won' ? 'bg-emerald-500/10 border-emerald-500/25' :
                bet.status === 'lost' ? 'bg-red-500/10 border-red-500/25' :
                'bg-white/5 border-white/10'
              }`}>
                <div>
                  <span className="text-white/50 text-[10px]">Your bet: </span>
                  <span className={`text-xs font-bold ${bet.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bet.side.toUpperCase()} — {bet.amount_kas} KAS
                  </span>
                </div>
                <div>
                  {bet.status === 'won' && <span className="text-emerald-400 text-xs font-bold">+{bet.payout_kas?.toFixed(2)} KAS</span>}
                  {bet.status === 'lost' && <span className="text-red-400 text-xs font-bold">Lost</span>}
                  {bet.status === 'confirmed' && <span className="text-blue-400 text-[10px] font-bold">Active</span>}
                  {bet.status === 'refunded' && <span className="text-amber-400 text-xs font-bold">Refunded {bet.payout_kas?.toFixed(2)} KAS</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bet buttons — always show for open games */}
        {isOpen && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBet(game, 'yes')}
              className="py-3 px-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all text-center"
            >
              <span className="text-emerald-400 text-sm font-black block">YES</span>
              <span className="text-emerald-400/50 text-[9px] font-medium block mt-0.5">{game.yes_label}</span>
            </button>
            <button
              onClick={() => onBet(game, 'no')}
              className="py-3 px-3 rounded-xl bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/40 transition-all text-center"
            >
              <span className="text-red-400 text-sm font-black block">NO</span>
              <span className="text-red-400/50 text-[9px] font-medium block mt-0.5">{game.no_label}</span>
            </button>
          </div>
        )}

        {/* Pool info */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-white/15" />
            <span className="text-white/20 text-[9px] font-medium">{(game.yes_count || 0) + (game.no_count || 0)} participants</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-white/15" />
            <span className="text-white/20 text-[9px] font-medium">{total.toFixed(2)} KAS pool</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}