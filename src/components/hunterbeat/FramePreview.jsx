import React, { useEffect, useRef, useState, useCallback } from "react";
import { Player } from "@remotion/player";
import { Download, Loader2 } from "lucide-react";
import MotionGraphicsComposition, { MOTION_FPS } from "./MotionGraphicsComposition";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function FramePreview({ images, spec, title, durationSeconds = 6 }) {
  const [loaded, setLoaded] = useState(0);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const imgsRef = useRef([]);
  const canvasRef = useRef(null);

  const FPS = MOTION_FPS;
  const TOTAL_FRAMES = Math.round(durationSeconds * FPS);

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
      const hasTwo = imgs.filter(Boolean).length >= 2 && spec?.motion_style === "crossfade";

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
        drawCover(imgs[0], 1 - progress, 1.05 + 0.05 * easeOutExpo(t), 0, 0);
        if (progress > 0) drawCover(imgs[1], progress, 1.08 + 0.05 * easeOutExpo(Math.max(0, t - 0.35)), 0, 0);
      } else {
        drawCover(imgs[0], 1, zoom, panX, panY);
      }

      // Vignette
      const vg = ctx.createLinearGradient(0, H * 0.4, 0, H);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      const vOpacity = Math.min(1, frameNum / 15);
      ctx.globalAlpha = vOpacity;
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // Overlay text
      if (overlayText) {
        const delay = Math.floor(TOTAL_FRAMES * 0.11);
        const local = frameNum - delay;
        if (local >= 0) {
          const textProgress = Math.min(1, local / 20);
          const eased = easeOutExpo(textProgress);
          const textY = H * 0.86 - eased * 40;
          const textOpacity = eased;
          const blurPx = (1 - eased) * 8;

          const fadeOutStart = TOTAL_FRAMES - 15;
          const fadeOut = frameNum > fadeOutStart ? Math.max(0, 1 - (frameNum - fadeOutStart) / 15) : 1;

          ctx.font = "bold 44px -apple-system, 'SF Pro Display', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const textW = ctx.measureText(overlayText).width;
          const pillW = textW + 64;
          const pillH = 66;
          const pillX = W / 2 - pillW / 2;
          const pillY = textY - pillH / 2;

          ctx.globalAlpha = textOpacity * fadeOut;
          ctx.fillStyle = "rgba(0,0,0,0.45)";
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

      // Accent bar
      {
        const delay = Math.floor(TOTAL_FRAMES * 0.19);
        const local = frameNum - delay;
        if (local >= 0) {
          const progress = easeOutExpo(Math.min(1, local / 18));
          const barW = 120 * progress;
          const barH = 5;
          const barX = W / 2 - barW / 2;
          const barY = H * 0.93;

          const fadeOutStart = TOTAL_FRAMES - 10;
          const fadeOut = frameNum > fadeOutStart ? Math.max(0, 1 - (frameNum - fadeOutStart) / 10) : 1;

          ctx.globalAlpha = progress * 0.9 * fadeOut;
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
  const duration = durationSeconds || 6;

  return (
    <div className="relative">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        {allLoaded ? (
          <Player
            component={MotionGraphicsComposition}
            inputProps={{ spec, images, durationSeconds: duration }}
            durationInFrames={Math.round(duration * FPS)}
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

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">{duration}s · {Math.round(duration * FPS)} frames</span>
        {allLoaded && (
          <button
            onClick={exportVideo}
            disabled={recording}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-zinc-900 text-white text-[11px] font-semibold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
            {recording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {recording ? "Recording…" : "Export video"}
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

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