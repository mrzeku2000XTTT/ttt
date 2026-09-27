import React from 'react';
import { Sparkles } from 'lucide-react';
import GlyphMark from './GlyphMark';

const when = (ts) => {
  if (!ts) return '—';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

// The identity behind the shelf: who this gallery belongs to, and what is on it.
export default function GlyphProfileTab({ wallet, works, onInspire }) {
  const styles = new Set(works.map((w) => w.style));
  const last = works.reduce((newest, w) => Math.max(newest, w.savedAt || 0), 0);

  const stats = [
    { label: 'pieces kept', value: works.length },
    { label: 'styles explored', value: styles.size },
    { label: 'last kept', value: when(last) },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="glyph-card flex items-center gap-4 rounded-2xl p-4">
        <GlyphMark size={46} />
        <div className="min-w-0">
          <p className="glyph-word text-[15px]">Glyph profile</p>
          <p className="glyph-mono glyph-muted mt-1 truncate text-[11px]">{wallet || 'no wallet connected'}</p>
        </div>
        <button onClick={onInspire} className="glyph-btn glyph-btn-primary ml-auto shrink-0">
          <Sparkles className="h-3.5 w-3.5" />
          Inspire me
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glyph-card rounded-2xl px-3 py-3">
            <p className="text-[20px] font-extrabold leading-none">{s.value}</p>
            <p className="glyph-muted mt-1.5 text-[10px] uppercase tracking-[0.16em]">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="glyph-muted mt-4 text-[12px] leading-relaxed">
        Everything here is rendered on your own machine and kept on this device, tied to this wallet. Your
        gallery is still there after a refresh, and nothing is ever uploaded. Open any piece to put its
        settings back into the studio, then export it at full size or as a moving clip.
      </p>
    </div>
  );
}