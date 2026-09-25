import React, { useEffect, useState } from 'react';
import { KILN_CODE, KILN_STAGES } from './kilnWorkScript';

const VISIBLE = 6;

/** The waiting bubble: KILN's real work streamed as code while it builds. */
export default function KilnWorkBubble({ stage = 0, elapsed = 0 }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 380);
    return () => clearInterval(id);
  }, []);

  const lines = Array.from({ length: VISIBLE }, (_, index) => KILN_CODE[(tick + index) % KILN_CODE.length]);

  return (
    <div className="kiln-pixel border border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="kiln-px is-on is-pulse"
              style={{ animationDelay: `${dot * 140}ms` }}
            />
          ))}
        </span>
        <span className="kiln-mono text-[10px] uppercase tracking-[0.18em]">KILN is working</span>
        <span className="kiln-mono ml-auto text-[10px] text-[hsl(var(--k-muted))]">{elapsed}s</span>
      </div>
      <p className="kiln-mono mb-2 text-[10px] text-[hsl(var(--k-amber))]">
        {KILN_STAGES[Math.min(stage, KILN_STAGES.length - 1)]}
      </p>
      <div className="kiln-code kiln-pixel px-3 py-2">
        <div className="kiln-mono text-[10.5px] leading-[1.7]">
          {lines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              className={`kiln-code-line ${index === lines.length - 1 ? 'is-last' : ''}`}
            >
              {line}
              {index === lines.length - 1 && <span className="kiln-caret ml-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}