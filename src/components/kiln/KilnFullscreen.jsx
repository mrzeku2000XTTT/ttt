import React from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import KilnFrame from './KilnFrame';

/** Fullscreen check of the built sheet — preview, copy and download without leaving it. */
export default function KilnFullscreen({ html, width, height, onClose, onCopy, copied, onDownload }) {
  const maxWidth = typeof window === 'undefined' ? 1280 : Math.min(window.innerWidth - 72, 1800);
  return (
    <div className="kiln-page fixed inset-0 z-[200] flex flex-col">
      <header className="flex items-center gap-3 border-b border-[hsl(var(--k-line))] px-4 py-3">
        <span className="kiln-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--k-muted))]">
          {width} × {height} · source size
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onCopy} className="kiln-btn">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy HTML
          </button>
          <button onClick={onDownload} className="kiln-btn">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button onClick={onClose} className="kiln-btn kiln-btn-primary">
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </header>
      <div className="kiln-scroll min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto w-full" style={{ maxWidth }}>
          <KilnFrame html={html} width={width} height={height} maxWidth={maxWidth} />
        </div>
      </div>
    </div>
  );
}