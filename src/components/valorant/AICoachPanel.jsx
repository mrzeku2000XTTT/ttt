import React, { useState } from "react";
import { Brain, Sparkles, Loader2, TrendingUp, TrendingDown, Target, X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Personalized AI feedback after a scenario session.
// Uses InvokeLLM with a tight response schema so we always get structured coaching.
export default function AICoachPanel({ stats, scenarioLabel, sessionTimeSec, onClose }) {
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);

  const accuracy = stats.shots > 0 ? Math.round((stats.hits / stats.shots) * 100) : 0;
  const shotsPerMin = sessionTimeSec > 0 ? Math.round((stats.shots / sessionTimeSec) * 60) : 0;

  const askCoach = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite FPS aim coach (like Aim Labs' AI coach). A player just finished a "${scenarioLabel}" scenario with these stats:

- Hits: ${stats.hits}
- Misses: ${stats.misses}
- Total shots: ${stats.shots}
- Accuracy: ${accuracy}%
- Session time: ${sessionTimeSec}s
- Shots per minute: ${shotsPerMin}

Give concise, actionable coaching. Rate their performance grade (S, A, B, C, D, F), identify their main weakness, give 2-3 specific drill recommendations, and one mental tip. Be direct, not fluffy. Reference real aim concepts (flicking, micro-adjust, target switching, mouse control).`,
        response_json_schema: {
          type: "object",
          properties: {
            grade: { type: "string", enum: ["S", "A", "B", "C", "D", "F"] },
            summary: { type: "string" },
            weakness: { type: "string" },
            drills: { type: "array", items: { type: "string" } },
            mental_tip: { type: "string" },
          },
          required: ["grade", "summary", "weakness", "drills", "mental_tip"],
        },
      });
      setCoaching(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const gradeColor = {
    S: "text-yellow-400 border-yellow-400",
    A: "text-green-400 border-green-400",
    B: "text-cyan-400 border-cyan-400",
    C: "text-orange-400 border-orange-400",
    D: "text-red-400 border-red-400",
    F: "text-red-600 border-red-600",
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d0d18] border border-white/10 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black tracking-wide">AI AIM COACH</h3>
              <p className="text-white/40 text-[10px]">Personalized analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white/5 rounded-xl text-center">
              <div className="text-white font-black text-xl">{accuracy}%</div>
              <div className="text-white/40 text-[9px] uppercase">Accuracy</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center">
              <div className="text-white font-black text-xl">{stats.hits}</div>
              <div className="text-white/40 text-[9px] uppercase">Hits</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-center">
              <div className="text-white font-black text-xl">{shotsPerMin}</div>
              <div className="text-white/40 text-[9px] uppercase">SPM</div>
            </div>
          </div>

          {!coaching && !loading && (
            <button onClick={askCoach}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Get AI Coaching
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-white/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing your performance…</span>
            </div>
          )}

          {coaching && (
            <div className="space-y-3">
              {/* Grade */}
              <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/10">
                <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-black text-3xl ${gradeColor[coaching.grade] || gradeColor.C}`}>
                  {coaching.grade}
                </div>
                <div className="flex-1">
                  <div className="text-white/50 text-[10px] uppercase tracking-wider">Grade</div>
                  <div className="text-white text-sm">{coaching.summary}</div>
                </div>
              </div>

              {/* Weakness */}
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 text-red-400 text-[10px] uppercase font-bold mb-1">
                  <TrendingDown className="w-3 h-3" /> Main Weakness
                </div>
                <p className="text-white text-xs">{coaching.weakness}</p>
              </div>

              {/* Drills */}
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] uppercase font-bold mb-2">
                  <Target className="w-3 h-3" /> Recommended Drills
                </div>
                <ul className="space-y-1">
                  {coaching.drills.map((d, i) => (
                    <li key={i} className="text-white text-xs flex gap-2">
                      <span className="text-cyan-400 font-bold">{i + 1}.</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mental tip */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] uppercase font-bold mb-1">
                  <Zap className="w-3 h-3" /> Mental Tip
                </div>
                <p className="text-white text-xs italic">"{coaching.mental_tip}"</p>
              </div>

              <button onClick={() => setCoaching(null)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-lg">
                Re-analyze
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}