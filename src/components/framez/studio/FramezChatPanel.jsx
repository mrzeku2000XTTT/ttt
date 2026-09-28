import React, { useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import ThinkingBubble from './ThinkingBubble';

const PRESETS = [
  'Cinematic launch film for a fintech app called Apex — dark glass, bold type, one killer feature per shot',
  'Kaspa bull run hype film — black background, orange accent, rising candlesticks, moon energy',
  'Minimal product reveal — one word per shot, Apple-style, tiny logo at the end'
];

/**
 * The director conversation — messages, the agent's thinking bubbles, quick
 * presets and the composer. It owns its own scroll, so it can sit either in the
 * desktop column or in the phone's Director panel.
 */
export default function FramezChatPanel({
  messages,
  steps,
  busy,
  elapsed,
  input,
  onInputChange,
  onRun,
  className = ''
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, steps]);

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col min-h-0 ${className}`}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
              m.role === 'user'
                ? 'bg-white text-black rounded-br-md'
                : 'bg-white/[0.06] border border-white/10 text-white/85 rounded-bl-md'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {steps.length > 0 && (
          <div className="space-y-2 pt-1">
            {steps.map((s) => <ThinkingBubble key={s.id} step={s} />)}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-white/40 text-[11px] px-1">
            <Loader2 className="w-3 h-3 animate-spin" /> directing — {elapsed}s elapsed
          </div>
        )}
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-white/10 flex-none">
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => onInputChange(p)}
              className="flex-shrink-0 max-w-[240px] truncate text-[10px] font-medium text-white/50 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
            >
              <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />{p}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 focus-within:border-white/40 transition-colors">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onRun(); } }}
            placeholder="Describe your film — product, vibe, words to hit…"
            rows={1}
            disabled={busy}
            style={{ fontSize: '16px' }}
            className="flex-1 bg-transparent outline-none resize-none text-sm placeholder:text-white/30 max-h-24 py-1"
          />
          <button
            onClick={onRun}
            disabled={!input.trim() || busy}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-all flex-shrink-0"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}