import React, { useRef, useState, useEffect, useCallback } from "react";

const JSQR_CDN = "https://unpkg.com/jsqr@1.4.0/dist/jsQR.js";

export default function KasSignerScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  // Load jsQR from CDN once
  useEffect(() => {
    if (window.jsQR) return;
    const script = document.createElement("script");
    script.src = JSQR_CDN;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if (code && code.data) {
        stopCamera();
        onScan(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [onScan, stopCamera]);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      setError(err.name === "NotAllowedError" ? "Camera permission denied" : err.message);
    }
  };

  return (
    <div>
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-white/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            Camera off
          </div>
        )}
        {running && (
          <div className="absolute inset-8 border-2 border-[#6366f1] rounded-2xl pointer-events-none" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <button
        onClick={running ? stopCamera : startCamera}
        className={`w-full h-12 rounded-xl font-bold text-sm mt-3 transition-colors ${
          running
            ? "bg-red-500/20 text-red-300 border border-red-500/40"
            : "bg-[#6366f1] hover:bg-[#5457e0] text-white"
        }`}
      >
        {running ? "Stop Camera" : "Start Camera"}
      </button>
    </div>
  );
}