import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, PenTool, Plus, Wand2, RefreshCw, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Persist generated script across remounts/page reloads so the user never loses
// their AI-written lines when switching slides or selecting different items.
const STORAGE_KEY = "ultramock_script_generator_v1";
const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveStored = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

/**
 * ScriptGenerator
 * ---------------
 * Built-in real-words ad-script generator. The user types a brief (or picks a
 * vibe chip), and an LLM returns 4 punchy ad lines (2-7 words each).
 *
 * Two ways to use a generated line:
 *   - "Use" → replace the CURRENT text item's text with this line
 *   - "+ Slide" → spawn a NEW text item carrying this line, ready to drop into
 *                 the next slide of the timeline
 *
 * Props:
 *   - currentText: string — the selected text item's current value (used as context)
 *   - onApplyToCurrent(line) — replace current item's text
 *   - onAddAsNewSlide(line)  — create a fresh text item with this line
 */
const VIBE_CHIPS = [
  { id: "hook",     label: "Hook",     hint: "punchy attention-grabber" },
  { id: "feature",  label: "Feature",  hint: "highlight one feature" },
  { id: "benefit",  label: "Benefit",  hint: "emotional value prop" },
  { id: "cta",      label: "CTA",      hint: "call-to-action" },
  { id: "tease",    label: "Tease",    hint: "mystery / curiosity" },
  { id: "claim",    label: "Claim",    hint: "bold confident claim" },
];

export default function ScriptGenerator({ currentText, onApplyToCurrent, onAddAsNewSlide }) {
  const stored = loadStored() || {};
  const [brief, setBrief] = useState(stored.brief || "");
  const [vibe, setVibe] = useState(stored.vibe || "hook");
  const [lines, setLines] = useState(stored.lines || []);
  const [usedIdx, setUsedIdx] = useState(stored.usedIdx ?? -1); // last line index user inserted — drives auto-advance
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(stored.lines?.length > 0);

  // Persist on any change so script survives remounts
  useEffect(() => {
    saveStored({ brief, vibe, lines, usedIdx });
  }, [brief, vibe, lines, usedIdx]);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const vibeLabel = VIBE_CHIPS.find((v) => v.id === vibe)?.label || "hook";
      const vibeHint  = VIBE_CHIPS.find((v) => v.id === vibe)?.hint || "";
      const userBrief = (brief || "").trim();

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior advertising copywriter writing kinetic-typography ad lines for a motion video.

CURRENT SLIDE TEXT (context — what's on screen right now):
"${currentText || "(empty)"}"

USER BRIEF: "${userBrief || "(no brief — write generic ad lines that follow on naturally)"}"

LINE STYLE: ${vibeLabel} — ${vibeHint}

Write 4 SHORT ad lines (2-7 words each) following the brief and style.
- Punchy, broadcast-grade, ALL-CAPS-ready.
- Each line stands alone as ONE slide of a motion ad.
- DO NOT repeat the current slide text.
- DO NOT use quotes, periods, or filler words.
- Make each line DISTINCT from the others.

Return JSON: { "lines": [string, string, string, string] }`,
        response_json_schema: {
          type: "object",
          properties: {
            lines: { type: "array", items: { type: "string" } },
          },
          required: ["lines"],
        },
      });

      const out = Array.isArray(res?.lines) ? res.lines.map((l) => String(l).trim()).filter(Boolean) : [];
      if (out.length === 0) throw new Error("No lines returned");
      setLines(out.slice(0, 4));
      setUsedIdx(-1);
    } catch (e) {
      setError(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-950/40 to-fuchsia-950/30 border border-violet-500/20 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-300">
          <PenTool className="w-3 h-3" /> Script Generator
          {lines.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-100 text-[9px]">
              {lines.length} saved
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2.5">
          {/* Brief */}
          <input
            type="text"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="What's the ad about? (e.g. 'fitness app for runners')"
            disabled={loading}
            style={{ fontSize: "16px" }}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 focus:border-violet-400/60 rounded-lg text-white text-xs placeholder:text-white/30 outline-none disabled:opacity-50"
          />

          {/* Vibe chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {VIBE_CHIPS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                disabled={loading}
                title={v.hint}
                className={`px-2.5 h-6 rounded-full text-[10px] font-bold transition-colors ${
                  vibe === v.id
                    ? "bg-violet-500 text-white shadow"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading}
            className="w-full h-9 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Writing…</>
            ) : lines.length > 0 ? (
              <><RefreshCw className="w-3.5 h-3.5" /> Re-generate</>
            ) : (
              <><Wand2 className="w-3.5 h-3.5" /> Generate 4 lines</>
            )}
          </button>

          {error && (
            <div className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1.5">
              {error}
            </div>
          )}

          {/* Generated lines */}
          {lines.length > 0 && (
            <div className="space-y-1.5">
              {/* Quick chain: insert the NEXT unused line as a new slide */}
              {usedIdx < lines.length - 1 && (
                <button
                  onClick={() => {
                    const nextIdx = usedIdx + 1;
                    onAddAsNewSlide?.(lines[nextIdx]);
                    setUsedIdx(nextIdx);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:opacity-90 text-white text-[11px] font-black shadow-lg shadow-fuchsia-500/30"
                  title={`Insert line ${usedIdx + 2} as a new slide`}
                >
                  <Plus className="w-3 h-3" /> Next Slide → "{lines[usedIdx + 1]?.slice(0, 28)}"
                </button>
              )}
              {lines.map((line, i) => {
                const isNext = i === usedIdx + 1;
                const isUsed = i <= usedIdx;
                return (
                  <div
                    key={i}
                    className={`group flex items-center gap-1.5 p-2 rounded-lg border ${
                      isNext
                        ? "bg-fuchsia-500/15 border-fuchsia-400/50 ring-1 ring-fuchsia-400/30"
                        : isUsed
                          ? "bg-white/[0.02] border-white/5 opacity-60"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                    }`}
                  >
                    <span className={`text-[9px] font-mono w-4 flex-shrink-0 ${
                      isNext ? "text-fuchsia-300 font-bold" : "text-white/30"
                    }`}>{i + 1}</span>
                    <span className="flex-1 text-xs text-white font-bold truncate" title={line}>
                      {line}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { onApplyToCurrent?.(line); setUsedIdx(i); }}
                        className="px-2 h-6 rounded-md bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-200 text-[10px] font-bold"
                        title="Replace current text with this line"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => { onAddAsNewSlide?.(line); setUsedIdx(i); }}
                        className="flex items-center gap-0.5 px-2 h-6 rounded-md bg-fuchsia-500/20 hover:bg-fuchsia-500/40 border border-fuchsia-400/40 text-fuchsia-200 text-[10px] font-bold"
                        title="Add as a new text item for the next slide"
                      >
                        <Plus className="w-2.5 h-2.5" /> Slide
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[9px] text-white/30">
                  <Sparkles className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />
                  Auto-saved · survives reloads
                </span>
                <button
                  onClick={() => { setLines([]); setUsedIdx(-1); }}
                  className="flex items-center gap-1 text-[9px] text-white/40 hover:text-red-300"
                  title="Clear saved script"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}