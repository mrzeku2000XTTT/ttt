import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Film, Loader2, Wand2, Sparkles } from "lucide-react";
import BackToStore from "@/components/BackToStore";
import { extractFrames, MAX_VIDEO_SECONDS } from "@/components/framemimic/frameCapture";
import { cloneFrames, cloneFrame, refineFrame } from "@/components/framemimic/frameCloneEngine";
import FrameStrip from "@/components/framemimic/FrameStrip";
import FrameMimicPlayer from "@/components/framemimic/FrameMimicPlayer";

const FPS_OPTIONS = [2, 4, 6, 8];

export default function FrameMimicPage() {
  const fileInputRef = useRef(null);
  const cancelRef = useRef(false);

  const [stage, setStage] = useState("upload"); // upload | capturing | ready | cloning | done
  const [fps, setFps] = useState(4);
  const [meta, setMeta] = useState(null); // {duration, trimmed, width, height}
  const [frames, setFrames] = useState([]); // {index,time,dataUrl,status,html}
  const [captureProgress, setCaptureProgress] = useState({ done: 0, total: 0 });
  const [cloneProgress, setCloneProgress] = useState({ done: 0, total: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [extra, setExtra] = useState("");
  const [selected, setSelected] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [videoName, setVideoName] = useState("");

  useEffect(() => {
    if (stage !== "cloning") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Pick a video file.");
      return;
    }
    setStage("capturing");
    setCaptureProgress({ done: 0, total: 0 });
    setFrames([]);
    setMeta(null);
    setVideoName(file.name);
    try {
      const result = await extractFrames({
        file,
        fps,
        onProgress: ({ done, total }) => setCaptureProgress({ done, total }),
      });
      if (result.trimmed) {
        toast.message(`Video trimmed to the first ${MAX_VIDEO_SECONDS}s — 15s max for now.`);
      }
      setMeta(result);
      setFrames(result.frames.map((f) => ({ ...f, status: "captured", html: "" })));
      setSelected(0);
      setStage("ready");
    } catch (err) {
      toast.error(err?.message || "Frame capture failed.");
      setStage("upload");
    }
  };

  const startCloning = async () => {
    if (!frames.length) return;
    cancelRef.current = false;
    setStage("cloning");
    setCloneProgress({ done: 0, total: frames.length });
    const pending = frames.map((f) => ({ ...f, status: "pending" }));
    setFrames(pending);
    try {
      await cloneFrames({
        frames: pending,
        instructions: extra.trim(),
        onFrameDone: (i, html) => {
          setFrames((prev) =>
            prev.map((f) => (f.index === i ? { ...f, html, status: html ? "done" : "failed" } : f))
          );
          setCloneProgress((p) => ({ ...p, done: p.done + 1 }));
        },
        shouldCancel: () => cancelRef.current,
      });
    } catch (err) {
      toast.error(err?.message || "Cloning failed.");
    }
    setStage("done");
  };

  const retryFrame = async (index) => {
    const f = frames.find((x) => x.index === index);
    if (!f) return;
    setFrames((prev) => prev.map((x) => (x.index === index ? { ...x, status: "cloning" } : x)));
    try {
      const html = await cloneFrame(f, { total: frames.length, instructions: extra.trim() });
      setFrames((prev) => prev.map((x) => (x.index === index ? { ...x, html, status: "done" } : x)));
      toast.success(`Frame ${index + 1} cloned`);
    } catch {
      setFrames((prev) => prev.map((x) => (x.index === index ? { ...x, status: "failed" } : x)));
      toast.error(`Frame ${index + 1} failed again.`);
    }
  };

  const applyRefine = async (e) => {
    e.preventDefault();
    const f = frames[selected];
    if (!f?.html || !instruction.trim() || refining) return;
    setRefining(true);
    try {
      const html = await refineFrame(f.html, instruction.trim());
      setFrames((prev) => prev.map((x) => (x.index === f.index ? { ...x, html } : x)));
      setInstruction("");
      toast.success(`Frame ${f.index + 1} updated`);
    } catch (err) {
      toast.error(err?.message || "Edit failed.");
    } finally {
      setRefining(false);
    }
  };

  const clonedFrames = frames.filter((f) => f.html);

  return (
    <div className="min-h-screen bg-black text-white">
      <BackToStore />

      <div className="max-w-4xl mx-auto px-4 pt-16 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">FrameMimic</h1>
            <p className="text-white/40 text-xs">
              Video → frame-by-frame HTML clones · {MAX_VIDEO_SECONDS}s max
            </p>
          </div>
        </div>

        {/* Step 1 — upload */}
        {stage === "upload" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white/40 text-[10px] uppercase tracking-widest">Frame rate</span>
              {FPS_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setFps(o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    fps === o
                      ? "bg-white text-black border-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  {o} fps
                </button>
              ))}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-white/15 rounded-2xl py-12 flex flex-col items-center gap-2 hover:border-white/40 transition-all"
            >
              <Upload className="w-7 h-7 text-white/50" />
              <span className="text-sm font-semibold">Select a video ({MAX_VIDEO_SECONDS} seconds max)</span>
              <span className="text-xs text-white/40">
                Every frame gets captured & cloned into HTML — {fps} fps ≈ {Math.floor(MAX_VIDEO_SECONDS * fps)} frames at {MAX_VIDEO_SECONDS}s
              </span>
            </button>
          </div>
        )}

        {/* Capturing */}
        {stage === "capturing" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-3 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/60" />
            <p className="text-sm font-semibold">Capturing every frame…</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${captureProgress.total ? (captureProgress.done / captureProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-white/40">
              {captureProgress.done}/{captureProgress.total || "…"} frames
            </p>
          </div>
        )}

        {/* Captured / cloning / done */}
        {["ready", "cloning", "done"].includes(stage) && meta && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/40 truncate">
                  {videoName} · {meta.duration.toFixed(1)}s · {frames.length} frames · {meta.width}×{meta.height}
                </p>
                {stage === "ready" && (
                  <button onClick={() => setStage("upload")} className="text-xs text-white/40 underline flex-shrink-0">
                    start over
                  </button>
                )}
              </div>

              <FrameStrip frames={frames} selected={selected} onSelect={setSelected} onRetry={retryFrame} />

              {stage === "ready" && (
                <div className="space-y-3">
                  <input
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Optional — style notes applied to every frame's clone"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={startCloning}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-white/90 flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> Clone {frames.length} frames to HTML
                  </button>
                  <p className="text-[11px] text-white/30 text-center">
                    Each frame becomes a 1:1 AI HTML clone · 3 frames clone in parallel
                  </p>
                </div>
              )}

              {stage === "cloning" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold">
                      <Sparkles className="w-4 h-4" /> Cloning frame-by-frame…
                    </span>
                    <span className="text-white/40 tabular-nums">
                      {cloneProgress.done}/{cloneProgress.total} · {elapsed}s
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${(cloneProgress.done / cloneProgress.total) * 100}%` }}
                    />
                  </div>
                  <button onClick={() => { cancelRef.current = true; }} className="text-xs text-white/40 underline">
                    cancel
                  </button>
                </div>
              )}

              {stage === "done" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">
                    {frames.filter((f) => f.html).length}/{frames.length} frames cloned in {elapsed}s
                  </span>
                  {frames.some((f) => !f.html) && (
                    <span className="text-red-400/70">Tap ↻ on failed frames to retry</span>
                  )}
                </div>
              )}
            </div>

            {/* HTML replay */}
            {clonedFrames.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">HTML replay</p>
                <FrameMimicPlayer
                  frames={clonedFrames}
                  fps={fps}
                  width={meta.width}
                  height={meta.height}
                  onUpdate={(idx, html) =>
                    setFrames((prev) => prev.map((f) => (f.index === idx ? { ...f, html } : f)))
                  }
                />
              </div>
            )}

            {/* Per-frame refine */}
            {frames[selected]?.html && (
              <form onSubmit={applyRefine} className="flex gap-2">
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={`Refine frame ${selected + 1} — change text, colors, layout…`}
                  disabled={refining}
                  className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:border-white/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={refining || !instruction.trim()}
                  className="h-10 w-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40"
                  title="Apply edit"
                >
                  {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}