import React, { useState } from 'react';
import { Download, Film, Image as ImageIcon } from 'lucide-react';

const FORMATS = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
];
const SCALES = [1, 2, 4];

/** Export popover: format + resolution for stills, WEBM for animated styles. */
export default function GlyphExportMenu({ open, onClose, onExport, animated, busy, webmSeconds = 4 }) {
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(2);
  if (!open) return null;

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[262px] rounded-2xl glyph-card p-4">
      <p className="glyph-word text-[11px] mb-3">Export</p>

      <p className="text-[10px] uppercase tracking-[0.14em] glyph-muted mb-1.5">Format</p>
      <div className="flex gap-1.5 mb-3">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`flex-1 rounded-full px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold ${format === f.id ? 'glyph-btn-primary' : 'glyph-pill'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-[0.14em] glyph-muted mb-1.5">Resolution</p>
      <div className="flex gap-1.5 mb-3">
        {SCALES.map((s) => (
          <button
            key={s}
            onClick={() => setScale(s)}
            className={`flex-1 rounded-full px-2 py-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold ${scale === s ? 'glyph-btn-primary' : 'glyph-pill'}`}
          >
            {s}×
          </button>
        ))}
      </div>

      <button
        disabled={busy}
        onClick={() => onExport(format, scale)}
        className="glyph-btn glyph-btn-primary w-full"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Export still
      </button>

      {animated && (
        <button
          disabled={busy}
          onClick={() => onExport('webm', 1)}
          className="glyph-btn glyph-btn-ghost w-full mt-2"
        >
          <Film className="w-3.5 h-3.5" />
          Export {webmSeconds}s WEBM
        </button>
      )}

      <p className="glyph-muted text-[10px] mt-3 leading-relaxed">
        The file contains only the artwork — never the interface.
      </p>

      <button onClick={onClose} className="glyph-muted text-[10px] uppercase tracking-[0.14em] mt-3 flex items-center gap-1">
        <Download className="w-3 h-3" /> close
      </button>
    </div>
  );
}