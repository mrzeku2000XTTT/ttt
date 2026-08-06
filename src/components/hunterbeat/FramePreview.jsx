import React, { useEffect, useRef, useState, useCallback } from "react";
import { Player } from "@remotion/player";
import { Download, Loader2, Play, Pause } from "lucide-react";
import KeyframeComposition, { KEYFRAME_DURATION, KEYFRAME_FPS } from "./KeyframeComposition";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function FramePreview({ frames, title }) {
  const [loaded, setLoaded] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const imgsRef = useRef([]);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);

  const FRAMES_PER_KEYFRAME = KEYFRAME_DURATION;
  const FPS = KEYFRAME_FPS;
  const TOTAL_FRAMES = frames.length * FRAMES_PER_KEYFRAME;
  const DURATION_MS = (TOTAL_FRAMES / FPS) * 1000;

  // Load images for canvas export
  useEffect(() => {
    setLoaded(0);
    imgsRef.current = [];
    let cancelled = false;
    frames.forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        imgsRef.current[i] = img;
        setLoaded((n) => n + 1);
      };
      img.onerror = () => {
        if (cancelled) return;
        setLoaded((n) => n + 1);
      };
      img.src = url;
    });
    return () => { cancelled = true; };
  }, [frames]);

  const drawCanvasFrame = useCallback((frameNum) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const count = frames.length;
    const looped = frameNum % TOTAL_FRAMES;
    const idx = Math.floor(looped / FRAMES_PER_KEYFRAME);
    const local = looped % FRAMES_PER_KEYFRAME;
    const nextIdx = (idx + 1) % count;
    const progress = local / FRAMES_PER_KEYFRAME;
    const fadeStart = 0.7;
    const crossfading = progress >= fadeStart;
    const fadeProgress = crossfading ? (progress - fadeStart) / (1 - fadeStart) : 0;
    const blurAmount = crossfading ? Math.min(6, 6 * Math.sin(fadeProgress * Math.PI)) : 0;

    const drawCover = (img, alpha, scale, blur) => {
      if (!img) return;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const fit = Math.max(W / iw, H / ih);
      const dw = iw * fit * scale;
      const dh = ih * fit * scale;
      ctx.globalAlpha = alpha;
      if (blur > 0) ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    };

    const outgoingAlpha = crossfading ? 1 - easeInOut(fadeProgress) : 1;
    const incomingAlpha = crossfading ? easeInOut(fadeProgress) : 0;
    const scale = 1.04 - 0.04 * easeInOut(local / FRAMES_PER_KEYFRAME);

    drawCover(imgsRef.current[idx], outgoingAlpha, scale, crossfading ? blurAmount : 0);
    if (crossfading) {
      drawCover(imgsRef.current[nextIdx], incomingAlpha, 1.06 - 0.06 * fadeProgress, blurAmount);
    }
  }, [frames.length, FRAMES_PER_KEYFRAME, TOTAL_FRAMES]);

  const exportVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    setRecording(true);
    setVideoUrl(null);
    try {
      canvas.width = 1280;
      canvas.height = 720;
      const stream = canvas.captureStream(FPS);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoUrl(URL.createObjectURL(blob));
        setRecording(false);
      };
      recorderRef.current = rec;
      rec.start();

      // Draw frames in real-time synced to the recorder
      const startMs = performance.now();
      const drawLoop = () => {
        const elapsed = performance.now() - startMs;
        const frameNum = Math.floor((elapsed / 1000) * FPS);
        if (frameNum >= TOTAL_FRAMES) {
          rec.stop();
          return;
        }
        drawCanvasFrame(frameNum);
        requestAnimationFrame(drawLoop);
      };
      drawLoop();
    } catch (e) {
      setRecording(false);
    }
  }, [recording, drawCanvasFrame, FPS, TOTAL_FRAMES]);

  const allLoaded = loaded >= frames.length && frames.length > 0;

  return (
    <div className="relative">
      {/* Remotion Player preview */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {allLoaded && (
          <Player
            component={KeyframeComposition}
            inputProps={{ frames }}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            compositionWidth={1280}
            compositionHeight={720}
            style={{ width: "100%", height: "100%" }}
            controls={false}
            playing={playing}
            loop
            clickToPlay={false}
          />
        )}
        {!allLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-100">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <span className="text-[11px] text-zinc-400">Rendering keyframes… ({loaded}/{frames.length})</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {allLoaded && (
        <div className="mt-2 flex items-center gap-2 justify-end">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exportVideo}
            disabled={recording}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-zinc-900 text-white text-[11px] font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
            title="Export as WebM video"
          >
            {recording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {recording ? "Recording…" : "Export video"}
          </button>
        </div>
      )}

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Exported video result */}
      {videoUrl && (
        <div className="mt-2">
          <video src={videoUrl} controls loop muted autoPlay playsInline className="w-full rounded-xl bg-black" />
          <a
            href={videoUrl}
            download={`${(title || "hunterbeat").replace(/\s+/g, "-").toLowerCase()}.webm`}
            className="mt-1 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-zinc-900 text-white text-[11px] font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      )}
    </div>
  );
}