import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Check, TrendingUp, ChevronRight, Play, Crosshair, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SENS_SAMPLES, SAMPLE_DURATION_SEC, getRecommendation } from "./sensFinder";

// Aim Labs-style Sensitivity Finder.
// Runs through SENS_SAMPLES sequentially; after each sample the player clicks
// "Next" to continue. Records hits/misses/time-to-hit per sample, then scores
// them and recommends the best one. Sends summary to InvokeLLM for explanation.
export default function SensFinderPanel({
  onClose,
  onApplySens,       // (value) => void  — apply to live settings
  requestStartSample, // (sensValue, onSampleComplete) => void  — asks arena to run a sample
  currentSens,
}) {
  const [step, setStep] = useState("intro"); // intro | running | done
  const [sampleIdx, setSampleIdx] = useState(0);
  const [samples, setSamples] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleStart = () => {
    setSamples([]);
    setSampleIdx(0);
    setStep("running");
    runSample(0);
  };

  const runSample = (idx) => {
    if (idx >= SENS_SAMPLES.length) {
      finish();
      return;
    }
    const sensValue = SENS_SAMPLES[idx];
    onApplySens(sensValue);
    // Tell the arena to run one timed sample at this sens
    requestStartSample(sensValue, (result) => {
      setSamples((prev) => {
        const next = [...prev, { sens: sensValue, ...result }];
        // Schedule next sample
        if (idx + 1 < SENS_SAMPLES.length) {
          setSampleIdx(idx + 1);
          setTimeout(() => runSample(idx + 1), 400);
        } else {
          // All done
          setTimeout(() => {
            const rec = getRecommendation(next);
            setRecommendation(rec);
            setStep("done");
          }, 300);
        }
        return next;
      });
    });
  };

  const finish = () => {
    const rec = getRecommendation(samples);
    setRecommendation(rec);
    setStep("done");
  };

  const applyRecommendation = () => {
    if (recommendation?.best?.sens) {
      onApplySens(recommendation.best.sens);
    }
    onClose();
  };

  const askAI = async () => {
    if (!recommendation) return;
    setLoadingAi(true);
    try {
      const samplesStr = recommendation.scored
        .map((s) => `sens ${s.sens}: ${s.hits}/${s.shots} hits, ${s.avgTimeToHit.toFixed(2)}s avg, ${s.avgOvershoot.toFixed(2)} overshoot, score ${(s.score * 100).toFixed(0)}`)
        .join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite FPS aim coach. Analyze these sensitivity test results and explain why sens ${recommendation.best.sens} is optimal for this player. Be concise (max 3 sentences), specific, and reference the numbers.\n\n${samplesStr}`,
      });
      setAiSummary(typeof res === "string" ? res : JSON.stringify(res));
    } catch (e) {
      console.error(e);
    }
    setLoadingAi(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0d0d18] border border-white/10 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black tracking-wide">SENS FINDER</h3>
              <p className="text-white/40 text-[10px]">Find your ideal mouse sensitivity</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* INTRO */}
          {step === "intro" && (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <p className="text-white text-sm leading-relaxed">
                  We'll test <span className="font-black text-cyan-400">{SENS_SAMPLES.length} different sensitivities</span> for <span className="font-black text-cyan-400">{SAMPLE_DURATION_SEC}s each</span> using target-switching drills. Your accuracy, speed, and overshoot data will determine your optimal sens.
                </p>
              </div>
              <div className="space-y-2 text-white/60 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Click to lock, aim & shoot normally each round</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Sens changes automatically between samples</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>AI analyzes results and recommends your best sens</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs">
                <span className="text-white/50">Current sens</span>
                <span className="text-white font-black">{currentSens}</span>
              </div>
              <button onClick={handleStart}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Test
              </button>
            </div>
          )}

          {/* RUNNING */}
          {step === "running" && (
            <div className="space-y-4 text-center">
              <div className="py-4">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Sample {sampleIdx + 1} of {SENS_SAMPLES.length}</div>
                <div className="text-white font-black text-6xl mb-2">{SENS_SAMPLES[sampleIdx]}</div>
                <div className="text-white/60 text-xs">Testing sensitivity — shoot targets for {SAMPLE_DURATION_SEC}s</div>
              </div>
              <div className="flex justify-center gap-1">
                {SENS_SAMPLES.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < sampleIdx ? "bg-cyan-500" : i === sampleIdx ? "bg-cyan-500 animate-pulse" : "bg-white/10"}`} />
                ))}
              </div>
              <p className="text-white/40 text-[10px]">Close this panel & aim — it'll reopen when the sample ends</p>
            </div>
          )}

          {/* DONE */}
          {step === "done" && recommendation && (
            <div className="space-y-4">
              <div className="text-center p-5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl">
                <div className="text-white/50 text-[10px] uppercase tracking-widest">Recommended Sens</div>
                <div className="text-white font-black text-6xl my-2">{recommendation.best.sens}</div>
                <div className="text-cyan-300 text-xs">{recommendation.verdict}</div>
              </div>

              {/* Score breakdown */}
              <div className="space-y-1.5">
                {recommendation.scored.map((s) => {
                  const isBest = s.sens === recommendation.best.sens;
                  return (
                    <div key={s.sens} className={`flex items-center gap-3 p-2.5 rounded-lg ${isBest ? "bg-cyan-500/20 border border-cyan-500/40" : "bg-white/5"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isBest ? "bg-cyan-500 text-white" : "bg-white/10 text-white/70"}`}>
                        {s.sens}
                      </div>
                      <div className="flex-1 text-[11px] text-white/70">
                        {s.hits}/{s.shots} hits · {(s.avgTimeToHit || 0).toFixed(2)}s · overshoot {(s.avgOvershoot || 0).toFixed(1)}
                      </div>
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${isBest ? "bg-cyan-400" : "bg-white/30"}`} style={{ width: `${Math.max(5, s.score * 100)}%` }} />
                      </div>
                      {isBest && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  );
                })}
              </div>

              {/* AI Explain */}
              {!aiSummary && !loadingAi && (
                <button onClick={askAI}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Ask AI to Explain
                </button>
              )}
              {loadingAi && (
                <div className="flex items-center justify-center gap-2 text-white/50 py-2 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing…
                </div>
              )}
              {aiSummary && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="text-yellow-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Coach</div>
                  <p className="text-white text-xs leading-relaxed">{aiSummary}</p>
                </div>
              )}

              <button onClick={applyRecommendation}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                Apply Sens {recommendation.best.sens} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}