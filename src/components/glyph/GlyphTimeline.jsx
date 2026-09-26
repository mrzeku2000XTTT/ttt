import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

/** Transport for a loaded video: play/pause, restart and a scrub bar. */
export default function GlyphTimeline({ videoRef, playing, onTogglePlay }) {
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const sync = () => {
      setTime(v.currentTime || 0);
      if (Number.isFinite(v.duration) && v.duration > 0) setDur(v.duration);
    };
    sync();
    const id = window.setInterval(sync, 100);
    return () => window.clearInterval(id);
  }, [videoRef]);

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setTime(t);
  };

  return (
    <div className="mt-3 flex w-full items-center gap-3">
      <button
        onClick={onTogglePlay}
        className="glyph-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={() => seek(0)}
        className="glyph-pill flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        title="Back to the start"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <input
        type="range"
        className="glyph-range flex-1"
        min={0}
        max={dur || 0}
        step={0.01}
        value={Math.min(time, dur || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Video timeline"
      />
      <span className="glyph-mono glyph-muted w-[76px] shrink-0 text-right text-[10px]">
        {fmt(time)} / {fmt(dur)}
      </span>
    </div>
  );
}