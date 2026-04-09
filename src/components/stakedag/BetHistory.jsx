import React from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, ArrowRight, Trophy } from "lucide-react";
import moment from "moment";

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Pending' },
  active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'Active' },
  won: { icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Won' },
  lost: { icon: X, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Lost' },
  push: { icon: ArrowRight, color: 'text-white/60', bg: 'bg-white/5 border-white/10', label: 'Push' },
  paid_out: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Paid Out' },
  cancelled: { icon: X, color: 'text-white/40', bg: 'bg-white/5 border-white/10', label: 'Cancelled' },
};

export default function BetHistory({ bets, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm">No bets yet</p>
        <p className="text-white/15 text-xs mt-1">Pick a game and place your first prediction</p>
      </div>
    );
  }

  const stats = {
    total: bets.length,
    won: bets.filter(b => b.status === 'won' || b.status === 'paid_out').length,
    lost: bets.filter(b => b.status === 'lost').length,
    pending: bets.filter(b => b.status === 'pending' || b.status === 'active').length,
    totalWagered: bets.reduce((s, b) => s + (b.wager_kas || 0), 0),
    totalWon: bets.filter(b => b.status === 'won' || b.status === 'paid_out').reduce((s, b) => s + (b.potential_payout_kas || 0), 0),
  };
  const winRate = stats.total > 0 ? ((stats.won / (stats.won + stats.lost)) * 100 || 0).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Bets', value: stats.total, color: 'text-white' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-emerald-400' },
          { label: 'Wagered', value: `${stats.totalWagered.toFixed(1)}`, color: 'text-white/70' },
          { label: 'Won', value: `${stats.totalWon.toFixed(1)}`, color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/30 text-[9px] uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bets list */}
      <div className="space-y-2">
        {bets.map((bet, i) => {
          const cfg = statusConfig[bet.status] || statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-xl p-3 ${cfg.bg}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className="text-white/20 text-[9px]">{moment(bet.created_date).fromNow()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-semibold">{bet.pick}</p>
                  <p className="text-white/40 text-[10px]">
                    {bet.bet_type === 'moneyline' ? 'ML' : bet.bet_type === 'spread' ? `Spread ${bet.pick_detail}` : `${bet.pick} ${bet.pick_detail}`}
                    {' · '}{bet.team_a_short || bet.team_a} vs {bet.team_b_short || bet.team_b}
                  </p>
                  {bet.final_score_a != null && (
                    <p className="text-white/30 text-[9px] mt-0.5">Final: {bet.final_score_a} - {bet.final_score_b}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-[10px]">{bet.wager_kas} KAS</p>
                  <p className={`text-xs font-bold ${bet.status === 'won' || bet.status === 'paid_out' ? 'text-emerald-400' : 'text-white/30'}`}>
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