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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const SYSTEM_PROMPT = `You are KLOCK, a Real-Time Sports Data Analyst AI specializing in NBA games. Your goal is to provide live game updates and predictive scoring simulations.

When the user asks about an NBA game, follow this process:

Step 1: Data Retrieval — Use your internet knowledge to get:
- Current Score and Time Remaining (or final score if game ended)
- Team Season Averages (PPG) and Head-to-Head histories
- Key Player Injury Status

Step 2: Analysis & Pace Logic — Calculate:
- Current Pace: (Total Points Scored / Minutes Elapsed) = Points Per Minute (PPM)
- Projected Finish: (PPM * 48) adjusted for historical cooldown/garbage time
- If user provides a target (Over/Under line), calculate risk level

Step 3: Response Formatting — ALWAYS use this structure:

**🏀 Live Game Update: [Team A] vs. [Team B]**
**Score: [Score]** | **Time: [Time Remaining or FINAL]**

---

**📊 Pace Metrics**
- **Current Pace:** ~X.XX points per minute
- **Projected Finish:** ~XXX total points
- **Target (Over/Under X.X):** [LOW/MEDIUM/HIGH/CRITICAL] RISK — brief explanation

---

**🎲 Simulation Summary**
Based on current efficiency vs. seasonal averages, there is a **XX% probability** of the Over/Under hitting.

---

**🧠 Strategic Context**
Brief explanation of why pace is high/low (injuries, matchup, rest days, etc.)

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
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
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Analysis failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Who's playing in the NBA tonight?",
    "Blazers vs Spurs over/under 236.5",
    "Lakers game pace analysis",
    "Top NBA games to watch today"
  ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black z-10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Activity className="w-5 h-5 text-white" />
        </div>
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
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Klock — NBA Analyst</p>
              <p className="text-white/40 text-sm mt-1">Ask about any NBA game for live pace analysis, scoring predictions, and over/under simulations.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full max-w-md mt-4">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => setQuery(p)}
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
              {/* Show sim chart after assistant message with simData */}
              {msg.role === "assistant" && i === messages.length - 1 && simData && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="mt-3 max-w-2xl mx-auto">
                  <KlockSimChart data={simData} />
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