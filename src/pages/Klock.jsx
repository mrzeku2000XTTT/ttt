import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Loader2, Activity, TrendingUp, Target, BarChart3, Clock, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import KlockSimChart from "@/components/klock/KlockSimChart";
import LiveScoreTicker from "@/components/klock/LiveScoreTicker";

export default function KlockPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [simData, setSimData] = useState(null);
  const [todayGames, setTodayGames] = useState(null);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesFetchFailed, setGamesFetchFailed] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchTodayGames();
    // Auto-refresh scores every 30s
    const interval = setInterval(fetchTodayGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayGames = async () => {
    if (!loadingGames) setLoadingGames(true);
    setGamesFetchFailed(false);
    try {
      const res = await base44.functions.invoke('getNBAScores', {});
      const data = res.data;
      if (data?.games?.length) {
        setTodayGames(data);
      } else {
        setGamesFetchFailed(true);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
      setGamesFetchFailed(true);
    } finally {
      setLoadingGames(false);
    }
  };

  // Build live score context for AI
  const getLiveScoreContext = () => {
    if (!todayGames?.games?.length) return '';
    const lines = todayGames.games.map(g => {
      if (g.status === 'live') return `🔴 LIVE: ${g.teamA} ${g.scoreA} - ${g.scoreB} ${g.teamB} (${g.statusDetail})`;
      if (g.status === 'final') return `✅ FINAL: ${g.teamA} ${g.scoreA} - ${g.scoreB} ${g.teamB}`;
      return `⏰ ${g.teamA} vs ${g.teamB} @ ${g.statusDetail}`;
    });
    return `\n\n**LIVE ESPN SCOREBOARD (real-time data — use these exact scores):**\n${lines.join('\n')}`;
  };

  const SYSTEM_PROMPT = `You are KLOCK, an NBA Sports Data Analyst AI with LIVE ESPN score access.

CRITICAL RULES:
- You HAVE access to live game scores via ESPN data feed injected below.
- When live scores are provided, USE THEM — they are real and accurate.
- For games marked LIVE, report the exact score shown.
- For games marked FINAL, report the final score.
- For scheduled games, provide predictive analysis.
- You CAN also provide: season averages, historical matchup data, team stats, injury reports, and predictive analysis.
- Be transparent about what is live data vs. AI projection.
{
  "simData": {
    "mean": 225,
    "stdDev": 18,
    "threshold": 236.5,
    "teamA": "Team A",
    "teamB": "Team B",
    "overProb": 68
  }
}

If the user asks a non-NBA question, respond helpfully but remind them you specialize in NBA analysis. Be concise, data-driven, and confident.`;

  const submitQuery = async (text) => {
    const userMsg = (text || "").trim();
    if (!userMsg || loading) return;

    setQuery("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setSimData(null);

    try {
      const conversationContext = messages.slice(-6)
        .map(m => `${m.role === "user" ? "User" : "KLOCK"}: ${m.content}`)
        .join("\n\n");

      const liveScores = getLiveScoreContext();

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}${liveScores}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ""}User: ${userMsg}`,
        add_context_from_internet: true,
        model: "gemini_3_flash"
      });

      // Extract sim data JSON if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.simData) setSimData(parsed.simData);
        } catch {}
      }

      // Remove JSON block from displayed message
      const cleanResponse = response.replace(/```json[\s\S]*?```/g, "").trim();
      setMessages(prev => [...prev, { role: "assistant", content: cleanResponse }]);
    } catch (err) {
      console.error("Klock error:", err);
      toast.error("Failed to analyze. Try again.");
      setMessages(prev => [...prev, { role: "assistant", content: "\u26a0\ufe0f Analysis failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitQuery(query);
  };

  const quickPrompts = todayGames?.games?.length
    ? todayGames.games.slice(0, 4).map(g => {
        if (g.status === 'live') return `${g.teamA} ${g.scoreA}-${g.scoreB} ${g.teamB} — live analysis`;
        if (g.status === 'final') return `${g.teamA} ${g.scoreA}-${g.scoreB} ${g.teamB} — post-game breakdown`;
        return `${g.teamA} vs ${g.teamB} pace analysis`;
      })
    : [
        "Who's playing in the NBA tonight?",
        "Top NBA games to watch today",
        "Lakers game pace analysis",
        "Best over/under bets today"
      ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black z-10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png" alt="Klock" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-orange-500/30" />
        <div className="flex-1">
          <h1 className="text-white font-bold text-sm">Klock</h1>
          <p className="text-white/40 text-[10px]">NBA Real-Time Analyst</p>
        </div>
        <button
          onClick={() => setShowScoreboard(v => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
            showScoreboard ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5 border border-white/10'
          }`}
        >
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-[10px] font-semibold">LIVE</span>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Live Scoreboard Panel */}
        <AnimatePresence>
          {showScoreboard && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden md:flex flex-shrink-0 w-64 border-r border-white/10 bg-black/50 flex-col overflow-hidden"
            >
              <div className="px-3 py-3 border-b border-white/10">
                <h3 className="text-white text-xs font-bold uppercase tracking-widest">Scoreboard</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
                <LiveScoreTicker onGameClick={(prompt) => submitQuery(prompt)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 max-w-3xl w-full mx-auto space-y-4">

        {/* Mobile scoreboard (inline, collapsible) */}
        {showScoreboard && (
          <div className="md:hidden mb-3">
            <LiveScoreTicker onGameClick={(prompt) => submitQuery(prompt)} />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png" alt="Klock" className="w-20 h-20 rounded-3xl object-cover shadow-2xl shadow-orange-500/30" />
            <div>
              <p className="text-white font-semibold text-lg">Klock — NBA Analyst</p>
              <p className="text-white/40 text-sm mt-1">Real-time ESPN scores · Live pace analysis · Scoring predictions · Over/under simulations</p>
            </div>

            {/* Today's Games Ticker */}
            {loadingGames && !todayGames ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                <span className="text-white/40 text-xs">Fetching live NBA scores...</span>
              </div>
            ) : todayGames?.games?.length ? (
              <div className="w-full max-w-md mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">Live Scoreboard — {todayGames.games.length} Games</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {todayGames.games.map((g, i) => (
                    <button key={i} onClick={() => submitQuery(`Analyze ${g.teamA} vs ${g.teamB} — ${g.status === 'live' ? `LIVE score: ${g.scoreA}-${g.scoreB}` : g.status === 'final' ? `Final: ${g.scoreA}-${g.scoreB}` : `Scheduled: ${g.statusDetail}`}. Provide pace metrics, projected total, injury report, and strategic context.`)}
                      className="flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 rounded-xl text-left transition-all group">
                      {g.teamALogo && <img src={g.teamALogo} alt="" className="w-5 h-5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-semibold truncate">{g.teamAShort} vs {g.teamBShort}</span>
                          {(g.status === 'live' || g.status === 'final') && (
                            <span className={`text-xs font-bold ml-2 ${g.status === 'live' ? 'text-red-400' : 'text-white/60'}`}>
                              {g.scoreA} - {g.scoreB}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${
                            g.status === 'live' ? 'text-red-400' : g.status === 'final' ? 'text-white/40' : 'text-orange-400/70'
                          }`}>
                            {g.status === 'live' ? `🔴 ${g.statusDetail}` : g.status === 'final' ? 'FINAL' : g.statusDetail}
                          </span>
                          {g.broadcast && <span className="text-white/20 text-[9px]">{g.broadcast}</span>}
                        </div>
                      </div>
                      {g.teamBLogo && <img src={g.teamBLogo} alt="" className="w-5 h-5 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button onClick={fetchTodayGames}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 rounded-xl transition-all">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-300 text-sm font-semibold">{gamesFetchFailed ? 'Retry — Load Scores' : 'Load Live Scores'}</span>
                </button>
                {gamesFetchFailed && (
                  <p className="text-white/30 text-[10px]">Could not reach ESPN — tap to retry</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 w-full max-w-md mt-4">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => submitQuery(p)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/60 text-left transition-all flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    {[Target, TrendingUp, BarChart3, Zap][i] && React.createElement([Target, TrendingUp, BarChart3, Zap][i], { className: "w-3.5 h-3.5 text-orange-400" })}
                  </div>
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <p className="text-orange-300/70 text-[11px]">Live scores from ESPN · AI analysis · Auto-refreshes every 30s</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div style={{ maxWidth: "calc(100vw - 2rem)" }} className={`sm:max-w-2xl px-3 sm:px-4 py-3 rounded-2xl text-sm leading-relaxed break-words overflow-x-auto ${
                  msg.role === "user"
                    ? "bg-orange-600/30 border border-orange-500/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/90"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none break-words overflow-hidden [&>p]:my-2 [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_code]:break-all [&_code]:whitespace-pre-wrap [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/10 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_hr]:border-white/10 [&_hr]:my-3">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
              {/* Show sim chart and prediction button after assistant message with simData */}
              {msg.role === "assistant" && i === messages.length - 1 && simData && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="mt-3 max-w-2xl mx-auto space-y-3">
                  <KlockSimChart data={simData} />
                  <button
                    onClick={() => {
                      submitQuery(`Give me a deep future prediction for ${simData.teamA} vs ${simData.teamB}. Analyze from 1000+ data points including: season-long trends, player efficiency ratings, home/away splits, back-to-back fatigue, referee tendencies, pace-of-play matchups, 3-point shooting variance, free throw rates, turnover margins, clutch performance stats, quarter-by-quarter scoring patterns, and historical playoff implications. Provide a comprehensive breakdown with confidence percentages.`);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-orange-600/30 to-red-600/30 hover:from-orange-600/40 hover:to-red-600/40 border border-orange-500/40 hover:border-orange-500/60 rounded-xl text-orange-300 text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    🔮 Deep Future Prediction (1000+ Data Sources)
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              <span className="text-orange-300/60 text-xs animate-pulse">Analyzing game data...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black px-4 pb-4 pt-2 max-w-3xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask about any NBA game..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-all disabled:opacity-40 text-sm"
          />
          <button type="submit" disabled={loading || !query.trim()}
            className="w-10 h-10 bg-orange-600/40 hover:bg-orange-600/60 disabled:opacity-40 border border-orange-500/30 rounded-full flex items-center justify-center flex-shrink-0 transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}