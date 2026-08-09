import React, { useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

export default function Timeline({ videoRef, isPlaying, onPlayPause, onTimeUpdate }) {
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    const v = videoRef?.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || 0);
    const onTime = () => {
      setProgress(v.currentTime);
      onTimeUpdate?.(v.currentTime);
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [videoRef, onTimeUpdate]);

  const seek = (e) => {
    const v = videoRef?.current;
    if (!v || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * (v.duration || 0);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPlayPause}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <span className="text-[11px] text-white/40 font-mono w-8">{fmt(progress)}</span>
      <div
        ref={barRef}
        onClick={seek}
        className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative"
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <span className="text-[11px] text-white/40 font-mono w-8">{fmt(duration)}</span>
    </div>
  );
}