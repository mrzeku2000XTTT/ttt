import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Loader2, Activity, TrendingUp, Target, BarChart3, Clock, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import KlockSimChart from "@/components/klock/KlockSimChart";

export default function KlockPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [simData, setSimData] = useState(null);
  const [todayGames, setTodayGames] = useState(null);
  const [loadingGames, setLoadingGames] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchTodayGames();
  }, []);

  const fetchTodayGames = async () => {
    setLoadingGames(true);
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000));
      const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const fetchPromise = base44.integrations.Core.InvokeLLM({
        prompt: `Today is ${today}. List the NBA games scheduled for today (or the most recent/upcoming games if none today). Return ONLY a JSON object:\n{"games": [{"teamA": "Team Name", "teamB": "Team Name", "time": "7:00 PM ET", "status": "scheduled" or "live" or "final", "score": "" or "105-98", "headline": "short 5-word max note"}], "date": "today's date"}\nMax 6 games. If games are live, include score. If no games today, show next day's games.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            games: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  teamA: { type: "string" },
                  teamB: { type: "string" },
                  time: { type: "string" },
                  status: { type: "string" },
                  score: { type: "string" },
                  headline: { type: "string" }
                }
              }
            },
            date: { type: "string" }
          }
        }
      });
      const result = await Promise.race([fetchPromise, timeout]);
      if (result?.games?.length) {
        setTodayGames(result);
      } else {
        setTodayGames(null);
      }
    } catch (err) {
      console.error("Failed to fetch today's games:", err);
      setTodayGames(null);
    } finally {
      setLoadingGames(false);
    }
  };

  const SYSTEM_PROMPT = `You are KLOCK, an NBA Sports Data Analyst AI.

CRITICAL HONESTY RULES:
- You DO NOT have access to live game scores or real-time data feeds.
- NEVER fabricate scores, times remaining, or specific live game data.
- If a game is currently happening, say "This game may be in progress — I don't have a live score feed. Check ESPN.com or the NBA app for the exact current score."
- You CAN provide: season averages, historical matchup data, team stats, injury reports from recent news, and predictive analysis.
- Be transparent about what is verified data vs. AI projection.

When the user asks about an NBA game, follow this process:

Step 1: Data Context — Use your internet knowledge to find:
- Team Season Averages (PPG, pace rating)
- Recent form and win/loss streaks
- Key Player Injury Status from recent reports
- Historical Head-to-Head data
- Vegas/betting lines if available from recent sources

Step 2: Analysis — Calculate:
- Expected scoring pace based on team averages
- Projected total based on offensive/defensive ratings
- If user provides a target (Over/Under line), calculate probability

Step 3: Response Formatting — ALWAYS use this structure:

**🏀 [Team A] vs. [Team B] — Analysis**
**Status:** [Scheduled for TIME / May be in progress — check live sources for exact score / Final: SCORE]

---

**📊 Projected Pace Metrics**
- **Combined Season Avg:** ~X.X PPG
- **Pace Rating:** [fast/average/slow]
- **Projected Total:** ~XXX points
- **Over/Under Line (if given):** [probability assessment]

---

**🧠 Strategic Context**
Brief explanation of matchup dynamics, injuries, rest days, etc.

---

**⚠️ Data Disclaimer**
Scores and live data should be verified on ESPN.com or NBA.com. Analysis is based on seasonal stats and recent reports.

Step 4: ALSO return a JSON block at the very end wrapped in \`\`\`json ... \`\`\` tags with this structure for the simulation chart:
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

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ""}User: ${userMsg}`,
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
    ? todayGames.games.slice(0, 4).map(g => `${g.teamA} vs ${g.teamB} pace analysis`)
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
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-[10px] font-semibold">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png" alt="Klock" className="w-20 h-20 rounded-3xl object-cover shadow-2xl shadow-orange-500/30" />
            <div>
              <p className="text-white font-semibold text-lg">Klock — NBA Analyst</p>
              <p className="text-white/40 text-sm mt-1">Ask about any NBA game for live pace analysis, scoring predictions, and over/under simulations.</p>
            </div>

            {/* Today's Games Ticker */}
            {loadingGames ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                <span className="text-white/40 text-xs">Loading today's games...</span>
              </div>
            ) : todayGames?.games?.length > 0 ? (
              <div className="w-full max-w-md mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">{todayGames.date || "Today's Games"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {todayGames.games.slice(0, 6).map((g, i) => (
                    <button key={i} onClick={() => submitQuery(`Analyze ${g.teamA} vs ${g.teamB} — focus ONLY on this specific game. ${g.score ? `Last reported score: ${g.score}.` : `Scheduled: ${g.time}.`} Provide pace metrics, projected total, injury report, and strategic context for this matchup.`)}
                      className="flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 rounded-xl text-left transition-all group">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        g.status === "live" ? "bg-red-500 animate-pulse" :
                        g.status === "final" ? "bg-white/30" : "bg-orange-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-semibold truncate">{g.teamA} vs {g.teamB}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {g.score && <span className="text-orange-400 text-[11px] font-bold">{g.score}</span>}
                          <span className="text-white/30 text-[10px]">
                            {g.status === "live" ? "🔴 LIVE" : g.status === "final" ? "FINAL" : g.time}
                          </span>
                        </div>
                        {g.headline && <p className="text-white/25 text-[10px] mt-0.5 truncate">{g.headline}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

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
              <p className="text-orange-300/70 text-[11px]">Data powered by AI web search — updated in real-time</p>
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