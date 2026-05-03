import React, { useState, useRef, useEffect } from "react";
import { ScreenShare, Square, Loader2, Circle } from "lucide-react";

/**
 * Live screen recorder using the browser's getDisplayMedia API.
 * Records whatever the user shares (a tab, a window, or the full screen) —
 * unlike the timeline's html2canvas-based recorder, this captures the page
 * AS-IS, in real time, with all animations playing naturally and at full fps.
 *
 * On Chrome/Edge the user can pick "this tab" for the cleanest capture.
 * On Safari/iOS, getDisplayMedia is not supported — we hide the button there.
 */
export default function ScreenRecorder() {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const tickRef = useRef(null);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === "function"
    );
  }, []);

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);
  };

  const start = async () => {
    if (recording || starting) return;
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });
      streamRef.current = stream;

      // Pick best codec
      const candidates = [
        "video/mp4;codecs=avc1.640028",
        "video/mp4;codecs=avc1.42E01E",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let mime = "";
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) { mime = c; break; }
      }
      const recorder = new MediaRecorder(stream, {
        mimeType: mime || undefined,
        videoBitsPerSecond: 8_000_000,
      });
      const ext = (mime || "video/webm").startsWith("video/mp4") ? "mp4" : "webm";
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "video/webm" });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ultramock-screen-${Date.now()}.${ext}`;
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            try { document.body.removeChild(a); } catch {}
            URL.revokeObjectURL(url);
          }, 2000);
        }
        chunksRef.current = [];
      };

      // Auto-stop if the user clicks the browser's "Stop sharing" button
      stream.getVideoTracks()[0].addEventListener("ended", () => stop());

      recorder.start(250); // collect data every 250ms
      recorderRef.current = recorder;
      startTimeRef.current = performance.now();
      setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed((performance.now() - startTimeRef.current) / 1000);
      }, 200);
      setRecording(true);
    } catch (err) {
      // User cancelled the picker, or permission denied
      if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
        console.error("Screen recording failed:", err);
        alert("Screen recording failed: " + err.message);
      }
    }
    setStarting(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  if (!supported) return null;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(Math.floor(elapsed % 60)).padStart(2, "0");

  if (recording) {
    return (
      <button
        onClick={stop}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/40 animate-pulse"
        title="Stop screen recording"
      >
        <Square className="w-3.5 h-3.5 fill-white" />
        <span className="tabular-nums">{mm}:{ss}</span>
        <Circle className="w-2 h-2 fill-white text-white" />
      </button>
    );
  }

  return (
    <button
      onClick={start}
      disabled={starting}
      className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold disabled:opacity-50"
      title="Live screen record (captures real-time playback)"
    >
      {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScreenShare className="w-3.5 h-3.5" />}
      Screen Rec
    </button>
  );
}