import React from 'react';
import ActShot from './ActShot';

/** The running transcript: every committed sentence followed by its image. */
export default function ActStream({ items, onRetry }) {
  return (
    <div className="flex flex-col gap-3 items-start">
      {items.map((it) =>
        it.kind === 'text' ? (
          <p key={it.id} className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200">
            {it.text}
          </p>
        ) : (
          <ActShot key={it.id} item={it} onRetry={onRetry} />
        )
      )}
    </div>
  );
}