import React, { useState } from 'react';
import { ChevronDown, Code2, Copy, Check } from 'lucide-react';
import { FRAMEZ_TEACHER } from '../framezKit';

// Code panel — inspect and copy the actual code the agent wrote for each shot.
export default function FramezCodePanel({ shots }) {
  const [open, setOpen] = useState(-1);
  const [copied, setCopied] = useState('');

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  if (!shots?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/50">
          <Code2 className="w-3.5 h-3.5" /> The code
        </div>
        <button
          onClick={() => copy(FRAMEZ_TEACHER, 'teacher')}
          className="flex items-center gap-1 text-[10px] font-semibold text-white/50 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-all"
        >
          {copied === 'teacher' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          Copy teacher prompt
        </button>
      </div>
      <div className="space-y-1.5">
        {shots.map((s, i) => (
          <div key={i} className="rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/5 transition-all text-left"
            >
              <span className="text-xs font-semibold text-white/80 truncate">{i + 1}. {s.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform flex-shrink-0 ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <div className="border-t border-white/10">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03]">
                  <span className="text-[9px] uppercase tracking-widest text-white/30">scene function</span>
                  <button
                    onClick={() => copy(`// html\n${s.html}\n\n// js (runs each frame as function(t, Fz, root))\n${s.code}`, 's' + i)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-white/50 hover:text-white"
                  >
                    {copied === 's' + i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
                  </button>
                </div>
                <pre className="px-3 py-2 max-h-52 overflow-auto font-mono text-[10px] leading-4 text-cyan-200/70 whitespace-pre-wrap">
{s.html}
{'\n'}
{s.code}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}