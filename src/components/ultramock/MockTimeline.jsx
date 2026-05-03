import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Play, Pause, Trash2, Video, Loader2, SkipBack, Film, Wand2, Layers, Replace, Eye, EyeOff, Camera } from "lucide-react";
import { MOTION_PRESETS } from "./motionPresets";
import { CAMERA_PRESETS } from "./cameraPresets";

/**
 * Multi-track timeline — like a real video editor.
 *
 * Tracks are stored as a Map<itemId, keyframes[]>. Each item with keyframes
 * gets its own row. Playback samples every track in parallel and writes back
 * to the matching items via `updateItem(id, partial)`.
 *
 * Imperative API (ref):
 *   - applyPresetById(id, mode?)   // applies to currently selected item
 *   - clearKeyframes()             // clears tracks of selected item
 *   - clearAllTracks()             // clears every track
 *   - recordVideo()
 *   - getKeyframes()               // selected item's keyframes
 */
const MockTimeline = forwardRef(function MockTimeline({
  items,                  // all canvas items
  selectedId,             // currently focused item id
  updateItem,             // (id, partial) => void
  duration = 4,
  setDuration,
  captureFrame,           // async () => HTMLCanvasElement
  camera,                 // { zoom, x, y } — current camera state
  setCamera,              // setter to drive the canvas viewport
}, ref) {
  // tracks: { [itemId]: Keyframe[] }
  const [tracks, setTracks] = useState({});
  // Camera track — list of camera keyframes { t, zoom, x, y }
  const [cameraTrack, setCameraTrack] = useState([]);
  const [cameraHidden, setCameraHidden] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [presetMode, setPresetMode] = useState("append");
  const [presetSegment, setPresetSegment] = useState(2);
  const [hiddenTracks, setHiddenTracks] = useState({}); // mute a track without deleting

  const playStartRef = useRef(0);
  const playFromRef = useRef(0);
  const rafRef = useRef(null);

  const selected = items.find((i) => i.id === selectedId) || null;
  const selectedKfs = (selected && tracks[selected.id]) || [];
  const trackEntries = Object.entries(tracks).filter(([, kfs]) => kfs && kfs.length > 0);
  const hasAnyTrack = trackEntries.length > 0 || cameraTrack.length > 0;

  // Sample keyframes at time t
  const sample = useCallback((t, kfs) => {
    if (!kfs || !kfs.length) return null;
    const sorted = [...kfs].sort((a, b) => a.t - b.t);
    const hasPos = sorted.some((k) => typeof k.x === "number" || typeof k.y === "number");

    const pick = (kf) => ({
      rotX: kf.rotX, rotY: kf.rotY, scale: kf.scale,
      ...(hasPos ? { x: kf.x, y: kf.y } : {}),
    });

    if (t <= sorted[0].t) return pick(sorted[0]);
    if (t >= sorted[sorted.length - 1].t) return pick(sorted[sorted.length - 1]);

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const k = (t - a.t) / span;
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
    return null;
  }, []);

  // Sample camera keyframes at time t — interpolates zoom/x/y
  const sampleCamera = useCallback((t, kfs) => {
    if (!kfs || !kfs.length) return null;
    const sorted = [...kfs].sort((a, b) => a.t - b.t);
    if (t <= sorted[0].t) return { ...sorted[0] };
    if (t >= sorted[sorted.length - 1].t) return { ...sorted[sorted.length - 1] };
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t || 1;
        const k = (t - a.t) / span;
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        return {
          zoom: a.zoom + (b.zoom - a.zoom) * e,
          x: a.x + (b.x - a.x) * e,
          y: a.y + (b.y - a.y) * e,
        };
      }
    }
    return null;
  }, []);

  // Apply ALL tracks at time t in parallel
  const applyAtTime = useCallback((t) => {
    Object.entries(tracks).forEach(([id, kfs]) => {
      if (hiddenTracks[id]) return;
      const v = sample(t, kfs);
      if (!v) return;
      const partial = { rotX: v.rotX, rotY: v.rotY, scale: v.scale };
      if (typeof v.x === "number") partial.x = v.x;
      if (typeof v.y === "number") partial.y = v.y;
      updateItem(id, partial);
    });
    // Camera track
    if (!cameraHidden && cameraTrack.length > 0 && setCamera) {
      const c = sampleCamera(t, cameraTrack);
      if (c) setCamera(c);
    }
  }, [tracks, sample, updateItem, hiddenTracks, cameraTrack, cameraHidden, sampleCamera, setCamera]);

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

  // ── Keyframe operations on the SELECTED item ────────────────────────────
  const addKeyframe = () => {
    if (!selected) return;
    const t = Math.round(playhead * 100) / 100;
    setTracks((prev) => {
      const cur = prev[selected.id] || [];
      const filtered = cur.filter((k) => Math.abs(k.t - t) > 0.01);
      const carriesPos = cur.some((k) => typeof k.x === "number" || typeof k.y === "number");
      const next = {
        t,
        rotX: selected.rotX || 0,
        rotY: selected.rotY || 0,
        scale: selected.scale ?? 1,
      };
      if (carriesPos && typeof selected.x === "number" && typeof selected.y === "number") {
        next.x = selected.x;
        next.y = selected.y;
      }
      return { ...prev, [selected.id]: [...filtered, next].sort((a, b) => a.t - b.t) };
    });
  };

  const removeKeyframe = (itemId, idx) => {
    setTracks((prev) => {
      const cur = prev[itemId] || [];
      const next = cur.filter((_, i) => i !== idx);
      const out = { ...prev };
      if (next.length === 0) delete out[itemId];
      else out[itemId] = next;
      return out;
    });
  };

  const removeTrack = (itemId) => {
    setTracks((prev) => {
      const out = { ...prev };
      delete out[itemId];
      return out;
    });
  };

  const toggleTrackVisibility = (itemId) => {
    setHiddenTracks((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const jumpToKey = (itemId, kf) => {
    setPlayhead(kf.t);
    const partial = { rotX: kf.rotX, rotY: kf.rotY, scale: kf.scale };
    if (typeof kf.x === "number") partial.x = kf.x;
    if (typeof kf.y === "number") partial.y = kf.y;
    updateItem(itemId, partial);
  };

  // Apply preset to SELECTED item's track
  const applyPreset = (preset, targetId = null, modeOverride = null) => {
    const id = targetId || selected?.id;
    if (!id) return false;
    const item = items.find((i) => i.id === id);
    if (!item) return false;

    const mode = modeOverride || presetMode;
    const start = (typeof item.x === "number" && typeof item.y === "number") ? { x: item.x, y: item.y } : undefined;

    if (mode === "replace") {
      const kfs = preset.build(duration, start).map((k) => ({
        ...k,
        t: Math.max(0, Math.min(duration, k.t)),
      }));
      setTracks((prev) => ({ ...prev, [id]: kfs }));
      setPlayhead(0);
      if (kfs[0]) {
        const p = { rotX: kfs[0].rotX, rotY: kfs[0].rotY, scale: kfs[0].scale };
        if (typeof kfs[0].x === "number") p.x = kfs[0].x;
        if (typeof kfs[0].y === "number") p.y = kfs[0].y;
        updateItem(id, p);
      }
      return true;
    }

    // APPEND
    const segLen = Math.max(0.5, presetSegment);
    const cur = tracks[id] || [];
    const lastKeyT = cur.length ? Math.max(...cur.map((k) => k.t)) : 0;
    const startT = Math.max(playhead, lastKeyT);
    const segKfs = preset.build(segLen, start).map((k) => ({
      ...k,
      t: startT + Math.max(0, Math.min(segLen, k.t)),
    }));

    const newEnd = startT + segLen;
    if (newEnd > duration && setDuration) {
      setDuration(Math.ceil(newEnd * 2) / 2);
    }

    setTracks((prev) => {
      const cur2 = prev[id] || [];
      const kept = cur2.filter((k) => k.t < startT - 0.01);
      return { ...prev, [id]: [...kept, ...segKfs].sort((a, b) => a.t - b.t) };
    });
    setPlayhead(startT);
    return true;
  };

  // ── Camera track operations ─────────────────────────────────────────────
  const applyCameraPreset = (preset, modeOverride = null) => {
    const mode = modeOverride || presetMode;
    // Use the currently selected item as the camera focus target
    const target = (selected && typeof selected.x === "number" && typeof selected.y === "number")
      ? { x: selected.x, y: selected.y }
      : null;

    if (mode === "replace" || cameraTrack.length === 0) {
      const kfs = preset.build(duration, target).map((k) => ({
        ...k, t: Math.max(0, Math.min(duration, k.t)),
      }));
      setCameraTrack(kfs);
      setPlayhead(0);
      if (kfs[0] && setCamera) setCamera({ zoom: kfs[0].zoom, x: kfs[0].x, y: kfs[0].y });
      return true;
    }

    // APPEND
    const segLen = Math.max(0.5, presetSegment);
    const lastKeyT = cameraTrack.length ? Math.max(...cameraTrack.map((k) => k.t)) : 0;
    const startT = Math.max(playhead, lastKeyT);
    const segKfs = preset.build(segLen, target).map((k) => ({
      ...k, t: startT + Math.max(0, Math.min(segLen, k.t)),
    }));
    const newEnd = startT + segLen;
    if (newEnd > duration && setDuration) setDuration(Math.ceil(newEnd * 2) / 2);

    const kept = cameraTrack.filter((k) => k.t < startT - 0.01);
    setCameraTrack([...kept, ...segKfs].sort((a, b) => a.t - b.t));
    setPlayhead(startT);
    return true;
  };

  const addCameraKeyframe = () => {
    if (!camera) return;
    const t = Math.round(playhead * 100) / 100;
    setCameraTrack((prev) => {
      const filtered = prev.filter((k) => Math.abs(k.t - t) > 0.01);
      return [...filtered, { t, zoom: camera.zoom, x: camera.x, y: camera.y }].sort((a, b) => a.t - b.t);
    });
  };

  const removeCameraKeyframe = (idx) => {
    setCameraTrack((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearCameraTrack = () => {
    setCameraTrack([]);
    if (setCamera) setCamera({ zoom: 1, x: 50, y: 50 });
  };

  const jumpToCameraKey = (kf) => {
    setPlayhead(kf.t);
    if (setCamera) setCamera({ zoom: kf.zoom, x: kf.x, y: kf.y });
  };

  // ── Scrubbing ───────────────────────────────────────────────────────────
  const scrubTrackRef = useRef(null);
  const scrubbingRef = useRef(false);

  const scrubAtClientX = useCallback((clientX) => {
    const el = scrubTrackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const t = Math.max(0, Math.min(duration, (px / rect.width) * duration));
    setPlayhead(t);
    applyAtTime(t);
  }, [duration, applyAtTime]);

  const onScrubPointerDown = (e) => {
    if (recording) return;
    e.preventDefault();
    scrubbingRef.current = true;
    setPlaying(false);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    scrubAtClientX(e.clientX);
  };
  const onScrubPointerMove = (e) => {
    if (!scrubbingRef.current) return;
    e.preventDefault();
    scrubAtClientX(e.clientX);
  };
  const onScrubPointerUp = (e) => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
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
      return applyPreset(preset, null, mode);
    },
    clearKeyframes: () => {
      if (selected) removeTrack(selected.id);
    },
    clearAllTracks: () => {
      setTracks({});
      setPlayhead(0);
    },
    recordVideo: () => recordVideo(),
    getKeyframes: () => selectedKfs,
    isRecording: () => recording,
  }));

  // ── Recording ───────────────────────────────────────────────────────────
  // REAL-TIME RECORDER: animates the canvas at wall-clock speed and lets
  // MediaRecorder sample it continuously. A 4s animation = exactly 4s of video.
  // We use html2canvas at ~12 fps in the background and paint into an output
  // canvas that the recorder is streaming from at its native cadence.
  const recordVideo = async () => {
    if (!captureFrame || recording || !hasAnyTrack) return;
    setRecording(true);
    setRecordProgress(0);
    setPlaying(false);

    // Try to keep the screen / page awake during recording (best effort).
    let wakeLock = null;
    try {
      if (navigator.wakeLock?.request) {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch { /* ignore */ }

    try {
      // Prime: capture one frame to learn dimensions
      applyAtTime(0);
      await new Promise((r) => requestAnimationFrame(r));
      const first = await captureFrame();
      if (!first || !first.width) {
        throw new Error("Could not capture canvas. Make sure the preview is visible.");
      }
      const W = first.width;
      const H = first.height;

      // Output canvas — recorder streams from this at real-time
      const out = document.createElement("canvas");
      out.width = W; out.height = H;
      const ctx = out.getContext("2d");
      ctx.drawImage(first, 0, 0);

      // captureStream(fps) — recorder samples the canvas at this rate AS WE PAINT.
      // No requestFrame() needed: 4s of recording = 4s of video.
      const RECORD_FPS = 30;
      const stream = out.captureStream(RECORD_FPS);

      // Pick best codec: MP4 if supported, else webm
      const mp4Candidates = [
        "video/mp4;codecs=avc1.640028",
        "video/mp4;codecs=avc1.42E01E",
        "video/mp4",
      ];
      const webmCandidates = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let mime = "";
      for (const c of mp4Candidates) {
        if (MediaRecorder.isTypeSupported(c)) { mime = c; break; }
      }
      if (!mime) {
        for (const c of webmCandidates) {
          if (MediaRecorder.isTypeSupported(c)) { mime = c; break; }
        }
      }
      const isMp4 = mime.startsWith("video/mp4");
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || (isMp4 ? "video/mp4" : "video/webm") }));
      });

      // ── PRERENDER → PLAYBACK STRATEGY ────────────────────────────────────
      // The previous "real-time capture" approach was choppy because html2canvas
      // is too slow (~80-150ms/frame) to keep up with 30fps wall-clock.
      //
      // New strategy:
      //   PHASE 1: Slowly pre-capture every single frame (30fps × duration).
      //            We don't care how long this takes — quality over speed.
      //            Each frame represents the EXACT correct moment in animation time.
      //   PHASE 2: Play those pre-rendered frames back into the recorder at
      //            EXACTLY 30fps wall-clock. The recorder captures the canvas
      //            stream, so the resulting MP4 is genuinely smooth — every
      //            frame is the true interpolated state at the right time.
      //
      // Result: video plays back exactly like "Play All" — real motion, not
      // frame-by-frame stutter.
      const FPS = 30;
      const totalFrames = Math.max(2, Math.round(duration * FPS));

      // PHASE 1: Pre-capture every frame
      setRecordProgress(0);
      const frames = [];
      for (let i = 0; i < totalFrames; i++) {
        const t = (i / (totalFrames - 1)) * duration;
        setPlayhead(t);
        applyAtTime(t);
        // Wait one paint so React commits the new transforms to DOM
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        try {
          const frame = await captureFrame();
          if (frame && frame.width) {
            // Copy to a dedicated bitmap so source canvas can be reused
            const bm = await createImageBitmap(frame);
            frames.push(bm);
          } else {
            frames.push(null);
          }
        } catch {
          frames.push(null);
        }
        // Update progress (phase 1 = first 80%)
        setRecordProgress((i / totalFrames) * 0.8);
      }

      // PHASE 2: Play back at exact 30fps into the recorder
      recorder.start();
      const playbackStart = performance.now();
      const frameInterval = 1000 / FPS;
      let lastFrameDrawn = -1;

      await new Promise((resolve) => {
        const playLoop = () => {
          const elapsed = performance.now() - playbackStart;
          const frameIdx = Math.min(totalFrames - 1, Math.floor(elapsed / frameInterval));
          if (frameIdx !== lastFrameDrawn) {
            const bm = frames[frameIdx];
            if (bm) {
              ctx.clearRect(0, 0, W, H);
              ctx.drawImage(bm, 0, 0, W, H);
            }
            lastFrameDrawn = frameIdx;
            setRecordProgress(0.8 + (frameIdx / totalFrames) * 0.2);
          }
          if (elapsed >= duration * 1000 + 100) {
            resolve();
            return;
          }
          requestAnimationFrame(playLoop);
        };
        requestAnimationFrame(playLoop);
      });

      // Hold last frame briefly so recorder catches it
      await new Promise((r) => setTimeout(r, 200));

      setRecordProgress(1);
      try { recorder.requestData(); } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 100));
      recorder.stop();

      // Free bitmaps
      frames.forEach((bm) => { try { bm?.close?.(); } catch {} });
      const blob = await done;
      if (!blob || blob.size === 0) {
        throw new Error("Recording produced an empty file. Try a shorter duration.");
      }
      const ext = isMp4 ? "mp4" : "webm";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ultramock-${Date.now()}.${ext}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch { /* ignore */ }
        URL.revokeObjectURL(url);
      }, 2000);
      try { await wakeLock?.release?.(); } catch { /* ignore */ }
      setRecording(false);
      setRecordProgress(0);
      return { blob, ext, mime: mime || (isMp4 ? "video/mp4" : "video/webm") };
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Recording failed: " + err.message);
      try { await wakeLock?.release?.(); } catch { /* ignore */ }
      setRecording(false);
      setRecordProgress(0);
      return null;
    }
  };

  // ── Helpers for track row labels ────────────────────────────────────────
  const labelFor = (item) => {
    if (!item) return "—";
    if (item.kind === "text") return `📝 ${(item.text || "Text").slice(0, 18)}`;
    if (item.kind === "overlay") return `✨ Overlay`;
    return `📱 ${item.device || "device"}`;
  };

  const trackColor = (idx) => {
    const palette = ["#fb923c", "#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"];
    return palette[idx % palette.length];
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
            disabled={recording || !hasAnyTrack}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? "Pause" : "Play All"}
          </button>
          <button
            onClick={addKeyframe}
            disabled={recording || !selected}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-200 text-xs font-bold disabled:opacity-40"
            title={selected ? "Add keyframe to selected item's track" : "Select an item first"}
          >
            <Plus className="w-3.5 h-3.5" /> Keyframe
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-white/50">
            Duration
            <input
              type="number" min="1" max="30" step="0.5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 1)}
              disabled={recording}
              className="w-14 h-7 px-2 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-white/30"
            />
            <span>s</span>
          </label>
          <button
            onClick={recordVideo}
            disabled={recording || !hasAnyTrack}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-red-500/30"
            title={!hasAnyTrack ? "Add keyframes to at least one item" : "Record WebM video"}
          >
            {recording ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {recordProgress < 0.8 ? `Rendering ${Math.round((recordProgress / 0.8) * 100)}%` : `Encoding ${Math.round(((recordProgress - 0.8) / 0.2) * 100)}%`}
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" /> Record MP4
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset mode + segment length */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-wider">
          <Wand2 className="w-3 h-3" /> Presets {selected ? `→ ${labelFor(selected)}` : ""}
        </div>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
          <button
            onClick={() => setPresetMode("append")}
            disabled={recording}
            className={`flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-bold transition-colors ${
              presetMode === "append" ? "bg-orange-400 text-black" : "text-white/60 hover:text-white"
            }`}
            title="Chain preset onto the timeline at the current playhead"
          >
            <Layers className="w-3 h-3" /> Chain
          </button>
          <button
            onClick={() => setPresetMode("replace")}
            disabled={recording}
            className={`flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-bold transition-colors ${
              presetMode === "replace" ? "bg-cyan-400 text-black" : "text-white/60 hover:text-white"
            }`}
            title="Wipe this item's track and apply preset across full duration"
          >
            <Replace className="w-3 h-3" /> Replace
          </button>
        </div>
        {presetMode === "append" && (
          <label className="flex items-center gap-1 text-[10px] text-white/50">
            Each
            <input
              type="number" min="0.5" max="10" step="0.5"
              value={presetSegment}
              onChange={(e) => setPresetSegment(Number(e.target.value) || 1)}
              disabled={recording}
              className="w-12 h-6 px-1.5 rounded bg-white/5 border border-white/10 text-white text-[10px] outline-none focus:border-white/30"
            />
            <span>s</span>
          </label>
        )}
        <button
          onClick={() => { setTracks({}); setCameraTrack([]); if (setCamera) setCamera({ zoom: 1, x: 50, y: 50 }); setPlayhead(0); }}
          disabled={recording || !hasAnyTrack}
          className="ml-auto flex items-center gap-1 px-2 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-bold disabled:opacity-30"
          title="Clear all tracks"
        >
          <Trash2 className="w-3 h-3" /> Clear All
        </button>
      </div>

      {/* Motion preset chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {MOTION_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            disabled={recording || !selected}
            title={selected ? `${p.desc} → ${labelFor(selected)}` : "Select an item first"}
            className={`flex-shrink-0 px-2.5 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-[11px] font-bold transition-colors disabled:opacity-40 ${
              presetMode === "append" ? "hover:border-orange-400/50" : "hover:border-cyan-400/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Camera preset chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-pink-300/80 font-bold uppercase tracking-wider pr-1">
          <Camera className="w-3 h-3" /> Camera
        </div>
        {CAMERA_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyCameraPreset(p)}
            disabled={recording}
            title={`${p.desc}${selected ? ` (target: ${labelFor(selected)})` : ""}`}
            className="flex-shrink-0 px-2.5 h-7 rounded-full bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/30 text-pink-200 hover:text-white text-[11px] font-bold transition-colors disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={addCameraKeyframe}
          disabled={recording}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 text-[11px] font-bold disabled:opacity-40"
          title="Add camera keyframe at playhead (uses current camera state)"
        >
          <Plus className="w-3 h-3" /> Cam Key
        </button>
      </div>

      {/* Time ruler + scrubber */}
      <div
        ref={scrubTrackRef}
        onPointerDown={onScrubPointerDown}
        onPointerMove={onScrubPointerMove}
        onPointerUp={onScrubPointerUp}
        onPointerCancel={onScrubPointerUp}
        className="relative h-8 rounded-lg bg-white/[0.03] border border-white/10 cursor-pointer select-none overflow-hidden touch-none"
        style={{ touchAction: "none" }}
      >
        {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-white/10 text-[9px] text-white/30 pl-1 pt-0.5"
            style={{ left: `${(i / duration) * 100}%` }}
          >
            {i}s
          </div>
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
          style={{ left: `${(playhead / duration) * 100}%`, boxShadow: "0 0 8px rgba(34,211,238,0.8)" }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/60 ring-2 ring-white/30" />
        </div>
      </div>

      {/* Camera lane (always visible if it has keyframes) */}
      {cameraTrack.length > 0 && (
        <div
          className={`flex items-stretch gap-1.5 rounded-lg border transition-colors border-pink-500/40 bg-pink-500/5`}
        >
          <div className="flex items-center gap-1 px-2 py-1.5 w-36 flex-shrink-0 border-r border-white/10">
            <Camera className="w-3 h-3 text-pink-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-pink-200 truncate flex-1" title="Camera">
              Camera
            </span>
            <button
              onClick={() => setCameraHidden((h) => !h)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/50 hover:text-white"
              title={cameraHidden ? "Enable camera" : "Mute camera"}
            >
              {cameraHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={clearCameraTrack}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/30 text-white/50 hover:text-red-300"
              title="Delete camera track"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <div className={`relative flex-1 h-8 my-0.5 rounded ${cameraHidden ? "opacity-30" : ""}`}
               style={{ background: "rgba(236,72,153,0.07)" }}>
            {cameraTrack.length >= 2 && (() => {
              const sorted = [...cameraTrack].sort((a, b) => a.t - b.t);
              const startPct = (sorted[0].t / duration) * 100;
              const endPct = (sorted[sorted.length - 1].t / duration) * 100;
              return (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                  style={{
                    left: `${startPct}%`,
                    width: `${Math.max(0, endPct - startPct)}%`,
                    background: "#ec4899",
                    opacity: 0.55,
                  }}
                />
              );
            })()}
            {cameraTrack.map((kf, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); jumpToCameraKey(kf); }}
                onContextMenu={(e) => { e.preventDefault(); removeCameraKeyframe(i); }}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 hover:scale-150 transition-transform shadow-md z-10 ring-1 ring-white/40"
                style={{
                  left: `calc(${(kf.t / duration) * 100}% - 5px)`,
                  background: "#ec4899",
                  boxShadow: "0 0 6px #ec489980",
                }}
                title={`${kf.t.toFixed(2)}s · zoom ${kf.zoom.toFixed(2)}× · focus (${Math.round(kf.x)}%, ${Math.round(kf.y)}%) — right-click to delete`}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-px bg-cyan-400/60 pointer-events-none"
              style={{ left: `${(playhead / duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Multi-track lanes */}
      {trackEntries.length === 0 && cameraTrack.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-white/40 text-[11px]">
          Click a Camera preset (e.g. "Zoom to Target") to animate the whole preview, or select an item and click a motion preset to animate it.
        </div>
      ) : (
        <div className="space-y-1.5">
          {trackEntries.map(([itemId, kfs], rowIdx) => {
            const item = items.find((i) => i.id === itemId);
            const isSelected = itemId === selectedId;
            const hidden = !!hiddenTracks[itemId];
            const color = trackColor(rowIdx);
            return (
              <div
                key={itemId}
                className={`flex items-stretch gap-1.5 rounded-lg border transition-colors ${
                  isSelected ? "border-cyan-400/60 bg-cyan-400/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {/* Track header */}
                <div className="flex items-center gap-1 px-2 py-1.5 w-36 flex-shrink-0 border-r border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[10px] font-bold text-white/80 truncate flex-1" title={labelFor(item)}>
                    {labelFor(item)}
                  </span>
                  <button
                    onClick={() => toggleTrackVisibility(itemId)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/50 hover:text-white"
                    title={hidden ? "Enable track" : "Mute track"}
                  >
                    {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => removeTrack(itemId)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/30 text-white/50 hover:text-red-300"
                    title="Delete track"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Track lane */}
                <div className={`relative flex-1 h-8 my-0.5 rounded ${hidden ? "opacity-30" : ""}`}
                     style={{ background: `${color}10` }}>
                  {/* Bar from first to last keyframe */}
                  {kfs.length >= 2 && (() => {
                    const sorted = [...kfs].sort((a, b) => a.t - b.t);
                    const startPct = (sorted[0].t / duration) * 100;
                    const endPct = (sorted[sorted.length - 1].t / duration) * 100;
                    return (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                        style={{
                          left: `${startPct}%`,
                          width: `${Math.max(0, endPct - startPct)}%`,
                          background: color,
                          opacity: 0.55,
                        }}
                      />
                    );
                  })()}
                  {/* Keyframe diamonds */}
                  {kfs.map((kf, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); jumpToKey(itemId, kf); }}
                      onContextMenu={(e) => { e.preventDefault(); removeKeyframe(itemId, i); }}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 hover:scale-150 transition-transform shadow-md z-10 ring-1 ring-white/40"
                      style={{
                        left: `calc(${(kf.t / duration) * 100}% - 5px)`,
                        background: color,
                        boxShadow: `0 0 6px ${color}80`,
                      }}
                      title={`${kf.t.toFixed(2)}s · X${Math.round(kf.rotX)}° Y${Math.round(kf.rotY)}° S${Math.round(kf.scale * 100)}% — right-click to delete`}
                    />
                  ))}
                  {/* Playhead overlay */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-400/60 pointer-events-none"
                    style={{ left: `${(playhead / duration) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-white/30">
        💡 Multi-track: every item gets its own lane. The <span className="text-pink-300 font-bold">Camera</span> lane animates the whole preview — zoom into a target, dolly in, orbit, etc. Select an item first so "Zoom to Target" knows where to focus. Right-click a diamond to delete.
      </p>
    </div>
  );
});

export default MockTimeline;