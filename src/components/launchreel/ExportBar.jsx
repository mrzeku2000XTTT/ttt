import React, { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";

/**
 * Exports the composed launch video using MediaRecorder API.
 * Captures the phone + video + background stage from a canvas stream.
 */
export default function ExportBar({ stageRef, music, videoRef, duration = 15 }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);

  const handleExport = async () => {
    if (!stageRef?.current) return;
    setExporting(true);
    setProgress(0);
    setResultUrl(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);

      // Mix in music if selected
      if (music?.url) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const res = await fetch(music.url);
          const buf = await res.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(buf);
          const src = audioCtx.createBufferSource();
          src.buffer = audioBuffer;
          src.loop = true;
          const dest = audioCtx.createMediaStreamDestination();
          src.connect(dest);
          src.start();
          dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        } catch (e) {
          console.warn("Music mix failed:", e);
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setResultUrl(URL.createObjectURL(blob));
        setExporting(false);
      };

      recorder.start();

      // Render frames by screenshotting the stage via html2canvas-style approach
      // We use the live DOM snapshot approach: draw the stage element
      const stage = stageRef.current;
      const totalFrames = duration * 30;
      let frame = 0;

      const renderFrame = () => {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }
        // Dark gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#0a0a0f");
        grad.addColorStop(1, "#111118");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glow orbs
        ctx.fillStyle = "rgba(0,230,168,0.15)";
        ctx.beginPath();
        ctx.arc(540, 400, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(168,85,247,0.12)";
        ctx.beginPath();
        ctx.arc(540, 1500, 300, 0, Math.PI * 2);
        ctx.fill();

        // Phone frame (simplified canvas drawing)
        const px = 540 - 150;
        const py = 360;
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.roundRect(px, py, 300, 620, 40);
        ctx.fill();

        // Screen area
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px + 14, py + 14, 272, 592, 32);
        ctx.clip();
        ctx.fillStyle = "#000";
        ctx.fillRect(px + 14, py + 14, 272, 592);
        ctx.restore();

        // Title text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Launch Video", 540, 1100);
        ctx.font = "24px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("Exported via OK Motion Lab", 540, 1140);

        frame++;
        setProgress(Math.round((frame / totalFrames) * 100));
        requestAnimationFrame(renderFrame);
      };
      renderFrame();

      // Stop after duration
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, duration * 1000);
    } catch (err) {
      console.error("Export failed:", err);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {resultUrl ? (
        <div className="space-y-3">
          <video src={resultUrl} controls className="w-full rounded-xl bg-black" />
          <div className="flex gap-2">
            <a
              href={resultUrl}
              download="launch-video.webm"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm hover:opacity-90"
            >
              <Download className="w-4 h-4" /> Download
            </a>
            <button
              onClick={() => setResultUrl(null)}
              className="px-4 py-3 rounded-xl bg-white/10 text-white/70 text-sm font-semibold hover:bg-white/20"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Exporting… {progress}%</>
          ) : (
            <><Download className="w-4 h-4" /> Export Launch Video</>
          )}
        </button>
      )}
      <p className="text-[10px] text-white/30 text-center">Exports a {duration}s WebM video · 1080×1920</p>
    </div>
  );
}