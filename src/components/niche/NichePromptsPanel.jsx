import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Copy, Plus, Trash2, X, FileText } from 'lucide-react';
import { VOX_MASTER_PROMPT } from './voxMasterPrompt';
import { STICKMAN_MASTER_PROMPT } from './stickmanMasterPrompt';

const CUSTOM_KEY = 'niche_custom_prompts';

// Built-in master-prompt Google Docs that power the niche studio's engines.
const BUILT_IN = [
  {
    id: 'vox-m1',
    name: 'Vox M1 — Documentary Engine',
    blurb: 'Fern narration, paper collage, 40s doc.',
    docUrl: 'https://docs.google.com/document/d/1oZPM-hyBPsLQZh3sCuAmJf_3n8HlBbtb6ulR4lxd1Xs/edit?tab=t.0',
    prompt: VOX_MASTER_PROMPT,
  },
  {
    id: 'stickman',
    name: 'Stickman Explainer Engine',
    blurb: 'Hand-drawn stickman, 30s, Omni Flash.',
    docUrl: 'https://docs.google.com/document/d/1RrxtNZ2h5GbF4YCHacElNpzg5gn-761upBEixxIeWtE/edit?tab=t.0',
    prompt: STICKMAN_MASTER_PROMPT,
  },
];

function GoogleDocsLogo({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M19 2H8a2 2 0 0 0-2 2v24a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9z" fill="#4285F4" />
      <path d="M19 2v5a2 2 0 0 0 2 2h5z" fill="#a1c2fa" />
      <rect x="9" y="14" width="14" height="1.6" rx="0.8" fill="#fff" />
      <rect x="9" y="18" width="14" height="1.6" rx="0.8" fill="#fff" />
      <rect x="9" y="22" width="9" height="1.6" rx="0.8" fill="#fff" />
    </svg>
  );
}

export default function NichePromptsPanel({ onUse }) {
  const [custom, setCustom] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    try {
      setCustom(JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]') || []);
    } catch {}
  }, []);

  const persist = (next) => {
    setCustom(next);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {}
  };

  const saveCustom = () => {
    const n = name.trim();
    if (!n) return;
    persist([
      ...custom,
      { id: Math.random().toString(36).slice(2), name: n, blurb: 'Your prompt', docUrl: docUrl.trim(), prompt: prompt.trim() },
    ]);
    setName('');
    setDocUrl('');
    setPrompt('');
    setAdding(false);
  };

  const removeCustom = (id) => persist(custom.filter((c) => c.id !== id));

  const all = [...BUILT_IN, ...custom];

  return (
    <div className="flex flex-col gap-1.5 pb-1">
      {all.map((p) => {
        const copyVal = p.prompt || p.docUrl || '';
        return (
          <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-white/[0.02]">
            {p.docUrl ? (
              <GoogleDocsLogo className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 flex-shrink-0 text-white/40" />
            )}
            <div className="flex-1 min-w-0">
              {p.docUrl ? (
                <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1">
                  <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                  <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white/80 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-xs font-semibold text-white truncate">{p.name}</span>
              )}
              {p.blurb && <p className="text-[10px] text-white/40 truncate leading-tight">{p.blurb}</p>}
            </div>
            <button
              onClick={() => onUse?.(copyVal)}
              disabled={!copyVal}
              title="Use in my niche — load into the chat"
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[11px] font-semibold transition-all disabled:opacity-40"
            >
              <Copy className="w-3 h-3" />
              Use
            </button>
            {custom.some((c) => c.id === p.id) && (
              <button
                onClick={() => removeCustom(p.id)}
                title="Remove"
                className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="p-2 rounded-xl border border-white/15 bg-white/[0.03] space-y-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. My Vox prompt)"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
          <input
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            placeholder="Google Doc URL (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste the prompt text (optional — copied on Use)"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none resize-y"
          />
          <div className="flex gap-1.5">
            <button
              onClick={saveCustom}
              disabled={!name.trim()}
              className="flex-1 py-1.5 rounded-lg bg-white text-black text-xs font-bold disabled:opacity-40 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setName(''); setDocUrl(''); setPrompt(''); }}
              className="px-2.5 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add your own
        </button>
      )}
    </div>
  );
}