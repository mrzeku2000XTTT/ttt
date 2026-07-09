import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, FlaskConical, Play, Loader2, Scale, Trophy } from "lucide-react";
import { KASPA_AI_MODELS } from "../kaspaAIModels";
import ModelLogo from "../agentModelLogos";
import SandboxModelCard from "./SandboxModelCard";
import { runModel, judgeResponses, speedScore, overallScore } from "./sandboxEngine";

const BLUE = "#4d6bfe";
const BORDER = "rgba(255,255,255,0.08)";
const GLASS = "rgba(255,255,255,0.05)";

const SAMPLE_TASKS = [
  "Explain how Kaspa's BlockDAG differs from a blockchain, for a beginner",
  "Write a Python function that finds the 3 largest numbers in a list without sorting",
  "You have 8 balls, one is heavier. Find it in 2 weighings — explain your reasoning",
];

export default function AgentSandbox({ onClose }) {
  const [selected, setSelected] = useState([KASPA_AI_MODELS[0].id, KASPA_AI_MODELS[1].id]);
  const [prompt, setPrompt] = useState("");
  const [runs, setRuns] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | running | judging | done
  const [judge, setJudge] = useState(null);
  const [tick, setTick] = useState(0);
  const startRef = useRef(0);

  // Live timer while models are racing
  useEffect(() => {
    if (phase !== "running") return;
    const iv = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(iv);
  }, [phase]);

  const toggleModel = (id) => {
    setSelected(prev => prev.includes(id)
      ? (prev.length > 2 ? prev.filter(x => x !== id) : prev)
      : (prev.length < 4 ? [...prev, id] : prev));
  };

  const start = async () => {
    const text = prompt.trim();
    if (!text || phase === "running" || phase === "judging") return;
    const models = KASPA_AI_MODELS.filter(m => selected.includes(m.id));
    setJudge(null);
    setPhase("running");
    startRef.current = performance.now();
    const initial = models.map(m => ({ model: m, status: "running", reply: null, ms: null, scores: null, speed: null, overall: null }));
    setRuns(initial);

    // Race all models in parallel — update each card the moment it finishes
    const results = await Promise.all(models.map(async (m, i) => {
      try {
        const r = await runModel(m, text);
        setRuns(prev => prev.map((run, idx) => idx === i ? { ...run, status: "done", reply: r.reply, ms: r.ms } : run));
        return { ...r, ok: true };
      } catch {
        setRuns(prev => prev.map((run, idx) => idx === i ? { ...run, status: "error" } : run));
        return { reply: null, ms: 0, ok: false };
      }
    }));

    // Blind judging for a real benchmark rating
    const valid = results.map((r, i) => ({ ...r, i })).filter(r => r.ok && r.reply);
    if (valid.length >= 2) {
      setPhase("judging");
      try {
        const judged = await judgeResponses(text, valid);
        const allMs = valid.map(v => v.ms);
        setRuns(prev => prev.map((run, idx) => {
          const vi = valid.findIndex(v => v.i === idx);
          if (vi === -1) return run;
          const s = judged?.scores?.find(sc => sc.key === String.fromCharCode(65 + vi));
          if (!s) return run;
          const speed = speedScore(valid[vi].ms, allMs);
          return { ...run, scores: s, speed, overall: overallScore(s, speed) };
        }));
        const winIdx = valid[judged?.winner ? judged.winner.charCodeAt(0) - 65 : 0]?.i;
        setJudge({ analysis: judged?.analysis || "", winnerIdx: winIdx });
      } catch {
        setJudge({ analysis: "Judging failed — raw responses and real timings are shown above.", winnerIdx: null });
      }
    }
    setPhase("done");
  };

  const elapsed = phase === "running" ? performance.now() - startRef.current : 0;
  const ranked = runs.filter(r => r.overall != null).sort((a, b) => b.overall - a.overall);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex flex-col" style={{ background: "#000" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
        <FlaskConical className="w-5 h-5" style={{ color: BLUE }} />
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-extrabold text-white leading-tight">Sandbox</h2>
          <p className="text-[10.5px] text-white/35 truncate">Same task · multiple agents · real benchmark ratings</p>
        </div>
        <button onClick={onClose} className="p-2.5 rounded-xl text-white/60 hover:text-white" style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-5 space-y-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
          <style>{`
            .ttt-md { color: rgba(255,255,255,0.85); }
            .ttt-md p { margin: 0.4em 0; line-height: 1.6; }
            .ttt-md ul,.ttt-md ol { margin: 0.4em 0; padding-left: 1.3em; }
            .ttt-md code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }
            .ttt-md pre { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.6em; border-radius: 8px; overflow-x: auto; }
            .ttt-md strong { color: #fff; }
          `}</style>

          {/* Model picker */}
          <div>
            <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-2">Pick 2–4 agents</div>
            <div className="flex flex-wrap gap-2">
              {KASPA_AI_MODELS.map(m => {
                const on = selected.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleModel(m.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={on
                      ? { background: "rgba(77,107,254,0.15)", color: "#fff", border: `1.5px solid ${BLUE}` }
                      : { background: GLASS, color: "rgba(255,255,255,0.5)", border: `1px solid ${BORDER}` }}>
                    <ModelLogo logo={m.logo} size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task prompt */}
          <div className="rounded-2xl p-3.5" style={{ background: "#121214", border: `1px solid ${BORDER}` }}>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); start(); } }}
              placeholder="One task prompt — every selected agent gets exactly the same challenge…"
              rows={2}
              className="w-full resize-none outline-none text-[14px] text-white placeholder:text-white/30 bg-transparent" />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
                {SAMPLE_TASKS.map(t => (
                  <button key={t} onClick={() => setPrompt(t)}
                    className="px-2.5 py-1 rounded-full text-[10.5px] text-white/45 hover:text-white truncate max-w-[220px]"
                    style={{ border: `1px solid ${BORDER}`, background: GLASS }}>{t}</button>
                ))}
              </div>
              <button onClick={start} disabled={!prompt.trim() || phase === "running" || phase === "judging"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 active:scale-95 transition-transform flex-shrink-0"
                style={{ background: BLUE, boxShadow: "0 0 18px rgba(77,107,254,0.4)" }}>
                {phase === "running" || phase === "judging" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Benchmark
              </button>
            </div>
          </div>

          {/* Judging status */}
          {phase === "judging" && (
            <div className="flex items-center gap-2 justify-center text-[12.5px] py-1" style={{ color: "#8fa3ff" }}>
              <Scale className="w-4 h-4 animate-pulse" /> Blind judge analyzing all responses in real time…
            </div>
          )}

          {/* Arena grid — stacks on mobile */}
          {runs.length > 0 && (
            <div className={`grid gap-3 grid-cols-1 ${runs.length === 2 ? "md:grid-cols-2" : runs.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
              {runs.map((run, i) => (
                <SandboxModelCard key={run.model.id} run={run} elapsed={elapsed + tick * 0} isWinner={judge?.winnerIdx === i} />
              ))}
            </div>
          )}

          {/* Final leaderboard + judge analysis */}
          {ranked.length > 0 && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#121214", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Trophy className="w-4 h-4 text-yellow-400" /> Benchmark Leaderboard
              </div>
              {ranked.map((r, i) => (
                <div key={r.model.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white/30 w-5 tabular-nums">#{i + 1}</span>
                  <ModelLogo logo={r.model.logo} size={15} />
                  <span className="text-[13px] text-white/80 font-medium flex-1 truncate">{r.model.label}</span>
                  <div className="w-24 sm:w-40 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.overall}%`, background: i === 0 ? "#facc15" : BLUE }} />
                  </div>
                  <span className="text-sm font-extrabold tabular-nums w-8 text-right" style={{ color: i === 0 ? "#facc15" : "#fff" }}>{r.overall}</span>
                </div>
              ))}
              {judge?.analysis && (
                <p className="text-[12px] text-white/50 leading-relaxed pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="font-semibold text-white/70">Judge's analysis: </span>{judge.analysis}
                </p>
              )}
              <p className="text-[10px] text-white/25">Rating = 85% blind-judged quality (accuracy · completeness · clarity · reasoning) + 15% real measured speed.</p>
            </div>
          )}

          {runs.length === 0 && (
            <div className="text-center py-10">
              <FlaskConical className="w-10 h-10 mx-auto mb-3 text-white/15" />
              <p className="text-[13px] text-white/35">Pick your agents, give them one task, and watch a real head-to-head benchmark.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}