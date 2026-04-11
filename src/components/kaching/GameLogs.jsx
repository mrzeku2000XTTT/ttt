import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GameLogs({ show, onClose }) {
  const [games, setGames] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (show) loadData();
  }, [show]);

  const loadData = async () => {
    setLoading(true);
    try {
      const g = await base44.entities.PredictionGame.list('-created_date', 30);
      setGames(g);
    } catch {}
    setLoading(false);
  };

  const loadBetsForGame = async (game) => {
    setSelectedGame(game);
    try {
      const b = await base44.entities.GameBet.filter({ game_id: game.id }, '-created_date', 50);
      setBets(b);
    } catch {}
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[95] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-white font-black text-sm">Game Logs</h2>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="text-white/30 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && games.length === 0 && (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          )}

          {!selectedGame ? (
            games.map(g => {
              const statusColor = g.status === 'settled' ? 'text-emerald-400' : g.status === 'open' ? 'text-blue-400' : 'text-amber-400';
              return (
                <button
                  key={g.id}
                  onClick={() => loadBetsForGame(g)}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-emerald-400 text-[10px] font-mono font-bold">#{g.game_number}</span>
                    <span className={`text-[9px] font-bold uppercase ${statusColor}`}>{g.status}</span>
                  </div>
                  <p className="text-white text-xs font-bold">{g.question}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-white/20 text-[9px]">Pool: {g.total_pool_kas || 0} KAS</span>
                    {g.result && (
                      <span className={`text-[9px] font-bold ${g.result === 'yes' ? 'text-emerald-400' : g.result === 'no' ? 'text-red-400' : 'text-white/40'}`}>
                        Result: {g.result.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {g.judge_reason && <p className="text-white/15 text-[8px] mt-1 truncate">{g.judge_reason}</p>}
                </button>
              );
            })
          ) : (
            <>
              <button onClick={() => { setSelectedGame(null); setBets([]); }} className="text-emerald-400 text-xs font-bold mb-2">← Back to games</button>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
                <p className="text-emerald-400 text-[10px] font-mono">#{selectedGame.game_number}</p>
                <p className="text-white text-sm font-bold">{selectedGame.question}</p>
                <div className="flex gap-4 mt-2 text-[10px]">
                  <span className="text-emerald-400">YES: {selectedGame.yes_pool_kas || 0} KAS ({selectedGame.yes_count || 0})</span>
                  <span className="text-red-400">NO: {selectedGame.no_pool_kas || 0} KAS ({selectedGame.no_count || 0})</span>
                </div>
                {selectedGame.result && (
                  <p className="text-amber-400 text-[10px] font-bold mt-1">Result: {selectedGame.result.toUpperCase()} — {selectedGame.judge_reason}</p>
                )}
                <p className="text-white/15 text-[8px] mt-1 font-mono">Escrow: kaspa:{selectedGame.escrow_address?.slice(0, 20)}...</p>
              </div>

              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Bets ({bets.length})</p>
              {bets.length === 0 && <p className="text-white/15 text-xs py-4 text-center">No bets for this game</p>}
              {bets.map(b => (
                <div key={b.id} className={`p-2.5 rounded-lg border ${
                  b.status === 'won' ? 'bg-emerald-500/8 border-emerald-500/20' :
                  b.status === 'lost' ? 'bg-red-500/8 border-red-500/20' :
                  'bg-white/[0.02] border-white/[0.06]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black ${b.side === 'yes' ? 'text-emerald-400' : 'text-red-400'}`}>{b.side.toUpperCase()}</span>
                    <span className={`text-[9px] font-bold ${
                      b.status === 'won' ? 'text-emerald-400' : b.status === 'lost' ? 'text-red-400' : 'text-blue-400'
                    }`}>{b.status.toUpperCase()}</span>
                  </div>
                  <p className="text-white/40 text-[9px] font-mono truncate">kaspa:{b.user_wallet_address?.slice(0, 24)}...</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white text-[10px] font-bold">{b.amount_kas} KAS</span>
                    {b.payout_kas > 0 && <span className="text-emerald-400 text-[10px] font-bold">+{b.payout_kas.toFixed(2)} KAS</span>}
                  </div>
                  {b.tx_hash_in && (
                    <a
                      href={`https://explorer.kaspa.org/txs/${b.tx_hash_in}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400/40 text-[8px] font-mono flex items-center gap-1 mt-1 hover:text-blue-400"
                    >
                      TX: {b.tx_hash_in.slice(0, 24)}... <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}