import React, { useEffect, useState } from 'react';
import { Bot, Check, Loader2 } from 'lucide-react';

// One "thinking bubble" — the agent's on-screen reasoning while he codes a shot.
// status: 'thinking' → 'typing' (code streaming in) → 'done'
export default function ThinkingBubble({ step }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!step.code || step.status === 'thinking') { setShown(''); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 26;
      setShown(step.code.slice(0, i));
      if (i >= step.code.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [step.code, step.status]);

  return (
    <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-white/80" />
      </div>
      <div className="flex-1 min-w-0 rounded-xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/85 truncate">{step.label}</span>
          {step.status === 'done' ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : step.status === 'typing' ? (
            <span className="text-[9px] uppercase tracking-widest text-cyan-300/80 flex-shrink-0">writing code</span>
          ) : (
            <Loader2 className="w-3 h-3 animate-spin text-white/40 flex-shrink-0" />
          )}
        </div>
        {step.status !== 'thinking' && step.code && (
          <pre className="mt-1.5 max-h-20 overflow-hidden whitespace-pre font-mono text-[9px] leading-4 text-cyan-200/60 selection:text-white">
            {shown}
          </pre>
        )}
        {step.status === 'thinking' && (
          <div className="mt-1 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}