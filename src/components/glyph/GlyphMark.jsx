import React from 'react';
import GlyphThinking from './GlyphThinking';

/**
 * GLYPH's mark — the thinking visual itself, so the logo is always alive:
 * breathing slowly while it waits, and turning while GLYPH is working.
 */
export default function GlyphMark({ size = 40, spinning = false, count, className = '' }) {
  return (
    <span
      className={`glyph-mark ${className}`}
      style={{ width: size, height: size, display: 'inline-block', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}
      aria-hidden="true"
    >
      <GlyphThinking
        size={size}
        isThinking={spinning}
        count={count || (size < 40 ? 11 : 21)}
        className="h-full w-full"
      />
    </span>
  );
}