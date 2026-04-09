import React from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, ArrowRight } from "lucide-react";

export default function GameCard({ game, onSelectBet, isLive }) {
  const statusColor = game.status === 'live' ? 'text-red-400' : game.status === 'final' ? 'text-white/40' : 'text-emerald-400';
  const statusBg = game.status === 'live' ? 'bg-red-500/10 border-red-500/30' : game.status === 'final' ? 'bg-white/5 border-white/10' : 'bg-emerald-500/10 border-emerald-500/30';
  const isBettable = game.status === 'scheduled';

  // Generate fake but realistic odds based on game id hash
  const hash = (game.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const homeSpread = ((hash % 13) - 6.5).toFixed(1);
  const awaySpread = (parseFloat(homeSpread) * -1).toFixed(1);
  const total = (210 + (hash % 30) + 0.5).toFixed(1);
  const homeMl = parseFloat(homeSpread) < 0 ? `-${110 + (hash % 40)}` : `+${120 + (hash % 50)}`;
  const awayMl = parseFloat(homeSpread) < 0 ? `+${120 + (hash % 50)}` : `-${110 + (hash % 40)}`;

  const americanToDecimal = (american) => {
    const val = parseInt(american);
    return val > 0 ? (val / 100) + 1 : (100 / Math.abs(val)) + 1;
  };

  const betOptions = [
    { type: 'moneyline', pick: game.teamA, detail: awayMl, odds: americanToDecimal(awayMl), label: game.teamAShort },
    { type: 'moneyline', pick: game.teamB, detail: homeMl, odds: americanToDecimal(homeMl), label: game.teamBShort },
    { type: 'spread', pick: game.teamA, detail: `${awaySpread}`, odds: 1.909, label: `${game.teamAShort} ${awaySpread}` },
    { type: 'spread', pick: game.teamB, detail: `${homeSpread}`, odds: 1.909, label: `${game.teamBShort} ${homeSpread}` },
    { type: 'over_under', pick: 'Over', detail: total, odds: 1.909, label: `O ${total}` },
    { type: 'over_under', pick: 'Under', detail: total, odds: 1.909, label: `U ${total}` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${statusBg} transition-all`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {game.status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>
            {game.status === 'live' ? `LIVE · ${game.statusDetail}` : game.status === 'final' ? 'FINAL' : game.statusDetail}
          </span>
        </div>
        {game.broadcast && <span className="text-white/20 text-[9px]">{game.broadcast}</span>}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {game.teamALogo && <img src={game.teamALogo} alt="" className="w-8 h-8" />}
          <div>
            <p className="text-white font-bold text-sm">{game.teamA}</p>
            <p className="text-white/30 text-[10px]">Away</p>
          </div>
        </div>
        <div className="flex flex-col items-center px-4">
          {(game.status === 'live' || game.status === 'final') ? (
            <div className="flex items-center gap-3">
              <span className="text-white text-xl font-black tabular-nums">{game.scoreA}</span>
              <span className="text-white/30 text-sm">-</span>
              <span className="text-white text-xl font-black tabular-nums">{game.scoreB}</span>
            </div>
          ) : (
            <span className="text-white/30 text-xs">VS</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <p className="text-white font-bold text-sm">{game.teamB}</p>
            <p className="text-white/30 text-[10px]">Home</p>
          </div>
          {game.teamBLogo && <img src={game.teamBLogo} alt="" className="w-8 h-8" />}
        </div>
      </div>

      {/* Bet Options Grid */}
      {isBettable && (
        <div>
          <div className="grid grid-cols-6 gap-1 mb-1">
            <span className="col-span-2 text-center text-white/30 text-[9px] uppercase tracking-widest">Moneyline</span>
            <span className="col-span-2 text-center text-white/30 text-[9px] uppercase tracking-widest">Spread</span>
            <span className="col-span-2 text-center text-white/30 text-[9px] uppercase tracking-widest">Total</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {betOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelectBet({ ...opt, game })}
                className="py-2 px-1 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-lg transition-all text-center group"
              >
                <span className="text-white/70 text-[10px] block group-hover:text-emerald-300">{opt.label}</span>
                <span className="text-white/40 text-[9px] block">{opt.detail}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isBettable && (
        <div className="text-center py-1">
          <span className="text-white/20 text-[10px]">
            {game.status === 'live' ? 'Live betting coming soon' : 'Game completed'}
          </span>
        </div>
      )}
    </motion.div>
  );
}