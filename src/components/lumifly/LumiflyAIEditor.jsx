import React, { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SCENE_FIELD_LABELS } from './lumiflyScenePatch';

/**
 * The AI editor. Plain instructions go to the lumiflyDirector function, which
 * returns a patch of scene settings; the studio applies it to the scene on
 * screen. Every other setting is left exactly as it was.
 */
export default function LumiflyAIEditor({ scene, onApply }) {
  const [prompt, setPrompt] = useState('');
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(true);

  const send = async () => {
    const instruction = prompt.trim();
    if (!instruction || busy) return;
    setBusy(true);
    setError(null);

    const history = log.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setLog((l) => [...l, { role: 'user', content: instruction }]);
    setPrompt('');

    try {
      const res = await base44.functions.invoke('lumiflyDirector', { prompt: instruction, scene, history });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);

      const keys = Object.keys(data.patch || {});
      if (keys.length) onApply?.(data.patch);

      const changed = keys.map((k) => SCENE_FIELD_LABELS[k] || k).join(', ');
      setLog((l) => [
        ...l,
        {
          role: 'assistant',
          content: data.reply || 'Updated the scene.',
          changed: keys.length ? changed : 'no change',
        },
      ]);
    } catch (e) {
      setError(e?.message || 'That change did not go through.');
      setLog((l) => [...l, { role: 'assistant', content: 'I could not make that change.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-3 pb-2 sm:px-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
          <Sparkles className="w-3.5 h-3.5 text-[#00c29f]" />
          <span className="text-[11px] font-medium text-white/80">AI editor</span>
          <span className="hidden text-[10px] text-white/35 sm:inline">controls every setting on this scene</span>
          <span className="ml-auto text-[10px] text-white/35">{open ? 'Hide' : 'Show'}</span>
        </button>

        {open && (
          <div className="px-3 pb-3">
            {log.length > 0 && (
              <div className="mb-2 max-h-28 space-y-1.5 overflow-y-auto">
                {log.slice(-4).map((m, i) => (
                  <p
                    key={i}
                    className={`text-[11px] leading-relaxed ${m.role === 'user' ? 'text-white/45' : 'text-white/80'}`}
                  >
                    {m.role === 'user' ? `“${m.content}”` : m.content}
                    {m.changed ? <span className="ml-1.5 text-[10px] text-[#00c29f]">· {m.changed}</span> : null}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 focus-within:border-white/25">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Make it bigger and slower, warmer gradient, add a glow…"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder:text-white/25 outline-none"
              />
              <button
                onClick={send}
                disabled={busy || !prompt.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {busy ? 'Directing' : 'Apply'}
              </button>
            </div>

            {error && <p className="mt-1.5 text-[10px] text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}