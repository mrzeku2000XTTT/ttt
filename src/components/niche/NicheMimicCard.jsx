import React, { useState } from 'react';
import { Eye, Code2, Copy, Check, Download } from 'lucide-react';

// Live Mimic clone card shown inside the NICHE chat — the same pixel-faithful
// HTML MetaMimic produces, with preview/code tabs, copy and download.
// Edits happen through the chat itself ("make the button red…").
export default function NicheMimicCard({ html }) {
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  const copy = () => {
    try {
      navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mimic-clone.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex gap-1 rounded-full bg-black/40 p-1">
          <button
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === 'preview' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setTab('code')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === 'code' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Code2 className="w-3.5 h-3.5" /> Code
          </button>
        </div>
        <div className="flex gap-1.5">
          <button onClick={copy} className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 transition" title="Copy code">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={download} className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 transition" title="Download .html">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      {tab === 'preview' ? (
        <iframe title="Mimic clone" srcDoc={html} className="h-[420px] w-full rounded-lg border border-white/10 bg-white" />
      ) : (
        <pre className="h-[420px] w-full overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-emerald-200">
          <code>{html}</code>
        </pre>
      )}
    </div>
  );
}