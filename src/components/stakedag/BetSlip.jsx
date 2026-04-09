import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Wallet, Loader2, Check, AlertTriangle, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function BetSlip({ selections, onRemove, onClearAll, onPlaceBet, walletAddress, walletBalance, placing }) {
  const [wagerAmounts, setWagerAmounts] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  if (selections.length === 0) return null;

  const setWager = (idx, val) => setWagerAmounts(prev => ({ ...prev, [idx]: val }));
  const getWager = (idx) => parseFloat(wagerAmounts[idx]) || 0;
  const getPayout = (idx, odds) => (getWager(idx) * odds).toFixed(2);
  const totalWager = selections.reduce((sum, _, i) => sum + getWager(i), 0);
  const totalPayout = selections.reduce((sum, s, i) => sum + (getWager(i) * s.odds), 0);

  const handlePlaceBets = () => {
    if (!walletAddress) { toast.error("Connect your wallet first"); return; }
    const bets = selections.map((s, i) => ({
      ...s,
      wager_kas: getWager(i),
      potential_payout_kas: parseFloat(getPayout(i, s.odds))
    })).filter(b => b.wager_kas > 0);
    if (bets.length === 0) { toast.error("Enter a wager amount"); return; }
    if (totalWager > walletBalance) { toast.error("Insufficient balance"); return; }
    onPlaceBet(bets);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[80] bg-zinc-950/98 backdrop-blur-2xl border-t border-emerald-500/20 rounded-t-3xl shadow-[0_-20px_60px_rgba(16,185,129,0.08)] max-h-[70vh] overflow-y-auto"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1">
        <button onClick={() => setCollapsed(!collapsed)} className="w-10 h-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors" />
      </div>

      {/* Header */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <ChevronUp className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </div>
          <h3 className="text-white font-bold text-sm">Bet Slip</h3>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">{selections.length}</span>
        </div>
        <button onClick={onClearAll} className="text-white/25 hover:text-red-400 text-[10px] font-medium transition-colors">Clear All</button>
      </div>

      {!collapsed && (
        <>
          {/* Selections */}
          <div className="px-5 pb-3 space-y-2.5">
            {selections.map((sel, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{sel.pick}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">
                      {sel.type === 'moneyline' ? 'Moneyline' : sel.type === 'spread' ? `Spread ${sel.detail}` : `${sel.pick} ${sel.detail}`}
                      <span className="text-white/15"> · </span>{sel.game.teamAShort} vs {sel.game.teamBShort}
                    </p>
                    <div className="mt-1.5 inline-flex px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                      <span className="text-emerald-400 text-[10px] font-bold">{sel.detail} ({sel.odds.toFixed(2)}x)</span>
                    </div>
                  </div>
                  <button onClick={() => onRemove(idx)} className="text-white/15 hover:text-red-400 transition-colors p-1 -mr-1 -mt-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={wagerAmounts[idx] || ''}
                      onChange={e => setWager(idx, e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black/30 border border-white/[0.06] focus:border-emerald-500/40 rounded-xl px-3 py-2.5 text-white text-sm pr-12 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-semibold">KAS</span>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-white/20 text-[8px] uppercase tracking-widest">Payout</p>
                    <p className="text-emerald-400 text-xs font-bold">{getPayout(idx, sel.odds)}</p>
                  </div>
                </div>

                <div className="flex gap-1 mt-2">
                  {[1, 5, 10, 25, 50, 100].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setWager(idx, amt.toString())}
                      className="flex-1 py-1.5 bg-white/[0.02] hover:bg-emerald-500/10 border border-white/[0.04] hover:border-emerald-500/20 rounded-lg text-[10px] text-white/30 hover:text-emerald-300 font-medium transition-all"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-5 pt-3 pb-2 border-t border-white/[0.04]">
        {!walletAddress && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-amber-300/60 text-[10px] font-medium">Connect wallet to place bets</span>
          </div>
        )}

        {walletAddress && (
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-3 h-3 text-emerald-400/50" />
            <span className="text-white/25 text-[10px] font-mono">{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</span>
            <span className="text-emerald-400/70 text-[10px] font-bold ml-auto">{walletBalance.toFixed(2)} KAS</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/20 text-[8px] uppercase tracking-widest">Total Wager</p>
            <p className="text-white font-bold text-base">{totalWager.toFixed(2)} <span className="text-white/30 text-xs">KAS</span></p>
          </div>
          <div className="text-right">
            <p className="text-white/20 text-[8px] uppercase tracking-widest">Potential Payout</p>
            <p className="text-emerald-400 font-bold text-base">{totalPayout.toFixed(2)} <span className="text-emerald-400/50 text-xs">KAS</span></p>
          </div>
        </div>

        <button
          onClick={handlePlaceBets}
          disabled={placing || totalWager === 0 || !walletAddress}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-30 disabled:from-zinc-700 disabled:to-zinc-700 rounded-2xl text-black font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
        >
          {placing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Placing...</>
          ) : (
            <><Check className="w-4 h-4" /> Place Bet — {totalWager.toFixed(2)} KAS</>
          )}
        </button>
      </div>
    </motion.div>
  );
}