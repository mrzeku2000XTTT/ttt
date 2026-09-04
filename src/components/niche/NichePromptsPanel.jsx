import React, { useState } from 'react';
import { ExternalLink, Check, Copy } from 'lucide-react';
import { VOX_MASTER_PROMPT } from './voxMasterPrompt';
import { STICKMAN_MASTER_PROMPT } from './stickmanMasterPrompt';

// The two master-prompt Google Docs that power the niche studio's engines.
// Each card shows the real Google Docs logo, the doc name, opens the source
// doc in a new tab, and offers a one-click "Use in my niche" copy button.
const PROMPTS = [
  {
    id: 'vox-m1',
    name: 'Vox M1 — Documentary Engine',
    blurb: 'Fern-style narration, hand-cut paper collage, 10 beats, 40-second documentary.',
    docUrl: 'https://docs.google.com/document/d/1oZPM-hyBPsLQZh3sCuAmJf_3n8HlBbtb6ulR4lxd1Xs/edit?tab=t.0',
    prompt: VOX_MASTER_PROMPT,
  },
  {
    id: 'stickman',
    name: 'Stickman Explainer Engine',
    blurb: 'Hand-drawn stickman explainers, 5 clips, 30 seconds, Gemini Omni Flash.',
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

export default function NichePromptsPanel() {
  const [copied, setCopied] = useState(null);

  const copy = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(prompt);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col gap-2 pb-2">
      {PROMPTS.map((p) => {
        const isCopied = copied === p.prompt;
        return (
          <div key={p.id} className="flex items-start gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
            <GoogleDocsLogo className="w-7 h-7 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <a href={p.docUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
              </a>
              <p className="text-xs text-white/50 mt-0.5 leading-snug">{p.blurb}</p>
              <button
                onClick={() => copy(p.prompt)}
                className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isCopied
                    ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                    : 'border-white/15 text-white/70 hover:text-white hover:border-white/40'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied — paste anywhere' : 'Use in my niche'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}