import React from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ArrowRight, Trophy } from "lucide-react";
import moment from "moment";

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/15', label: 'Pending' },
  active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/15', label: 'Active' },
  won: { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15', label: 'Won' },
  lost: { icon: X, color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/15', label: 'Lost' },
  push: { icon: ArrowRight, color: 'text-white/50', bg: 'bg-white/[0.03] border-white/[0.06]', label: 'Push' },
  paid_out: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15', label: 'Paid Out' },
  cancelled: { icon: X, color: 'text-white/30', bg: 'bg-white/[0.03] border-white/[0.06]', label: 'Cancelled' },
};

export default function BetHistory({ bets, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-6 h-6 text-white/10" />
        </div>
        <p className="text-white/30 text-sm font-medium">No bets yet</p>
        <p className="text-white/15 text-xs mt-1">Pick a game to start</p>
      </div>
    );
  }

  const stats = {
    total: bets.length,
    won: bets.filter(b => b.status === 'won' || b.status === 'paid_out').length,
    lost: bets.filter(b => b.status === 'lost').length,
    totalWagered: bets.reduce((s, b) => s + (b.wager_kas || 0), 0),
    totalWon: bets.filter(b => b.status === 'won' || b.status === 'paid_out').reduce((s, b) => s + (b.potential_payout_kas || 0), 0),
  };
  const winRate = (stats.won + stats.lost) > 0 ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Win Rate', value: `${winRate}%`, color: parseFloat(winRate) >= 50 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Wagered', value: `${stats.totalWagered.toFixed(0)}`, color: 'text-white/60' },
          { label: 'Won', value: `${stats.totalWon.toFixed(0)}`, color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-center">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/20 text-[8px] uppercase tracking-[0.15em] font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bets */}
      <div className="space-y-2">
        {bets.map((bet, i) => {
          const cfg = statusConfig[bet.status] || statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className={`border rounded-2xl p-3.5 ${cfg.bg} transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${cfg.color.replace('text-', 'bg-').replace('400', '500/15')}`}>
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className="text-white/15 text-[9px] font-medium">{moment(bet.created_date).fromNow()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-bold">{bet.pick}</p>
                  <p className="text-white/25 text-[10px] mt-0.5">
                    {bet.bet_type === 'moneyline' ? 'ML' : bet.bet_type === 'spread' ? `Spread ${bet.pick_detail}` : `${bet.pick} ${bet.pick_detail}`}
                    <span className="text-white/10"> · </span>{bet.team_a_short || bet.team_a} vs {bet.team_b_short || bet.team_b}
                  </p>
                  {bet.final_score_a != null && (
                    <p className="text-white/20 text-[9px] mt-1 font-mono">Final: {bet.final_score_a} – {bet.final_score_b}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[10px] font-medium">{bet.wager_kas} KAS</p>
                  <p className={`text-sm font-black mt-0.5 ${bet.status === 'won' || bet.status === 'paid_out' ? 'text-emerald-400' : bet.status === 'lost' ? 'text-red-400' : 'text-white/30'}`}>
                    {bet.status === 'won' || bet.status === 'paid_out' ? `+${bet.potential_payout_kas}` : bet.status === 'lost' ? `-${bet.wager_kas}` : `→ ${bet.potential_payout_kas}`} KAS
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}