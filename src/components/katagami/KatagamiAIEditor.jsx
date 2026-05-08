import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Sparkles, Wand2, X, Mail, Clock, Gauge, Zap, Film, Megaphone, Users, Layers, ExternalLink, Music } from "lucide-react";
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
    vibe: `Premium 30-second flagship product motion ad — broadcast-quality, Apple-keynote energy, end-of-Super-Bowl-spot polish.

ACT 1 — HOOK (0–6s): Open BIG. Subject enters from off-screen with confident force — slide-in or fly-across with a heavy ease-out, NOT a slow fade. First text pop hits within 1.2s, ALL-CAPS, 0.35s in, holds 1s, out. Deep cinematic color: rich blacks, controlled highlights, single accent color. Camera dollies in slowly the whole act.

ACT 2 — BUILD (6–18s): Subject is on-screen and ALIVE. Rhythmic in-place motion — float, wobble, tilt, bounce — synced to an implied beat (~120bpm, one accent every 0.5s). Layer in 2–3 supporting text pops as feature callouts (3–5 words each, punchy, kinetic typography). Camera does subtle parallax pans left↔right to keep the frame breathing. No motion lasts longer than 1.5s — keep it dense.

ACT 3 — CLIMAX (18–24s): Peak energy. Bold rotation, spin, barrel, or orbit. One dramatic camera punch-in or pull-back. The biggest text moment lands here — the tagline or hero claim — large, centered, weight 900, 0.4s pop with overshoot easing. Brief micro-shake on impact.

ACT 4 — RESOLVE (24–30s): Settle confidently. Subject lands in a clean hero showcase pose — slight tilt-up or chat-zoom. Final logo/tagline holds for 2s with a soft camera ease-out. End on a confident, commercial-ready frame.

CRAFT RULES: every motion uses ease-out or ease-in-out (NEVER linear). Text is ALL CAPS, condensed sans, weight 900. Color grade: cinematic — crushed blacks, warm highlights or single neon accent. No motion is decorative — every move serves the product story. Pacing: fast but never frantic. The viewer should feel the product is INEVITABLE.`,
    duration: 30,
    speed: 1,
    slides: 12,
    kf: 3,
    color: "from-fuchsia-500 to-orange-500",
    desc: "30s · 12 slides × 3 kfs",
  },
  {
    id: "teaser",
    label: "Quick Teaser",
    icon: Zap,
    vibe: "fast energetic teaser — snappy reveals, kinetic typography, modern app vibes",
    duration: 6,
    speed: 1,
    slides: 4,
    kf: 2,
    color: "from-cyan-500 to-blue-500",
    desc: "6s · 4 slides × 2 kfs",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    icon: Film,
    vibe: "moody cinematic teaser — slow dolly, dramatic lighting, prestige film grading, deliberate pacing",
    duration: 20,
    speed: 0.5,
    slides: 10,
    kf: 4,
    color: "from-violet-500 to-fuchsia-500",
    desc: "20s · 10 slides × 4 kfs",
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
// LONG flow: choreograph is split into 3 streaming sub-steps. choreograph_beat
// is invoked ONCE PER BEAT by the frontend so each sub-agent makes a real-time
// decision based on what previous sub-agents already produced. The `agentPace`
// slider inserts a delay between each beat call so the user can watch them
// stream in (or speed-run them).
const LONG_STEPS  = ["research", "analyze_media", "plan", "choreograph_setup", "choreograph_beats", "choreograph_finalize", "sequence", "camera_director", "critique", "refine", "done"];

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5×", desc: "Slow / cinematic" },
  { value: 1,   label: "1×",   desc: "Real-time" },
  { value: 2,   label: "2×",   desc: "Fast / punchy" },
];

// Agent pace = how long to wait between each sub-agent decision.
// Lower = faster batch. Higher = visible streaming, easier to follow.
const AGENT_PACE_OPTIONS = [
  { value: 0,    label: "Instant", desc: "No delay between agents" },
  { value: 250,  label: "Fast",    desc: "0.25s between agents" },
  { value: 600,  label: "Live",    desc: "0.6s between agents (default)" },
  { value: 1500, label: "Cinema",  desc: "1.5s — watch each agent think" },
];

export default function KatagamiAIEditor() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [vibe, setVibe] = useState("");
  const [email, setEmail] = useState("");
  const [duration, setDurationSec] = useState(6); // 4-30s — > 8 triggers multi-agent loop
  const [speed, setSpeed] = useState(1);          // 0.5 / 1 / 2
  // Enhanced ad controls — user-adjustable agent count + keyframes per slide.
  // Each "slide" = one beat handled by one sub-agent. Keyframes-per-slide
  // controls how many chained motion presets that beat gets.
  const [slideCount, setSlideCount] = useState(20);    // 4–30 slides (sub-agents)
  const [kfPerSlide, setKfPerSlide] = useState(3);     // 1–6 keyframes per slide
  const [agentPace, setAgentPace] = useState(600);     // ms delay between sub-agents (real-time decision pacing)

  const [working, setWorking] = useState(null);   // current step name while in-flight
  const [messages, setMessages] = useState([]);   // [{step, output}]
  const [error, setError] = useState(null);
  const [renderUrl, setRenderUrl] = useState(null);
  const [running, setRunning] = useState(false);
  const [openingStudio, setOpeningStudio] = useState(false);
  // Captured outputs from the agent loop — used to pass the full keyframe
  // chain into Cháoxiào when "Open in Cháoxiào" is clicked.
  const [choreograph, setChoreograph] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [cameraPlan, setCameraPlan] = useState(null); // { cuts: [...], reasoning }
  const [finalPlan, setFinalPlan] = useState(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  // Optional MP3/audio track — uploaded by user, forwarded to Cháoxiào via ?audio=
  const [audioFile, setAudioFile] = useState(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  // Hand off the current setup to UltraMock (Cháoxiào嘲笑) studio.
  //
  // If the agent loop has already produced a choreograph (and optional sequence),
  // we pass the FULL ordered preset chain via `chain=` so UltraMock's auto-render
  // flow applies every sub-agent keyframe to the timeline on load — that way
  // the preview tab shows all keyframes immediately, ready for manual tweaking.
  //
  // Note: UltraMock's auto-render currently auto-records on load. We override
  // that by passing `apply=1` instead of `auto=1` so the user lands in the
  // editor with everything pre-applied (no auto-recording).
  const openInChaoxiao = async () => {
    if (openingStudio || running) return;
    setOpeningStudio(true);
    try {
      const params = new URLSearchParams();
      const headline = (finalPlan?.tagline || vibe.split("\n")[0] || "").slice(0, 80);
      if (headline) params.set("text", headline);

      // Use the choreograph total when present, otherwise fall back to the user's slider value
      const totalDur = choreograph?.total_duration || duration;
      params.set("duration", String(totalDur));
      if (speed !== 1) params.set("speed", String(speed));

      // Background, device, camera from the refined plan when available
      if (finalPlan?.background) params.set("background", finalPlan.background);
      if (finalPlan?.device) params.set("device", finalPlan.device);
      if (finalPlan?.camera_preset) params.set("camera", finalPlan.camera_preset);

      // Build the chain: prefer the master director's globally-sequenced order,
      // fall back to the raw sub-agent beat order.
      let chainIds = [];
      if (Array.isArray(sequence?.ordered_preset_ids) && sequence.ordered_preset_ids.length > 0) {
        chainIds = sequence.ordered_preset_ids;
      } else if (choreograph?.segments?.length) {
        for (const seg of choreograph.segments) {
          const ids = Array.isArray(seg.preset_ids) ? seg.preset_ids : [seg.preset_id];
          chainIds.push(...ids);
        }
      } else if (finalPlan?.preset_id) {
        chainIds = [finalPlan.preset_id];
      }
      if (chainIds.length > 0) params.set("chain", chainIds.join(","));

      // Per-beat text track — ALL the sub-agent script lines (one per beat).
      // We pass them as a single base64'd JSON blob so newlines/quotes survive.
      // Also includes per-beat text_only flag (hide device that beat) and
      // per-beat device swap so the ad can swap iphone↔macbook etc.
      if (choreograph?.segments?.length) {
        const beats = choreograph.segments.map((s) => ({
          t: s.text || "",
          a: s.text_animation || "pop",
          x: s.text_x ?? 50,
          y: s.text_y ?? 12,
          d: s.duration || 1.5,
          to: !!s.text_only,
          dv: s.device || "",
          fw: s.font_weight || 900,
        }));
        try {
          const blob = btoa(unescape(encodeURIComponent(JSON.stringify(beats))));
          params.set("beats", blob);
        } catch { /* ignore */ }

        // Forward the dominant AI background prompt so UltraMock generates a
        // single modern background for the whole ad.
        const dominantBg = (choreograph.segments.find(s => s.bg_prompt)?.bg_prompt || "").trim();
        if (dominantBg) params.set("bg_prompt", dominantBg.slice(0, 200));
      }

      // Camera director cuts — passed as comma-separated preset|duration pairs
      if (cameraPlan?.cuts?.length) {
        const camPlan = cameraPlan.cuts
          .map((c) => `${c.camera_preset}:${(c.duration_sec || 0).toFixed(2)}`)
          .join(",");
        params.set("camplan", camPlan);
      }

      // Media — reuse already-uploaded URL when available, otherwise upload now
      let mediaUrl = uploadedMediaUrl;
      if (!mediaUrl && file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        mediaUrl = file_url;
      }
      if (mediaUrl) params.set("media", mediaUrl);

      // Audio (MP3/WAV/etc) — upload if needed and forward as ?audio=
      let audioUrl = uploadedAudioUrl;
      if (!audioUrl && audioFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
        audioUrl = file_url;
        setUploadedAudioUrl(file_url);
      }
      if (audioUrl) params.set("audio", audioUrl);

      // `auto=1` triggers UltraMock to apply chain → record → download. For the
      // "open for editing" handoff we want the chain applied but no recording,
      // so we pass `apply=1` (handled in UltraMock's auto-apply branch).
      if (chainIds.length > 0 || mediaUrl) params.set("apply", "1");

      window.open(`/UltraMock?${params.toString()}`, "_blank");
    } catch (e) {
      setError(e.message || "Could not open studio");
    } finally {
      setOpeningStudio(false);
    }
  };

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
    setChoreograph(null);
    setSequence(null);
    setCameraPlan(null);
    setFinalPlan(null);
    setUploadedMediaUrl(null);
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
    setChoreograph(null);
    setSequence(null);
    setCameraPlan(null);
    setFinalPlan(null);
    setUploadedMediaUrl(null);
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
      setUploadedMediaUrl(file_url);

      const media_type = file.type.startsWith("video/") ? "video" : "image";
      // Long-form mode is ON whenever the user wants more than 1 slide.
      // Each slide = one sub-agent beat.
      const isLong = slideCount > 1 && duration > 4;
      const segmentCount = isLong ? slideCount : 0;
      const STEPS = isLong ? LONG_STEPS : SHORT_STEPS;

      let state = {
        media_url: file_url,
        media_type,
        vibe,
        email: email.trim() || undefined,
        target_duration: duration,
        segment_count: segmentCount,
        keyframes_per_segment: kfPerSlide,
        speed,
      };

      // Helper: invoke a single agent step.
      const invokeStep = async (step, extraState = {}) => {
        setWorking(step);
        const res = await base44.functions.invoke("katagamiMasterAgent", { step, state: { ...state, ...extraState } });
        const data = res?.data;
        if (!data || data.error) throw new Error(data?.error || `Step ${step} failed`);
        return data;
      };
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      // Walk through every step. `choreograph_beats` is a virtual step that
      // expands into N real `choreograph_beat` calls — one per sub-agent —
      // each producing a streaming live update.
      for (const step of STEPS) {
        if (step === "choreograph_beats") {
          // Pull setup info that choreograph_setup just returned
          const setup = state.choreograph_setup;
          if (!setup) continue;
          const segCount = setup.segment_count;
          const segments = [];

          // Show a progress bubble in the transcript that we'll update as each
          // sub-agent commits.
          setMessages((prev) => [...prev, {
            step: "choreograph_beats",
            output: { segments: [], segment_count: segCount, in_progress: true },
          }]);

          for (let i = 0; i < segCount; i++) {
            setWorking(`choreograph_beat_${i + 1}`);
            const data = await invokeStep("choreograph_beat", { beat_index: i, segments });
            const seg = data.output?.segment;
            if (seg) segments.push(seg);

            // Live-update the in-progress bubble with the new segment
            setMessages((prev) => prev.map((m, idx) => (
              idx === prev.length - 1 && m.step === "choreograph_beats"
                ? { ...m, output: { ...m.output, segments: [...segments], in_progress: i + 1 < segCount } }
                : m
            )));

            // Real-time decision pacing — let the user actually watch the agents
            if (agentPace > 0 && i + 1 < segCount) await sleep(agentPace);
          }

          state = { ...state, segments };
          continue;
        }

        const data = await invokeStep(step);
        // Append step output to transcript (skip choreograph_setup since the
        // beats stream their own bubble; we still merge its output into state).
        if (step !== "choreograph_setup") {
          setMessages((prev) => [...prev, { step, output: data.output }]);
        }

        // Merge step output into running state under that step's key
        if (step === "research")                state = { ...state, research: data.output };
        else if (step === "analyze_media")      state = { ...state, analysis: data.output };
        else if (step === "plan")               state = { ...state, plan: data.output };
        else if (step === "choreograph_setup")  state = { ...state, choreograph_setup: data.output };
        else if (step === "choreograph_finalize") {
          state = { ...state, choreograph: data.output };
          setChoreograph(data.output);
        }
        else if (step === "sequence")           { state = { ...state, sequence: data.output };    setSequence(data.output); }
        else if (step === "camera_director")    { state = { ...state, camera_director: data.output }; setCameraPlan(data.output); }
        else if (step === "critique")           state = { ...state, critique: data.output };
        else if (step === "refine")             { state = { ...state, plan: data.output };        setFinalPlan(data.output); }
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
                const isActive = vibe === p.vibe && duration === p.duration && speed === p.speed && slideCount === p.slides && kfPerSlide === p.kf;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setVibe(p.vibe);
                      setDurationSec(p.duration);
                      setSpeed(p.speed);
                      setSlideCount(p.slides);
                      setKfPerSlide(p.kf);
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

          {/* Enhanced Ad Controls — agents, keyframes per slide, duration */}
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-950/40 to-orange-950/30 border border-fuchsia-500/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
                <Sparkles className="w-3 h-3" /> Enhanced Ad
              </div>
              <div className="text-[10px] font-mono tabular-nums text-white/70">
                {slideCount} slides × {kfPerSlide} kfs = <span className="text-fuchsia-300 font-bold">{slideCount * kfPerSlide}</span> keyframes
              </div>
            </div>

            {/* Slides (sub-agents) */}
            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Slides / Sub-agents</span>
                <span className="text-fuchsia-300 font-mono">{slideCount}</span>
              </label>
              <input
                type="range"
                min={4}
                max={30}
                step={1}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                disabled={running}
                className="w-full accent-fuchsia-400"
              />
              <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
                <span>4</span><span>20 (default)</span><span>30</span>
              </div>
            </div>

            {/* Keyframes per slide */}
            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Keyframes / Slide</span>
                <span className="text-fuchsia-300 font-mono">{kfPerSlide}</span>
              </label>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={kfPerSlide}
                onChange={(e) => setKfPerSlide(Number(e.target.value))}
                disabled={running}
                className="w-full accent-fuchsia-400"
              />
              <div className="flex justify-between text-[9px] text-white/30 mt-0.5">
                <span>1 (simple)</span><span>3 (rich)</span><span>6 (max)</span>
              </div>
            </div>

            {/* Duration estimate */}
            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Total Duration</span>
                <span className="text-fuchsia-300 font-mono">{duration}s</span>
              </label>
              <input
                type="range"
                min={4}
                max={60}
                step={1}
                value={duration}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                disabled={running}
                className="w-full accent-fuchsia-400"
              />
              <div className="text-[10px] text-white/50 mt-1 flex items-center justify-between">
                <span>~{(duration / slideCount).toFixed(2)}s per slide</span>
                <span>~{((duration / slideCount) / kfPerSlide).toFixed(2)}s per keyframe</span>
              </div>
            </div>
          </div>

          {/* Agent pace — controls the delay between sub-agents during real-time decisions */}
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Agent pace <span className="text-white/30 normal-case font-normal text-[10px]">— how fast sub-agents stream their decisions</span>
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {AGENT_PACE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAgentPace(opt.value)}
                  disabled={running}
                  title={opt.desc}
                  className={`h-8 rounded-md text-[10px] font-bold transition-colors ${
                    agentPace === opt.value
                      ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
                  className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-colors ${
                    speed === opt.value
                      ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {opt.label} <span className="font-normal text-[9px] opacity-60">· {opt.desc.split(" / ")[0]}</span>
                </button>
              ))}
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

          {/* MP3 / Music track — optional, ingested by Cháoxiào on handoff */}
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Music className="w-3 h-3 text-emerald-300" /> Music (optional MP3)
            </label>
            <input
              ref={audioRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setAudioFile(f);
                setUploadedAudioUrl(null);
                e.target.value = "";
              }}
            />
            {!audioFile ? (
              <button
                type="button"
                onClick={() => audioRef.current?.click()}
                disabled={running}
                className="w-full h-10 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" /> Upload MP3 / Audio
              </button>
            ) : (
              <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-100 text-xs">
                <Music className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate flex-1" title={audioFile.name}>{audioFile.name}</span>
                <span className="text-[9px] text-emerald-300/70 font-mono">
                  {uploadedAudioUrl ? "uploaded" : `${(audioFile.size / 1024 / 1024).toFixed(1)}mb`}
                </span>
                <button
                  type="button"
                  onClick={() => { setAudioFile(null); setUploadedAudioUrl(null); }}
                  disabled={running || uploadingAudio}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/40 opacity-70 hover:opacity-100"
                  title="Remove audio"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-[10px] text-white/40 mt-1">
              Forwarded to Cháoxiào and played in sync with the timeline preview.
            </div>
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

          {/* Open in Cháoxiào — hand off to the manual UltraMock studio */}
          <button
            onClick={openInChaoxiao}
            disabled={running || openingStudio}
            title="Open this setup in the Cháoxiào (嘲笑) studio for manual editing"
            className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-fuchsia-400/40 disabled:opacity-40 disabled:cursor-not-allowed text-white/90 font-bold text-xs tracking-wide flex items-center justify-center gap-2"
          >
            {openingStudio ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Opening…</>
            ) : (
              <>
                <span className="text-base leading-none">嘲笑</span>
                Open in Cháoxiào
                <ExternalLink className="w-3 h-3 opacity-60" />
              </>
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