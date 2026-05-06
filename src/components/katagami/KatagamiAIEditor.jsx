import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Sparkles, Wand2, X, Mail, Clock, Gauge, Zap, Film, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KatagamiAgentChat from "./KatagamiAgentChat";

// Quick-start presets that prefill vibe + duration + speed in one click.
// "Motion Ad" is the flagship — long duration so the master agent spawns its
// 10 sub-agent choreography loop and the timeline gets 50+ keyframes.
const QUICK_PRESETS = [
  {
    id: "motion_ad",
    label: "Motion Ad",
    icon: Megaphone,
    vibe: "premium product motion ad — punchy 0.4s text pops, dolly-in into the hero, kinetic flourishes, cinematic color grade, end on a confident product hold",
    duration: 20,
    speed: 1,
    color: "from-fuchsia-500 to-orange-500",
    desc: "20s · 10 sub-agents · long-form ad",
  },
  {
    id: "teaser",
    label: "Quick Teaser",
    icon: Zap,
    vibe: "fast energetic teaser — snappy reveals, kinetic typography, modern app vibes",
    duration: 6,
    speed: 1,
    color: "from-cyan-500 to-blue-500",
    desc: "6s · single-shot · punchy",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    icon: Film,
    vibe: "moody cinematic teaser — slow dolly, dramatic lighting, prestige film grading, deliberate pacing",
    duration: 14,
    speed: 0.5,
    color: "from-violet-500 to-fuchsia-500",
    desc: "14s · multi-agent · slow & moody",
  },
];

/**
 * Katagami AI Editor — runs the master motion-ad agent loop:
 *   research → analyze_media → plan → [choreograph] → critique → refine → done
 *
 * `choreograph` only runs for LONG-form videos (duration > 8s). It spawns a
 * fresh sub-agent for each beat (4-10 segments) so the final ad has many
 * distinct keyframed motions instead of one looping preset.
 */

const SHORT_STEPS = ["research", "analyze_media", "plan", "critique", "refine", "done"];
const LONG_STEPS  = ["research", "analyze_media", "plan", "choreograph", "sequence", "critique", "refine", "done"];

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5×", desc: "Slow / cinematic" },
  { value: 1,   label: "1×",   desc: "Real-time" },
  { value: 2,   label: "2×",   desc: "Fast / punchy" },
];

export default function KatagamiAIEditor() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [vibe, setVibe] = useState("");
  const [email, setEmail] = useState("");
  const [duration, setDurationSec] = useState(6); // 4-30s — > 8 triggers multi-agent loop
  const [speed, setSpeed] = useState(1);          // 0.5 / 1 / 2

  const [working, setWorking] = useState(null);   // current step name while in-flight
  const [messages, setMessages] = useState([]);   // [{step, output}]
  const [error, setError] = useState(null);
  const [renderUrl, setRenderUrl] = useState(null);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Only images or videos are supported.");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setMessages([]);
    setRenderUrl(null);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setVibe("");
    setMessages([]);
    setError(null);
    setRenderUrl(null);
    setWorking(null);
    setRunning(false);
  };

  const runAgentLoop = async () => {
    if (!file || running) return;
    setRunning(true);
    setError(null);
    setMessages([]);
    setRenderUrl(null);

    try {
      // Upload file first
      setWorking("upload");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("Upload failed");

      const media_type = file.type.startsWith("video/") ? "video" : "image";
      const isLong = duration > 8;
      // Long-form ALWAYS spawns 10 sub-agents (one per beat). They share the
      // total duration so each beat is `duration / 10` seconds long.
      const segmentCount = isLong ? 10 : 0;
      const STEPS = isLong ? LONG_STEPS : SHORT_STEPS;

      let state = {
        media_url: file_url,
        media_type,
        vibe,
        email: email.trim() || undefined,
        target_duration: duration,
        segment_count: segmentCount,
        speed,
      };

      // Walk through every step
      for (const step of STEPS) {
        setWorking(step);
        const res = await base44.functions.invoke("katagamiMasterAgent", { step, state });
        const data = res?.data;
        if (!data || data.error) throw new Error(data?.error || `Step ${step} failed`);

        // Append the step output to the transcript
        setMessages((prev) => [...prev, { step, output: data.output }]);

        // Merge step output into running state under that step's key
        if (step === "research")           state = { ...state, research: data.output };
        else if (step === "analyze_media") state = { ...state, analysis: data.output };
        else if (step === "plan")          state = { ...state, plan: data.output };
        else if (step === "choreograph")   state = { ...state, choreograph: data.output };
        else if (step === "sequence")      state = { ...state, sequence: data.output };
        else if (step === "critique")      state = { ...state, critique: data.output };
        else if (step === "refine")        state = { ...state, plan: data.output };
        else if (step === "done" && data.render_url) setRenderUrl(data.render_url);
      }
    } catch (e) {
      setError(e.message || "Agent loop failed");
    } finally {
      setWorking(null);
      setRunning(false);
    }
  };

  const isVideo = file?.type?.startsWith("video/");

  return (
    <div>
      <ChapterHeader />

      <p className="text-white/60 mt-4 mb-8 max-w-3xl">
        A self-improving motion-ad agent. It researches current trends, analyzes your media, drafts a plan, critiques itself, and refines — all visible live below.
      </p>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        {/* LEFT — Input */}
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
              dragOver
                ? "border-fuchsia-400 bg-fuchsia-500/10"
                : file
                  ? "border-white/20 bg-black/40"
                  : "border-white/15 bg-white/[0.02] hover:border-fuchsia-400/50 hover:bg-white/5 cursor-pointer"
            }`}
            style={{ minHeight: 220 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {!file ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-white font-bold text-base mb-1">Drop image or video</div>
                <div className="text-white/40 text-xs">or click to browse</div>
              </div>
            ) : (
              <div className="relative">
                {isVideo ? (
                  <video src={previewUrl} className="w-full h-56 object-cover" controls muted />
                ) : (
                  <img src={previewUrl} alt="" className="w-full h-56 object-cover" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
                  title="Remove"
                  disabled={running}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 text-[11px] text-white/60 bg-black/60 border-t border-white/10 truncate">
                  {file.name}
                </div>
              </div>
            )}
          </div>

          {/* Quick-start presets — one click prefills vibe + duration + speed */}
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 block">
              Quick start
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_PRESETS.map((p) => {
                const Icon = p.icon;
                const isActive = vibe === p.vibe && duration === p.duration && speed === p.speed;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setVibe(p.vibe);
                      setDurationSec(p.duration);
                      setSpeed(p.speed);
                    }}
                    disabled={running}
                    title={p.desc}
                    className={`group relative flex flex-col items-start gap-1 p-2.5 rounded-lg border transition-all text-left disabled:opacity-40 ${
                      isActive
                        ? `bg-gradient-to-br ${p.color} border-white/30 text-white shadow-lg`
                        : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-fuchsia-300"}`} />
                    <div className={`text-[11px] font-black ${isActive ? "text-white" : "text-white"}`}>{p.label}</div>
                    <div className={`text-[9px] leading-tight ${isActive ? "text-white/80" : "text-white/40"}`}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 block">
              Vibe (optional)
            </label>
            <textarea
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. dramatic launch trailer, playful product reveal, moody cinematic teaser…"
              className="w-full h-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-fuchsia-400/50 focus:bg-white/10 outline-none resize-none"
              disabled={running}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Duration */}
            <div>
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={4}
                  max={30}
                  step={1}
                  value={duration}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  disabled={running}
                  className="flex-1 accent-fuchsia-400"
                />
                <span className="text-white font-mono text-xs tabular-nums w-8 text-right">{duration}s</span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {duration > 8 ? `🤖 Multi-agent · 10 sub-agents (${(duration / 10).toFixed(1)}s/beat)` : "Single-shot"}
              </div>
            </div>

            {/* Speed */}
            <div>
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3 h-3" /> Render speed
              </label>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSpeed(opt.value)}
                    disabled={running}
                    title={opt.desc}
                    className={`flex-1 h-7 rounded-md text-[11px] font-bold transition-colors ${
                      speed === opt.value
                        ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {SPEED_OPTIONS.find(o => o.value === speed)?.desc}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email me the MP4 (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-fuchsia-400/50 focus:bg-white/10 outline-none"
              disabled={running}
            />
          </div>

          <button
            onClick={runAgentLoop}
            disabled={!file || running}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm tracking-wide shadow-lg shadow-fuchsia-500/30 flex items-center justify-center gap-2"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Agent at work…</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Auto-Edit with AI Agent</>
            )}
          </button>
        </div>

        {/* RIGHT — Live agent chat */}
        <KatagamiAgentChat
          messages={messages}
          working={working === "upload" ? null : working}
          error={error}
          renderUrl={renderUrl}
          onOpenRender={() => renderUrl && window.open(renderUrl, "_blank")}
        />
      </div>
    </div>
  );
}

function ChapterHeader() {
  return (
    <div className="flex items-end gap-4 border-b border-white/10 pb-4">
      <div className="text-7xl md:text-8xl font-black text-white/10 leading-none tabular-nums">AI</div>
      <div className="flex-1">
        <div className="text-3xl md:text-4xl font-black text-fuchsia-300 mb-1">編集</div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Auto-Editor Agent</h2>
      </div>
      <Sparkles className="w-5 h-5 text-fuchsia-300 hidden md:block" />
    </div>
  );
}