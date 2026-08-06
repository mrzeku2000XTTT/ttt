import React, { useEffect, useRef, useState, useCallback } from "react";
import { Player } from "@remotion/player";
import { Download, Loader2 } from "lucide-react";
import MotionGraphicsComposition, { MOTION_FPS, MOTION_DURATION } from "./MotionGraphicsComposition";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function FramePreview({ images, spec, title }) {
  const [loaded, setLoaded] = useState(0);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const imgsRef = useRef([]);
  const canvasRef = useRef(null);

  const FPS = MOTION_FPS;
  const TOTAL_FRAMES = MOTION_DURATION;

  // Load images for canvas export
  useEffect(() => {
    setLoaded(0);
    imgsRef.current = [];
    let cancelled = false;
    const list = images || [];
    list.forEach((url, i) => {
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
    return () => {
      cancelled = true;
    };
  }, [images]);

  // Canvas-based export mirroring the Remotion composition
  const drawCanvasFrame = useCallback(
    (frameNum) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const imgs = imgsRef.current;
      const accent = spec?.accent_color || "#0A84FF";
      const overlayText = spec?.overlay_text || spec?.title || "";
      const hasTwo = imgs.filter(Boolean).length >= 2;

      // --- Background: Ken Burns or crossfade ---
      const t = frameNum / TOTAL_FRAMES;
      const zoom = 1.05 + 0.08 * easeOutExpo(t);
      const panProgress = easeInOut(Math.min(t * 1.5, 1));
      const panX = (panProgress * 6 - 3) * (W / 100);
      const panY = (panProgress * 4 - 2) * (H / 100);

      const drawCover = (img, opacity, scale, offX, offY) => {
        if (!img) return;
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const fit = Math.max(W / iw, H / ih);
        const dw = iw * fit * scale;
        const dh = ih * fit * scale;
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, (W - dw) / 2 + offX, (H - dh) / 2 + offY, dw, dh);
        ctx.globalAlpha = 1;
      };

      if (hasTwo) {
        const crossStart = TOTAL_FRAMES * 0.35;
        const crossDur = TOTAL_FRAMES * 0.25;
        const progress = Math.max(0, Math.min(1, (frameNum - crossStart) / crossDur));
        drawCover(imgs[0], 1 - progress, 1.05 + 0.05 * easeOutExpo(frameNum / 120), 0, 0);
        if (progress > 0) drawCover(imgs[1], progress, 1.08 + 0.05 * easeOutExpo((frameNum - crossStart) / 120), 0, 0);
      } else {
        drawCover(imgs[0], 1, zoom, panX, panY);
      }

      // --- Vignette ---
      const vg = ctx.createLinearGradient(0, H * 0.4, 0, H);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      const vOpacity = Math.min(1, frameNum / 15);
      ctx.globalAlpha = vOpacity;
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // --- Overlay text (slide up + fade with spring-like easing) ---
      if (overlayText) {
        const delay = 20;
        const local = frameNum - delay;
        if (local >= 0) {
          const textProgress = Math.min(1, local / 20);
          const eased = easeOutExpo(textProgress);
          const textY = H * 0.88 - eased * 40;
          const textOpacity = eased;
          const blurPx = (1 - eased) * 8;

          ctx.font = "bold 42px -apple-system, 'SF Pro Display', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Pill background
          const textW = ctx.measureText(overlayText).width;
          const pillW = textW + 56;
          const pillH = 62;
          const pillX = W / 2 - pillW / 2;
          const pillY = textY - pillH / 2;

          ctx.globalAlpha = textOpacity;
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          // Rounded rect
          const r = pillH / 2;
          ctx.beginPath();
          ctx.moveTo(pillX + r, pillY);
          ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r);
          ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r);
          ctx.arcTo(pillX, pillY + pillH, pillX, pillY, r);
          ctx.arcTo(pillX, pillY, pillX + pillW, pillY, r);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#fff";
          if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;
          ctx.fillText(overlayText, W / 2, textY);
          ctx.filter = "none";
          ctx.globalAlpha = 1;
        }
      }

      // --- Accent bar (scale in from center) ---
      {
        const delay = 35;
        const local = frameNum - delay;
        if (local >= 0) {
          const progress = easeOutExpo(Math.min(1, local / 18));
          const barW = 120 * progress;
          const barH = 5;
          const barX = W / 2 - barW / 2;
          const barY = H * 0.94;

          ctx.globalAlpha = progress * 0.9;
          ctx.fillStyle = accent;
          ctx.shadowColor = accent;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    },
    [spec, TOTAL_FRAMES]
  );

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
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoUrl(URL.createObjectURL(blob));
        setRecording(false);
      };
      rec.start();

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

  const allLoaded = loaded >= (images?.length || 0) && (images?.length || 0) > 0;

  return (
    <div className="relative">
      {/* Remotion Player preview */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {allLoaded ? (
          <Player
            component={MotionGraphicsComposition}
            inputProps={{ spec, images }}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            compositionWidth={1280}
            compositionHeight={720}
            style={{ width: "100%", height: "100%" }}
            controls={false}
            autoPlay
            loop
            clickToPlay={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-100">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <span className="text-[11px] text-zinc-400">
              Rendering motion graphics… ({loaded}/{images?.length || 0})
            </span>
          </div>
        )}
      </div>

      {/* Export button */}
      {allLoaded && (
        <div className="mt-2 flex items-center gap-2 justify-end">
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