import React from 'react';
import { ETA_EDIT_IDEAS, ETA_LIBRARY } from './kilnComponents';

/** The ETA component window: the library KILN edits with, and the briefs that drive it. */
export default function KilnComponentRail({ used = [], onInstruct, onChoose }) {
  const usedNames = new Set(used.map((entry) => entry.component));
  return (
    <aside className="kiln-card kiln-scroll flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="border-b border-[hsl(var(--k-line))] px-3 py-2">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--k-muted))]">
          ETA components
        </span>
      </div>

      <div className="space-y-[3px] p-2">
        {ETA_LIBRARY.map((component) => {
          const isUsed = usedNames.has(component.name);
          return (
            <button
              key={component.name}
              onClick={() => onChoose(component.name)}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
                isUsed ? 'bg-[hsl(var(--k-ink))] text-[hsl(var(--k-bg))]' : 'hover:bg-[hsl(var(--k-bg))]'
              }`}
            >
              <span className={`kiln-px shrink-0 ${isUsed ? 'is-on' : ''}`} />
              <span className="min-w-0 flex-1">
                <span className="kiln-mono block truncate text-[10.5px] font-semibold">{component.name}</span>
                <span
                  className={`block truncate text-[9.5px] ${
                    isUsed ? 'text-[hsl(var(--k-bg))] opacity-70' : 'text-[hsl(var(--k-muted))]'
                  }`}
                >
                  {component.use}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-y border-[hsl(var(--k-line))] px-3 py-2">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--k-muted))]">
          Motion briefs
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2">
        {ETA_EDIT_IDEAS.map((idea) => (
          <button
            key={idea.label}
            onClick={() => onInstruct(idea.brief)}
            className="kiln-pixel border border-[hsl(var(--k-line))] bg-[hsl(var(--k-surface))] px-2 py-1 text-[10px] font-semibold hover:border-[hsl(var(--k-amber))]"
          >
            {idea.label}
          </button>
        ))}
      </div>
    </aside>
  );
}