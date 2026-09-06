import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * Chat panel — messages + working indicator with elapsed time + input.
 */
export default function KinezmaChat({ messages, busy, elapsed, onSend }) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const submit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    onSend(text);
  };

  const ideas = [
    'Drop the title in with a bounce',
    'Logo spins in, background pans right',
    'Everything fades in one by one, slow zoom'
  ];

  return (
    <div className="flex flex-col h-full border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-white text-black rounded-br-sm'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm'
              }`}
            >
              {m.working ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{m.text}{elapsed ? ` · ${elapsed}s` : ''}</span>
                </div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}
        {messages.length <= 1 && !busy && (
          <div className="pt-2 space-y-1.5">
            {ideas.map((idea) => (
              <button
                key={idea}
                onClick={() => onSend(idea)}
                className="w-full text-left text-xs text-zinc-400 border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={submit} className="border-t border-zinc-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the motion…"
          className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-white text-black rounded-lg px-3.5 flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}