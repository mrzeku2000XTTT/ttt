import React, { useRef } from 'react';
import { Diamond, Pause, Play, RotateCcw, Shuffle, Trash2 } from 'lucide-react';
import { TRACK_SECONDS } from './glyphPoseTrack';

/**
 * The 3D move, as a timeline: keyframes of the pose on a track with a playhead
 * over them. Dragging the track scrubs the move — paused, the artwork poses
 * itself at that moment, so a keyframe can be judged before it is kept.
 */
export default function GlyphPoseTimeline({
  keys = [],
  time = 0,
  playing,
  onTogglePlay,
  onScrub,
  onKey,
  onRandom,
  onClear,
}) {
  const trackRef = useRef(null);
  const scrubbing = useRef(false);

  const pct = (t) => Math.max(0, Math.min(100, (t / TRACK_SECONDS) * 100));
  const seek = (clientX) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    onScrub(Math.max(0, Math.min(TRACK_SECONDS, ((clientX - r.left) / r.width) * TRACK_SECONDS)));
  };

  return (
    <div className="glyph-glass w-full max-w-[560px] rounded-2xl px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!keys.length}
          className="glyph-btn glyph-btn-primary h-7 w-7 p-0 disabled:opacity-40"
          title={playing ? 'Pause the move' : 'Play the move'}
        >
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={() => onScrub(0)}
          className="glyph-btn glyph-btn-ghost h-7 w-7 p-0"
          title="Back to the start"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <span className="glyph-mono text-[10px] glyph-muted">
          {time.toFixed(1)}s / {TRACK_SECONDS.toFixed(1)}s
        </span>
        <span className="glyph-mono text-[10px] glyph-muted ml-auto">
          {keys.length} {keys.length === 1 ? 'key' : 'keys'}
        </span>
        <button type="button" onClick={onKey} className="glyph-btn glyph-btn-ghost" title="Keep the pose on screen at the playhead">
          <Diamond className="w-3 h-3" />
          Key
        </button>
        <button type="button" onClick={onRandom} className="glyph-btn glyph-btn-ghost" title="Write a brand-new random move">
          <Shuffle className="w-3 h-3" />
          Random
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!keys.length}
          className="glyph-btn glyph-btn-ghost disabled:opacity-40"
          title="Empty the timeline"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div
        ref={trackRef}
        onPointerDown={(e) => {
          scrubbing.current = true;
          try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
          } catch (err) {
            /* the window drag below carries it regardless */
          }
          seek(e.clientX);
        }}
        onPointerMove={(e) => {
          if (scrubbing.current) seek(e.clientX);
        }}
        onPointerUp={() => {
          scrubbing.current = false;
        }}
        onPointerCancel={() => {
          scrubbing.current = false;
        }}
        className="relative mt-2 h-9 cursor-col-resize touch-none rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--g-line)' }}
      >
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${pct(time)}%`, background: 'var(--g-accent-2)' }}
        />
        {keys.map((k, i) => (
          <button
            key={`${i}-${k.t}`}
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onScrub(k.t);
            }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pct(k.t)}%` }}
            title={`${k.t.toFixed(1)}s`}
          >
            <Diamond className="h-2.5 w-2.5" style={{ color: 'var(--g-accent-2)' }} />
          </button>
        ))}
      </div>

      <p className="glyph-muted mt-1.5 text-[10px] tracking-wide">
        drag the track to scrub · Key keeps the pose at the playhead · Random writes a whole new move
      </p>
    </div>
  );
}