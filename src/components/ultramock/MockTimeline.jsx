import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Play, Pause, Trash2, Video, Loader2, SkipBack, Film, Wand2, Layers, Replace } from "lucide-react";
import { MOTION_PRESETS } from "./motionPresets";

/**
 * Timeline that animates {rotX, rotY, scale} between keyframes.
 * - Add keyframes at the playhead from current values
 * - Scrub via the playhead bar
 * - Play interpolates and writes back to parent state every frame
 * - Record uses MediaRecorder over a copy <canvas> filled by html2canvas frames
 *   (we accept the html2canvas/getCanvasFrame callback from parent for accuracy)
 *
 * Exposes imperative API via ref:
 *   - applyPresetById(id, mode?)  // mode: "append" | "replace"
 *   - clearKeyframes()
 *   - recordVideo()
 *   - getKeyframes()
 */
const MockTimeline = forwardRef(function MockTimeline({
  rotX, rotY, scale,
  setRotX, setRotY, setScale,
  x, y, setX, setY, // optional position animation
  duration = 4, // seconds
  setDuration,
  captureFrame, // async () => HTMLCanvasElement
}, ref) {
  const [keyframes, setKeyframes] = useState([
    { t: 0, rotX: 0, rotY: 0, scale: 1 },
  ]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  // "append" = chain preset at playhead (multi-add). "replace" = wipe & set.
  const [presetMode, setPresetMode] = useState("append");
  // How long each appended preset takes (seconds). Independent of total duration.
  const [presetSegment, setPresetSegment] = useState(2);

  const playStartRef = useRef(0);
  const playFromRef = useRef(0);
  const rafRef = useRef(null);

  // Track whether the current keyframe set animates position (x/y).
  // When false, we leave x/y untouched at playback time.
  const animatesPosition = keyframes.some(
    (k) => typeof k.x === "number" || typeof k.y === "number"
  );

  // Interpolate value at time t given sorted keyframes.
  // x/y are returned only if at least one keyframe defines them.
  const sample = useCallback((t, kfs) => {
    if (!kfs.length) return { rotX: 0, rotY: 0, scale: 1 };
    const sorted = [...kfs].sort((a, b) => a.t - b.t);
    const hasPos = sorted.some((k) => typeof k.x === "number" || typeof k.y === "number");

    const pick = (kf) => ({
      rotX: kf.rotX,
      rotY: kf.rotY,
      scale: kf.scale,
      ...(hasPos ? { x: kf.x, y: kf.y } : {}),
    });

    if (t <= sorted[0].t) return pick(sorted[0]);
    if (t >= sorted[sorted.length - 1].t) return pick(sorted[sorted.length - 1]);

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const k = (t - a.t) / span;
        // ease-in-out cubic
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const out = {
          rotX: a.rotX + (b.rotX - a.rotX) * e,
          rotY: a.rotY + (b.rotY - a.rotY) * e,
          scale: a.scale + (b.scale - a.scale) * e,
        };
        if (hasPos) {
          const ax = typeof a.x === "number" ? a.x : (typeof b.x === "number" ? b.x : undefined);
          const bx = typeof b.x === "number" ? b.x : ax;
          const ay = typeof a.y === "number" ? a.y : (typeof b.y === "number" ? b.y : undefined);
          const by = typeof b.y === "number" ? b.y : ay;
          if (typeof ax === "number" && typeof bx === "number") out.x = ax + (bx - ax) * e;
          if (typeof ay === "number" && typeof by === "number") out.y = ay + (by - ay) * e;
        }
        return out;
      }
    }
    return { rotX: 0, rotY: 0, scale: 1 };
  }, []);

  // Apply playhead → state when scrubbing or playing
  const applyAtTime = useCallback(
    (t) => {
      const v = sample(t, keyframes);
      setRotX(v.rotX);
      setRotY(v.rotY);
      setScale(v.scale);
      if (typeof v.x === "number" && setX) setX(v.x);
      if (typeof v.y === "number" && setY) setY(v.y);
    },
    [keyframes, sample, setRotX, setRotY, setScale, setX, setY]
  );

  // Playback loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    playStartRef.current = performance.now();
    playFromRef.current = playhead >= duration ? 0 : playhead;
    if (playhead >= duration) setPlayhead(0);

    const tick = () => {
      const elapsed = (performance.now() - playStartRef.current) / 1000;
      const t = playFromRef.current + elapsed;
      if (t >= duration) {
        setPlayhead(duration);
        applyAtTime(duration);
        setPlaying(false);
        return;
      }
      setPlayhead(t);
      applyAtTime(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const addKeyframe = () => {
    const t = Math.round(playhead * 100) / 100;
    setKeyframes((prev) => {
      const filtered = prev.filter((k) => Math.abs(k.t - t) > 0.01);
      // If existing keyframes carry position, capture the new one with position too,
      // so position keeps animating consistently.
      const carriesPos = prev.some((k) => typeof k.x === "number" || typeof k.y === "number");
      const next = { t, rotX, rotY, scale };
      if (carriesPos && typeof x === "number" && typeof y === "number") {
        next.x = x;
        next.y = y;
      }
      return [...filtered, next].sort((a, b) => a.t - b.t);
    });
  };

  const removeKeyframe = (idx) => {
    setKeyframes((prev) => prev.filter((_, i) => i !== idx));
  };

  const jumpToKey = (kf) => {
    setPlayhead(kf.t);
    setRotX(kf.rotX);
    setRotY(kf.rotY);
    setScale(kf.scale);
    if (typeof kf.x === "number" && setX) setX(kf.x);
    if (typeof kf.y === "number" && setY) setY(kf.y);
  };

  const applyPreset = (preset) => {
    const start = (typeof x === "number" && typeof y === "number") ? { x, y } : undefined;

    if (presetMode === "replace") {
      // REPLACE: wipe everything, set preset across the full duration.
      const kfs = preset.build(duration, start).map((k) => ({
        ...k,
        t: Math.max(0, Math.min(duration, k.t)),
      }));
      setKeyframes(kfs);
      setPlayhead(0);
      if (kfs[0]) {
        setRotX(kfs[0].rotX);
        setRotY(kfs[0].rotY);
        setScale(kfs[0].scale);
        if (typeof kfs[0].x === "number" && setX) setX(kfs[0].x);
        if (typeof kfs[0].y === "number" && setY) setY(kfs[0].y);
      }
      return;
    }

    // APPEND: chain preset onto the timeline starting at the playhead (or at the
    // last keyframe if it's later). Each preset gets `presetSegment` seconds.
    const segLen = Math.max(0.5, presetSegment);
    const lastKeyT = keyframes.length ? Math.max(...keyframes.map((k) => k.t)) : 0;
    const startT = Math.max(playhead, lastKeyT);
    const segDuration = segLen;

    // Build preset relative to its own segment, then offset to startT.
    const segKfs = preset.build(segDuration, start).map((k) => ({
      ...k,
      t: startT + Math.max(0, Math.min(segDuration, k.t)),
    }));

    // Auto-extend total duration if the chain runs past it.
    const newEnd = startT + segDuration;
    if (newEnd > duration && setDuration) {
      setDuration(Math.ceil(newEnd * 2) / 2); // round up to nearest 0.5s
    }

    setKeyframes((prev) => {
      // Drop any keyframes inside the new segment to avoid clashing diamonds.
      const kept = prev.filter((k) => k.t < startT - 0.01);
      return [...kept, ...segKfs].sort((a, b) => a.t - b.t);
    });
    setPlayhead(startT);
  };

  const onScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = Math.max(0, Math.min(duration, (x / rect.width) * duration));
    setPlayhead(t);
    applyAtTime(t);
  };

  const reset = () => {
    setPlayhead(0);
    applyAtTime(0);
    setPlaying(false);
  };

  // Imperative API for the AI agent
  useImperativeHandle(ref, () => ({
    applyPresetById: (id, mode = "replace") => {
      const preset = MOTION_PRESETS.find((p) => p.id === id);
      if (!preset) return false;
      const prevMode = presetMode;
      setPresetMode(mode);
      // Run apply with the requested mode by calling logic directly (avoids waiting on state)
      const start = (typeof x === "number" && typeof y === "number") ? { x, y } : undefined;
      if (mode === "replace") {
        const kfs = preset.build(duration, start).map((k) => ({
          ...k,
          t: Math.max(0, Math.min(duration, k.t)),
        }));
        setKeyframes(kfs);
        setPlayhead(0);
        if (kfs[0]) {
          setRotX(kfs[0].rotX); setRotY(kfs[0].rotY); setScale(kfs[0].scale);
          if (typeof kfs[0].x === "number" && setX) setX(kfs[0].x);
          if (typeof kfs[0].y === "number" && setY) setY(kfs[0].y);
        }
      } else {
        const segLen = Math.max(0.5, presetSegment);
        const lastKeyT = keyframes.length ? Math.max(...keyframes.map((k) => k.t)) : 0;
        const startT = Math.max(playhead, lastKeyT);
        const segKfs = preset.build(segLen, start).map((k) => ({
          ...k,
          t: startT + Math.max(0, Math.min(segLen, k.t)),
        }));
        const newEnd = startT + segLen;
        if (newEnd > duration && setDuration) {
          setDuration(Math.ceil(newEnd * 2) / 2);
        }
        setKeyframes((prev) => {
          const kept = prev.filter((k) => k.t < startT - 0.01);
          return [...kept, ...segKfs].sort((a, b) => a.t - b.t);
        });
        setPlayhead(startT);
      }
      // restore mode after
      setTimeout(() => setPresetMode(prevMode), 0);
      return true;
    },
    clearKeyframes: () => {
      setKeyframes([{ t: 0, rotX: 0, rotY: 0, scale: 1 }]);
      setPlayhead(0);
    },
    recordVideo: () => recordVideo(),
    getKeyframes: () => keyframes,
    isRecording: () => recording,
  }));

  // Record: walk timeline at fixed FPS, capture each frame, encode to WebM
  const recordVideo = async () => {
    if (!captureFrame || recording || keyframes.length < 2) return;
    setRecording(true);
    setRecordProgress(0);
    setPlaying(false);

    const fps = 30;
    const totalFrames = Math.round(duration * fps);

    try {
      // Get one frame to learn target size
      applyAtTime(0);
      await new Promise((r) => requestAnimationFrame(r));
      const first = await captureFrame();
      const W = first.width;
      const H = first.height;

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");
      ctx.drawImage(first, 0, 0);

      const stream = out.captureStream(fps);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

      const done = new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      });

      recorder.start();

      for (let i = 0; i <= totalFrames; i++) {
        const t = (i / totalFrames) * duration;
        setPlayhead(t);
        applyAtTime(t);
        // wait two RAFs so React + transform settle
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const frame = await captureFrame();
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(frame, 0, 0, W, H);
        setRecordProgress(i / totalFrames);
        // pace to fps
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ultramock-${Date.now()}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Recording failed: " + err.message);
    }
    setRecording(false);
    setRecordProgress(0);
  };

  return (
    <div className="mt-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl p-4 space-y-3">
      {/* Top row: transport + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={reset}
            disabled={recording}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-40"
            title="Reset to start"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={recording || keyframes.length < 2}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={addKeyframe}
            disabled={recording}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-200 text-xs font-bold disabled:opacity-40"
            title="Add keyframe at playhead with current rotation/scale"
          >
            <Plus className="w-3.5 h-3.5" /> Keyframe
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-white/50">
            Duration
            <input
              type="number"
              min="1"
              max="30"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 1)}
              disabled={recording}
              className="w-14 h-7 px-2 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-white/30"
            />
            <span>s</span>
          </label>
          <button
            onClick={recordVideo}
            disabled={recording || keyframes.length < 2}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-red-500/30"
            title={keyframes.length < 2 ? "Add at least 2 keyframes" : "Record WebM video"}
          >
            {recording ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {Math.round(recordProgress * 100)}%
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" /> Record MP4
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset mode + segment length controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
          <Wand2 className="w-3 h-3" /> Presets
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setPresetMode("append")}
            disabled={recording}
            className={`flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-bold transition-colors ${
              presetMode === "append"
                ? "bg-orange-400 text-black"
                : "text-white/60 hover:text-white"
            }`}
            title="Chain preset onto the timeline at the current playhead"
          >
            <Layers className="w-3 h-3" /> Chain
          </button>
          <button
            onClick={() => setPresetMode("replace")}
            disabled={recording}
            className={`flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-bold transition-colors ${
              presetMode === "replace"
                ? "bg-cyan-400 text-black"
                : "text-white/60 hover:text-white"
            }`}
            title="Wipe timeline and apply preset across full duration"
          >
            <Replace className="w-3 h-3" /> Replace
          </button>
        </div>
        {presetMode === "append" && (
          <label className="flex items-center gap-1 text-[10px] text-white/50">
            Each
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={presetSegment}
              onChange={(e) => setPresetSegment(Number(e.target.value) || 1)}
              disabled={recording}
              className="w-12 h-6 px-1.5 rounded bg-white/5 border border-white/10 text-white text-[10px] outline-none focus:border-white/30"
            />
            <span>s</span>
          </label>
        )}
        <span className="text-[10px] text-white/30 ml-auto">
          {presetMode === "append"
            ? `Adds at ${Math.max(playhead, keyframes.length ? Math.max(...keyframes.map((k) => k.t)) : 0).toFixed(2)}s`
            : "Replaces all keys"}
        </span>
      </div>

      {/* Motion preset chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {MOTION_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            disabled={recording}
            title={`${p.desc}${presetMode === "append" ? " — chains onto timeline" : " — replaces timeline"}`}
            className={`flex-shrink-0 px-2.5 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-[11px] font-bold transition-colors disabled:opacity-40 ${
              presetMode === "append"
                ? "hover:border-orange-400/50"
                : "hover:border-cyan-400/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time ruler + scrubber */}
      <div
        onClick={onScrub}
        className="relative h-14 rounded-lg bg-white/[0.03] border border-white/10 cursor-pointer select-none overflow-hidden"
      >
        {/* Tick marks */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-white/10 text-[9px] text-white/30 pl-1 pt-0.5"
              style={{ left: `${(i / duration) * 100}%` }}
            >
              {i}s
            </div>
          ))}
        </div>

        {/* Keyframe diamonds */}
        {keyframes.map((kf, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); jumpToKey(kf); }}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-400 border border-orange-200 rotate-45 hover:scale-125 transition-transform shadow-md shadow-orange-500/50 z-10"
            style={{ left: `calc(${(kf.t / duration) * 100}% - 6px)` }}
            title={`Keyframe @ ${kf.t.toFixed(2)}s · X${Math.round(kf.rotX)}° Y${Math.round(kf.rotY)}° S${Math.round(kf.scale * 100)}%`}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
          style={{ left: `${(playhead / duration) * 100}%`, boxShadow: "0 0 8px rgba(34,211,238,0.8)" }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
        </div>
      </div>

      {/* Keyframe list */}
      {keyframes.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-wider flex-shrink-0">
            <Film className="w-3 h-3" /> {keyframes.length} key{keyframes.length === 1 ? "" : "s"}
          </div>
          {keyframes.map((kf, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70 font-mono"
            >
              <button onClick={() => jumpToKey(kf)} className="hover:text-white">
                {kf.t.toFixed(2)}s · {Math.round(kf.rotY)}°
              </button>
              <button
                onClick={() => removeKeyframe(i)}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/30 text-white/40 hover:text-red-300"
                title="Delete keyframe"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-white/30">
        💡 <span className="text-orange-300">Chain</span> mode stacks presets — click multiple presets in a row to build sequences (e.g. <em>Slide In → Chat Zoom → Words Pop</em>). Click a keyframe diamond first to insert there. Output: WebM video.
      </p>
    </div>
  );
});

export default MockTimeline;