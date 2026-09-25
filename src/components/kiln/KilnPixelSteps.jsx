import React from 'react';
import { KILN_STAGES } from './kilnWorkScript';

const CELLS = 10;

/** The pixel pipeline widget: each stage fills its own blocky bar. */
export default function KilnPixelSteps({ stage = 0, busy = false, elapsed = 0 }) {
  return (
    <div className="kiln-pixel border border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--k-muted))]">
          Component pipeline
        </span>
        <span className="kiln-mono text-[10px] text-[hsl(var(--k-muted))]">
          {busy ? `${elapsed}s` : 'idle'}
        </span>
      </div>
      <div className="space-y-1.5">
        {KILN_STAGES.map((label, index) => {
          const done = index < stage || (!busy && stage > 0);
          const active = busy && index === stage;
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="kiln-mono w-[168px] shrink-0 truncate text-[10px] text-[hsl(var(--k-muted))]">
                {label}
              </span>
              <span className="flex gap-[2px]">
                {Array.from({ length: CELLS }).map((_, cell) => {
                  const filled = done || (active && cell < Math.max(2, (elapsed % CELLS) + 2));
                  return (
                    <span
                      key={cell}
                      className={`kiln-px ${filled ? 'is-on' : ''} ${active && filled ? 'is-pulse' : ''}`}
                    />
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}