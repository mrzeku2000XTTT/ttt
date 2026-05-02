import React, { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MOTION_PRESETS } from "./motionPresets";

/**
 * AI panel under the preview — user describes a motion in plain English,
 * AI returns either a known preset OR a custom keyframe set, applied to the
 * currently selected device.
 */
export default function AIMotionPrompt({ disabled, duration, onApplyKeyframes }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const presetIds = MOTION_PRESETS.map((p) => p.id);

  const run = async () => {
    if (!prompt.trim() || busy || disabled) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a motion designer for a 3D mockup tool. The user describes a motion they want for a device on screen. You can either:
1) Pick one of these motion preset IDs if it's a perfect match: ${presetIds.join(", ")}
2) Or build a custom keyframe sequence with 3-6 keyframes over ${duration} seconds. Each keyframe has: t (seconds 0..${duration}), rotX (-180..180 degrees, X is tilt forward/back), rotY (-180..180 degrees, Y is spin left/right), scale (0.5..1.4).

User request: """${prompt}"""

Return ONLY the JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["preset", "custom"] },
            preset_id: { type: "string" },
            keyframes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  t: { type: "number" },
                  rotX: { type: "number" },
                  rotY: { type: "number" },
                  scale: { type: "number" },
                },
                required: ["t", "rotX", "rotY", "scale"],
              },
            },
          },
          required: ["mode"],
        },
      });

      let kfs = [];
      if (res?.mode === "preset" && res.preset_id) {
        const p = MOTION_PRESETS.find((x) => x.id === res.preset_id);
        if (p) kfs = p.build(duration);
      }
      if ((!kfs || kfs.length < 2) && Array.isArray(res?.keyframes)) {
        kfs = res.keyframes;
      }
      if (!kfs || kfs.length < 2) {
        throw new Error("Couldn't build a motion. Try rewording.");
      }
      // Clamp values
      const clean = kfs.map((k) => ({
        t: Math.max(0, Math.min(duration, Number(k.t) || 0)),
        rotX: Math.max(-180, Math.min(180, Number(k.rotX) || 0)),
        rotY: Math.max(-180, Math.min(180, Number(k.rotY) || 0)),
        scale: Math.max(0.3, Math.min(1.5, Number(k.scale) || 1)),
      })).sort((a, b) => a.t - b.t);
      onApplyKeyframes(clean);
      setPrompt("");
    } catch (e) {
      setError(e.message || "AI request failed");
    }
    setBusy(false);
  };

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 border border-white/10 backdrop-blur-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow">
          <Wand2 className="w-3 h-3 text-white" />
        </div>
        <span className="text-white text-xs font-black tracking-tight">AI Motion</span>
        <span className="text-[10px] text-white/40">describe it, AI animates it</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          disabled={disabled || busy}
          placeholder={disabled ? "Select a device first…" : "e.g. tilt left then pop forward and zoom in"}
          className="flex-1 h-9 px-3 rounded-lg bg-black/40 border border-white/10 focus:border-fuchsia-400/60 text-white text-xs outline-none disabled:opacity-40"
        />
        <button
          onClick={run}
          disabled={disabled || busy || !prompt.trim()}
          className="h-9 px-3 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-fuchsia-500/20"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "Thinking…" : "Animate"}
        </button>
      </div>
      {error && <p className="text-red-300 text-[10px] mt-2">{error}</p>}
    </div>
  );
}