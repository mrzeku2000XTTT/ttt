import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveScoreTicker({ onGameClick }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchScores = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await base44.functions.invoke('getNBAScores', {});
      if (res.data?.games?.length) {
        setGames(res.data.games);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Ticker fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(() => fetchScores(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const liveGames = games.filter(g => g.status === 'live');
  const finalGames = games.filter(g => g.status === 'final');
  const scheduledGames = games.filter(g => g.status === 'scheduled');

  if (loading && games.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
        <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
        <span className="text-white/40 text-[10px]">Loading scores...</span>
      </div>
    );
  }

  if (games.length === 0) return null;

  return (
    <div className="w-full space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {liveGames.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-[9px] font-bold uppercase tracking-widest">
                {liveGames.length} Live
              </span>
            </div>
          )}
          <span className="text-white/30 text-[9px]">
            {games.length} games
          </span>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 text-white/20" />
            <span className="text-white/20 text-[9px]">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <div className="space-y-1">
          {liveGames.map(g => (
            <GameRow key={g.id} game={g} variant="live" onClick={onGameClick} />
          ))}
        </div>
      )}

      {/* Final Games */}
      {finalGames.length > 0 && (
        <div className="space-y-1">
          {finalGames.map(g => (
            <GameRow key={g.id} game={g} variant="final" onClick={onGameClick} />
          ))}
        </div>
      )}

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <div className="space-y-1">
          {scheduledGames.map(g => (
            <GameRow key={g.id} game={g} variant="scheduled" onClick={onGameClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameRow({ game, variant, onClick }) {
  const g = game;
  const isLive = variant === 'live';
  const isFinal = variant === 'final';

  const handleClick = () => {
    if (!onClick) return;
    if (isLive) {
      onClick(`Analyze ${g.teamA} vs ${g.teamB} — LIVE score: ${g.scoreA}-${g.scoreB} (${g.statusDetail}). Provide pace metrics, projected total, momentum analysis, and who's likely to win from here.`);
    } else if (isFinal) {
      onClick(`Analyze ${g.teamA} ${g.scoreA} - ${g.scoreB} ${g.teamB} — FINAL. Post-game breakdown: key stats, standout performers, and what this means for standings.`);
    } else {
      onClick(`Preview ${g.teamA} vs ${g.teamB} — scheduled for ${g.statusDetail}. Provide matchup analysis, key players, pace projections, and over/under prediction.`);
    }
  };

  return (
    <motion.button
      layout
      onClick={handleClick}
      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all group ${
        isLive
          ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
          : isFinal
          ? 'bg-white/5 border border-white/10 hover:bg-white/10'
          : 'bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10'
      }`}
    >
      {/* Team A */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {g.teamALogo && <img src={g.teamALogo} alt="" className="w-4 h-4 flex-shrink-0" />}
        <span className="text-white text-[11px] font-semibold truncate">{g.teamAShort}</span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center flex-shrink-0 min-w-[60px]">
        {(isLive || isFinal) ? (
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={g.scoreA}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                className={`text-xs font-bold tabular-nums ${isLive ? 'text-white' : 'text-white/70'}`}
              >
                {g.scoreA}
              </motion.span>
            </AnimatePresence>
            <span className="text-white/30 text-[10px]">-</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={g.scoreB}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                className={`text-xs font-bold tabular-nums ${isLive ? 'text-white' : 'text-white/70'}`}
              >
                {g.scoreB}
              </motion.span>
            </AnimatePresence>
          </div>
        ) : (
          <span className="text-orange-400/70 text-[10px] font-medium">{g.statusDetail}</span>
        )}
        <span className={`text-[8px] font-semibold uppercase tracking-wider mt-0.5 ${
          isLive ? 'text-red-400' : isFinal ? 'text-white/30' : 'text-orange-400/50'
        }`}>
          {isLive ? g.statusDetail : isFinal ? 'FINAL' : ''}
        </span>
      </div>

      {/* Team B */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-white text-[11px] font-semibold truncate">{g.teamBShort}</span>
        {g.teamBLogo && <img src={g.teamBLogo} alt="" className="w-4 h-4 flex-shrink-0" />}
      </div>
    </motion.button>
  );
}