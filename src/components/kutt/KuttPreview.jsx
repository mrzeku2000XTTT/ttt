import React, { useEffect, useRef } from "react";
import { Play, Pause, SkipBack } from "lucide-react";

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const f = Math.floor((s % 1) * 30);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(f).padStart(2, "0")}`;
};

export default function KuttPreview({ assets, clips, playhead, setPlayhead, playing, setPlaying, duration }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  const assetById = (id) => assets.find((a) => a.id === id);
  const activeVisual =
    clips.find((c) => c.track === 0 && playhead >= c.start && playhead < c.start + c.duration) ||
    clips.find((c) => c.track === 1 && playhead >= c.start && playhead < c.start + c.duration);
  const activeAudio = clips.find((c) => c.track === 2 && playhead >= c.start && playhead < c.start + c.duration);
  const visualAsset = activeVisual ? assetById(activeVisual.assetId) : null;
  const audioAsset = activeAudio ? assetById(activeAudio.assetId) : null;

  // Playback clock
  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); lastTickRef.current = null; return; }
    const tick = (now) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setPlayhead((p) => {
        const next = p + dt;
        if (next >= duration) { setPlaying(false); return duration; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration, setPlayhead, setPlaying]);

  // Keep the video element in sync with the timeline clock
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeVisual || visualAsset?.type !== "video") return;
    const expected = (activeVisual.trimIn || 0) + (playhead - activeVisual.start);
    if (Math.abs(v.currentTime - expected) > 0.35) v.currentTime = expected;
    if (playing && v.paused) v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  }, [playhead, playing, activeVisual, visualAsset]);

  // Audio track sync
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!activeAudio || !playing) { if (!a.paused) a.pause(); return; }
    const expected = (activeAudio.trimIn || 0) + (playhead - activeAudio.start);
    if (Math.abs(a.currentTime - expected) > 0.35) a.currentTime = expected;
    if (a.paused) a.play().catch(() => {});
  }, [playhead, playing, activeAudio]);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2">
        <span className="text-white/80 text-[11px] font-black tracking-widest uppercase">Player</span>
        <span className="ml-auto text-cyan-400 font-mono text-[11px]">{fmt(playhead)}</span>
        <span className="text-white/30 font-mono text-[11px]">/ {fmt(duration)}</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {visualAsset?.type === "image" && (
          <img src={visualAsset.url} alt="" className="max-w-full max-h-full object-contain" />
        )}
        {visualAsset?.type === "video" && (
          <video key={visualAsset.id} ref={videoRef} src={visualAsset.url} className="max-w-full max-h-full object-contain" playsInline />
        )}
        {!visualAsset && (
          <div className="text-white/20 text-xs font-bold tracking-widest">NO CLIP AT PLAYHEAD</div>
        )}
        {audioAsset && <audio key={audioAsset.id} ref={audioRef} src={audioAsset.url} />}
      </div>

      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-center gap-2">
        <button onClick={() => { setPlayhead(0); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          data-agent-id="kutt-play"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying(!playing)}
          className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}