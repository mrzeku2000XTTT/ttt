import React from 'react';
import { Check, Copy, Download, Maximize2 } from 'lucide-react';
import KilnFrame from './KilnFrame';
import { IconCodeSheet, IconEye } from './KilnIcons';

const TABS = [
  { id: 'preview', label: 'Preview', Icon: IconEye },
  { id: 'code', label: 'Code', Icon: IconCodeSheet },
];

export default function KilnPreview({ html, width, height, tab, onTab, onCopy, copied, onDownload, onFullscreen }) {
  return (
    <section className="kiln-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[hsl(var(--k-line))] px-3 py-2">
        <div className="kiln-pixel flex border border-[hsl(var(--k-line))] bg-[hsl(var(--k-bg))] p-[2px]">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                tab === id ? 'bg-[hsl(var(--k-ink))] text-[hsl(var(--k-bg))]' : 'text-[hsl(var(--k-muted))]'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onCopy} title="Copy the HTML" className="kiln-btn px-2.5 py-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onDownload} title="Download .html" className="kiln-btn px-2.5 py-1.5">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={onFullscreen} title="Fullscreen" className="kiln-btn px-2.5 py-1.5">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="kiln-scroll min-h-0 flex-1 overflow-auto bg-[hsl(var(--k-bg))] p-3">
        {tab === 'preview' ? (
          <KilnFrame html={html} width={width} height={height} />
        ) : (
          <pre className="kiln-code kiln-pixel kiln-mono max-h-[70vh] overflow-auto p-4 text-[11px] leading-[1.65]">
            <code>{html}</code>
          </pre>
        )}
      </div>
    </section>
  );
}