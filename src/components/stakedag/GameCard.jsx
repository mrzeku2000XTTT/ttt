import React from "react";
import { motion } from "framer-motion";

export default function GameCard({ game, onSelectBet, isLive }) {
  const isBettable = game.status === 'scheduled';

  // Generate deterministic odds from game id
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-white/[0.06] backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300"
    >
      {/* Glow accent */}
      {game.status === 'live' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      )}
      {isBettable && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="p-4">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {game.status === 'live' ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded-full">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-[10px] font-bold tracking-wide">{game.statusDetail}</span>
              </div>
            ) : game.status === 'final' ? (
              <span className="text-white/30 text-[10px] font-semibold tracking-wider uppercase">Final</span>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-emerald-400/80 text-[10px] font-medium">{game.statusDetail}</span>
              </div>
            )}
          </div>
          {game.broadcast && (
            <span className="text-white/15 text-[9px] font-medium bg-white/[0.03] px-2 py-0.5 rounded-full">{game.broadcast}</span>
          )}
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-3 mb-4">
          {/* Team A */}
          <div className="flex-1 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {game.teamALogo ? (
                <img src={game.teamALogo} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-white/30 text-xs font-bold">{game.teamAShort}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{game.teamAShort || game.teamA}</p>
              <p className="text-white/25 text-[10px]">Away</p>
            </div>
          </div>

          {/* Score / VS */}
          <div className="flex-shrink-0 px-3">
            {(game.status === 'live' || game.status === 'final') ? (
              <div className="flex items-center gap-2.5">
                <span className="text-white text-2xl font-black tabular-nums tracking-tight">{game.scoreA}</span>
                <div className="w-4 h-[1px] bg-white/10" />
                <span className="text-white text-2xl font-black tabular-nums tracking-tight">{game.scoreB}</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <span className="text-white/20 text-[10px] font-bold tracking-widest">VS</span>
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 flex items-center gap-3 justify-end">
            <div className="text-right min-w-0">
              <p className="text-white font-bold text-sm truncate">{game.teamBShort || game.teamB}</p>
              <p className="text-white/25 text-[10px]">Home</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {game.teamBLogo ? (
                <img src={game.teamBLogo} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-white/30 text-xs font-bold">{game.teamBShort}</span>
              )}
            </div>
          </div>
        </div>

        {/* Bet Options */}
        {isBettable && (
          <div className="pt-3 border-t border-white/[0.04]">
            <div className="grid grid-cols-3 gap-1 mb-1.5">
              <span className="text-center text-white/20 text-[8px] uppercase tracking-[0.15em] font-semibold">Moneyline</span>
              <span className="text-center text-white/20 text-[8px] uppercase tracking-[0.15em] font-semibold">Spread</span>
              <span className="text-center text-white/20 text-[8px] uppercase tracking-[0.15em] font-semibold">Total</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 2, 4].map(startIdx => (
                <div key={startIdx} className="space-y-1.5">
                  {[betOptions[startIdx], betOptions[startIdx + 1]].map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => onSelectBet({ ...opt, game })}
                      className="w-full py-2.5 px-2 bg-white/[0.03] hover:bg-emerald-500/15 border border-white/[0.06] hover:border-emerald-500/30 rounded-xl transition-all duration-200 text-center group/btn"
                    >
                      <span className="text-white/70 text-[10px] font-semibold block group-hover/btn:text-emerald-300 transition-colors">{opt.label}</span>
                      <span className="text-white/25 text-[9px] block mt-0.5">{opt.detail}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isBettable && game.status !== 'final' && (
          <div className="pt-3 border-t border-white/[0.04] text-center">
            <span className="text-white/15 text-[10px]">Live betting coming soon</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}