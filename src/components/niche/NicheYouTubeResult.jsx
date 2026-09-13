import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';

export default function NicheYouTubeResult({ result, onMake }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${result.style.name}\n\nAnimation language:\n${result.summary}\n\nStory blueprint:\n${result.storyStructure}`);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs font-bold text-white">{result.style.name}</p><p className="mt-1 text-xs leading-5 text-white/50">{result.summary}</p></div>
      <div className="rounded-xl border border-white/10 p-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Reusable story blueprint</p><button onClick={copy} className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}</button></div><p className="mt-2 text-xs leading-5 text-white/60">{result.storyStructure}</p></div>
      <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Original viral directions</p><div className="space-y-2">{result.ideas.map((idea, index) => <div key={index} className="rounded-xl border border-white/10 p-3"><p className="text-xs font-semibold text-white">{idea.title}</p><p className="mt-1 text-xs text-white/45">{idea.hook}</p><button onClick={() => onMake(idea)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black"><Play className="h-3 w-3 fill-current" /> Make and show this video</button></div>)}</div></div>
    </div>
  );
}