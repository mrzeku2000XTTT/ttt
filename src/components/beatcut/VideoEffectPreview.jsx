import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw } from "lucide-react";

const VideoEffectPreview = forwardRef(function VideoEffectPreview({ video, analysis, rendering, onExport }, ref) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const rafRef = useRef(null);
  const playStartRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const duration = analysis?.duration || 10;
  const currentEffect = analysis?.effects?.find((e) => time >= e.start && time < e.end)?.effect || "zoom";

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const t = video?.type === "image" ? (performance.now() - playStartRef.current) / 1000 : videoRef.current?.currentTime || 0;
      if (t >= duration) {
        reset();
        return;
      }
      setTime(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  const play = () => {
    if (video?.type !== "image" && !videoRef.current) return;
    if (video?.type === "image") {
      playStartRef.current = performance.now();
    } else {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setTime(0);
    setPlaying(true);
  };

  const pause = () => {
    videoRef.current?.pause();
    setPlaying(false);
  };

  const reset = () => {
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
    setPlaying(false);
    setTime(0);
  };

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }));

  if (!video) {
    return <div className="aspect-[9/16] rounded-3xl bg-black/50 border border-white/10 flex items-center justify-center text-white/35 text-sm">Upload a video to generate the edit</div>;
  }

  return (
    <div className="space-y-3">
      <div ref={stageRef} className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-fuchsia-500/10">
        {video.type === "image" ? (
          <img src={video.url} alt={video.name} className={`absolute inset-0 w-full h-full object-cover beatcut-edit-${currentEffect}`} />
        ) : (
          <video
            ref={videoRef}
            src={video.url}
            className={`absolute inset-0 w-full h-full object-cover beatcut-edit-${currentEffect}`}
            muted
            playsInline
          />
        )}
        <div key={currentEffect + Math.floor(time)} className={`absolute inset-0 pointer-events-none beatcut-overlay-${currentEffect}`} />
        <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{ width: `${Math.min(100, (time / duration) * 100)}%` }} />
        </div>
        <div className="absolute left-3 top-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] text-white font-black uppercase tracking-wider">
          {currentEffect}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={playing ? pause : play} disabled={!analysis || rendering} className="flex items-center gap-2 h-10 px-4 rounded-full bg-white text-black text-xs font-black disabled:opacity-40">
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Pause" : "Play edit"}
        </button>
        <button onClick={reset} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onExport} disabled={!analysis || rendering} className="ml-auto flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white text-xs font-black disabled:opacity-40">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <style>{`
        @keyframes bceZoom { from { transform: scale(1); } to { transform: scale(1.14); } }
        @keyframes bcePunch { 0% { transform: scale(1.22); } 40% { transform: scale(.98); } 100% { transform: scale(1.08); } }
        @keyframes bceShake { 0%,100% { transform: translate(0,0) scale(1.08); } 20% { transform: translate(2%,-1%) scale(1.08); } 40% { transform: translate(-2%,1%) scale(1.08); } 60% { transform: translate(1%,2%) scale(1.08); } }
        .beatcut-edit-zoom { animation: bceZoom 1s linear forwards; }
        .beatcut-edit-punch { animation: bcePunch .7s ease-out forwards; }
        .beatcut-edit-shake { animation: bceShake .45s ease-in-out infinite; }
        .beatcut-edit-flash { animation: bcePunch .55s ease-out forwards; filter: saturate(1.25) contrast(1.1); }
        .beatcut-edit-neon { animation: bceZoom 1s linear forwards; filter: saturate(1.8) contrast(1.25) hue-rotate(12deg); }
        .beatcut-overlay-flash { background: rgba(255,255,255,.35); animation: fadeOut .25s ease-out forwards; }
        .beatcut-overlay-neon { box-shadow: inset 0 0 90px rgba(217,70,239,.45); background: linear-gradient(90deg, rgba(34,211,238,.16), rgba(217,70,239,.14)); }
        .beatcut-overlay-shake { box-shadow: inset 0 0 70px rgba(239,68,68,.35); }
        @keyframes fadeOut { to { opacity: 0; } }
      `}</style>
    </div>
  );
});

export default VideoEffectPreview;