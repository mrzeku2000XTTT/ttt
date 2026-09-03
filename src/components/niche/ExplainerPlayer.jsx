import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

// Plays the explainer like a video: scene image synced to its narration, in order
export default function ExplainerPlayer({ images, audios }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  if (!images?.length || images.length !== audios?.length) return null;

  const startAt = (i) => {
    const next = Math.max(0, Math.min(i, images.length - 1));
    setIdx(next);
    setPlaying(true);
    setTimeout(() => audioRef.current?.play(), 60);
  };

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else startAt(idx);
  };

  const onEnded = () => {
    if (idx + 1 < images.length) startAt(idx + 1);
    else setPlaying(false);
  };

  return (
    <div className="rounded-2xl border border-white/15 overflow-hidden">
      <div className="bg-white">
        <img src={images[idx]} alt={`Scene ${idx + 1}`} className="w-full aspect-video object-contain" />
      </div>
      <div className="flex items-center justify-center gap-4 bg-black border-t border-white/10 py-3">
        <button onClick={() => startAt(idx - 1)} className="text-white/60 hover:text-white transition-colors" aria-label="Previous scene">
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={toggle}
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={() => startAt(idx + 1)} className="text-white/60 hover:text-white transition-colors" aria-label="Next scene">
          <SkipForward className="w-5 h-5" />
        </button>
        <span className="text-white/40 text-xs font-bold tabular-nums">{idx + 1} / {images.length}</span>
      </div>
      <audio ref={audioRef} src={audios[idx]} onEnded={onEnded} />
    </div>
  );
}