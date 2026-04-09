import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function BetSlip({ selections, onRemove, onClearAll, onPlaceBet, walletAddress, walletBalance, placing }) {
  const [wagerAmounts, setWagerAmounts] = useState({});

  if (selections.length === 0) return null;

  const setWager = (idx, val) => {
    setWagerAmounts(prev => ({ ...prev, [idx]: val }));
  };

  const getWager = (idx) => parseFloat(wagerAmounts[idx]) || 0;
  const getPayout = (idx, odds) => (getWager(idx) * odds).toFixed(2);
  const totalWager = selections.reduce((sum, _, i) => sum + getWager(i), 0);
  const totalPayout = selections.reduce((sum, s, i) => sum + (getWager(i) * s.odds), 0);

  const handlePlaceBets = () => {
    if (!walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    const bets = selections.map((s, i) => ({
      ...s,
      wager_kas: getWager(i),
      potential_payout_kas: parseFloat(getPayout(i, s.odds))
    })).filter(b => b.wager_kas > 0);

    if (bets.length === 0) {
      toast.error("Enter a wager amount");
      return;
    }
    if (totalWager > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }
    onPlaceBet(bets);
  };

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[80] bg-zinc-950/95 backdrop-blur-2xl border-t border-emerald-500/30 rounded-t-3xl shadow-2xl shadow-emerald-500/10 max-h-[70vh] overflow-y-auto"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-xl z-10 px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <h3 className="text-white font-bold text-sm">Bet Slip</h3>
            <span className="text-white/40 text-xs">({selections.length})</span>
          </div>
          <button onClick={onClearAll} className="text-white/30 hover:text-red-400 text-xs transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* Selections */}
      <div className="px-4 py-3 space-y-3">
        {selections.map((sel, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-white text-xs font-semibold">{sel.pick}</p>
                <p className="text-white/40 text-[10px]">
                  {sel.type === 'moneyline' ? 'Moneyline' : sel.type === 'spread' ? `Spread ${sel.detail}` : `${sel.pick} ${sel.detail}`}
                  {' · '}{sel.game.teamA} vs {sel.game.teamB}
                </p>
                <p className="text-emerald-400 text-[10px] font-bold mt-1">Odds: {sel.detail} ({sel.odds.toFixed(3)}x)</p>
              </div>
              <button onClick={() => onRemove(idx)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wager input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={wagerAmounts[idx] || ''}
                  onChange={e => setWager(idx, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm pr-12 focus:outline-none focus:border-emerald-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">KAS</span>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[9px]">Payout</p>
                <p className="text-emerald-400 text-xs font-bold">{getPayout(idx, sel.odds)} KAS</p>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-1 mt-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setWager(idx, amt.toString())}
                  className="flex-1 py-1 bg-white/5 hover:bg-emerald-500/15 border border-white/10 rounded-md text-[10px] text-white/50 hover:text-emerald-300 transition-all"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-4 py-3">
        {walletAddress ? (
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-3 h-3 text-emerald-400" />
            <span className="text-white/40 text-[10px]">{walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</span>
            <span className="text-emerald-400 text-[10px] font-bold ml-auto">{walletBalance.toFixed(2)} KAS</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-300/80 text-[10px]">Connect wallet to place bets</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/40 text-[10px]">Total Wager</p>
            <p className="text-white font-bold text-sm">{totalWager.toFixed(2)} KAS</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[10px]">Potential Payout</p>
            <p className="text-emerald-400 font-bold text-sm">{totalPayout.toFixed(2)} KAS</p>
          </div>
        </div>

        <button
          onClick={handlePlaceBets}
          disabled={placing || totalWager === 0 || !walletAddress}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:from-gray-600 disabled:to-gray-600 rounded-xl text-black font-black text-sm transition-all flex items-center justify-center gap-2"
        >
          {placing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Placing Bet...</>
          ) : (
            <><Check className="w-4 h-4" /> Place Bet — {totalWager.toFixed(2)} KAS</>
          )}
        </button>
      </div>
    </motion.div>
  );
}