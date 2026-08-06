import React, { useEffect, useRef, useState, useCallback } from "react";
import { Download, Loader2, Play, Pause } from "lucide-react";

// Easing: ease-in-out cubic
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Spring-ish scale for crossfade lift
const springScale = (p) => 1 + 0.03 * Math.sin(p * Math.PI);

export default function FramePreview({ frames, title }) {
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const imgsRef = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const recorderRef = useRef(null);

  const FRAME_MS = 1100; // each keyframe shown ~1.1s with crossfade
  const TOTAL_MS = frames.length * FRAME_MS;

  // Load images
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

  const drawFrame = useCallback((now) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const elapsed = (now - startRef.current) % TOTAL_MS;
    const idx = Math.floor(elapsed / FRAME_MS);
    const localP = (elapsed % FRAME_MS) / FRAME_MS; // 0..1 within current frame
    const nextIdx = (idx + 1) % frames.length;
    const cur = imgsRef.current[idx];
    const nxt = imgsRef.current[nextIdx];

    const drawCover = (img, alpha, scale) => {
      if (!img) return;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scaleFit = Math.max(W / iw, H / ih);
      const dw = iw * scaleFit * scale;
      const dh = ih * scaleFit * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    };

    // crossfade: last 30% blends into next
    const fadeStart = 0.7;
    if (localP >= fadeStart) {
      const fp = (localP - fadeStart) / (1 - fadeStart);
      const a1 = 1 - easeInOut(fp);
      const a2 = easeInOut(fp);
      drawCover(cur, a1, springScale(localP));
      drawCover(nxt, a2, springScale(fp));
    } else {
      drawCover(cur, 1, springScale(localP));
    }
  }, [frames.length, TOTAL_MS]);

  // Animation loop
  useEffect(() => {
    if (loaded < frames.length || !playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1280;
    canvas.height = 720;
    startRef.current = performance.now();
    const tick = (now) => {
      drawFrame(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loaded, playing, drawFrame, frames.length]);

  // WebM export via MediaRecorder
  const exportVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    setRecording(true);
    setVideoUrl(null);
    try {
      const stream = canvas.captureStream(30);
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
      // Record one full loop
      setTimeout(() => rec.stop(), TOTAL_MS + 120);
    } catch (e) {
      setRecording(false);
    }
  }, [recording, TOTAL_MS]);

  const allLoaded = loaded >= frames.length && frames.length > 0;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl bg-black aspect-video"
      />
      {!allLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-100 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="text-[11px] text-zinc-400">Rendering keyframes… ({loaded}/{frames.length})</span>
        </div>
      )}
      {allLoaded && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/70 backdrop-blur text-white"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exportVideo}
            disabled={recording}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-black/70 backdrop-blur text-white text-[11px] font-semibold disabled:opacity-50"
            title="Export as WebM"
          >
            {recording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {recording ? "Recording…" : "Export"}
          </button>
        </div>
      )}
      {videoUrl && (
        <div className="mt-2 flex items-center gap-2">
          <video src={videoUrl} controls loop muted autoPlay playsInline className="w-full rounded-xl bg-black" />
          <a
            href={videoUrl}
            download={`${(title || "hunterbeat").replace(/\s+/g, "-").toLowerCase()}.webm`}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-zinc-900 text-white text-[11px] font-semibold whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" /> Save
          </a>
        </div>
      )}
    </div>
  );
}