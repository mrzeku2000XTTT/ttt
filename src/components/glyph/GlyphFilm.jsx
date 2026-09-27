import React from 'react';
import { Player } from '@remotion/player';
import { Film, X } from 'lucide-react';
import GlyphFilmComposition from './GlyphFilmComposition';

const FPS = 30;

/**
 * Plays the film the chat wrote. Remotion owns the timeline, so the piece is
 * frame-accurate — it scrubs, it loops, and it plays the same every time.
 */
export default function GlyphFilm({ plan, onClose }) {
  if (!plan) return null;
  const seconds = plan.beats.reduce((s, b) => s + (b.seconds || 0), 0);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#04070c]/95 p-3 backdrop-blur-md sm:p-6">
      <div className="mb-3 flex w-full max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-1">
        <Film className="h-4 w-4" style={{ color: 'var(--g-ink)' }} />
        <p className="glyph-word text-[12px]">{plan.title}</p>
        <p className="glyph-muted text-[10px] uppercase tracking-[0.14em]">
          {plan.beats.length} beats · {seconds.toFixed(1)}s · remotion
        </p>
        <button
          onClick={onClose}
          className="glyph-pill ml-auto flex h-8 items-center gap-1.5 rounded-full px-3 text-[10px] uppercase tracking-[0.16em]"
        >
          <X className="h-3 w-3" />
          back to studio
        </button>
      </div>

      <div className="w-full max-w-[1100px]" style={{ height: '76vh' }}>
        <Player
          component={GlyphFilmComposition}
          inputProps={{ stills: plan.stills, beats: plan.beats }}
          durationInFrames={Math.max(FPS, Math.round(seconds * FPS))}
          fps={FPS}
          compositionWidth={plan.width || 1080}
          compositionHeight={plan.height || 1080}
          controls
          loop
          autoPlay
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}