import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function ExportBar({ stageRef, videoRef, duration = 15 }) {
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

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setResultUrl(URL.createObjectURL(blob));
        setExporting(false);
      };

      recorder.start();
      const totalFrames = duration * 30;
      let frame = 0;

      const renderFrame = () => {
        if (frame >= totalFrames) { recorder.stop(); return; }
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#0a0a0f");
        grad.addColorStop(1, "#111118");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(6,182,212,0.1)";
        ctx.beginPath();
        ctx.arc(540, 400, 300, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.roundRect(390, 360, 300, 620, 40);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Launch Video", 540, 1100);

        frame++;
        setProgress(Math.round((frame / totalFrames) * 100));
        requestAnimationFrame(renderFrame);
      };
      renderFrame();

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
          <a
            href={resultUrl}
            download="launch-video.webm"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm hover:opacity-90"
          >
            <Download className="w-4 h-4" /> Download
          </a>
          <button
            onClick={() => setResultUrl(null)}
            className="w-full text-white/40 text-xs hover:text-white/70"
          >
            ↻ Re-export
          </button>
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
      <p className="text-[10px] text-white/30 text-center">{duration}s WebM · 1080×1920</p>
    </div>
  );
}