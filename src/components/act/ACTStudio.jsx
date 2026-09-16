import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ActStream from './ActStream';

const uid = () => Math.random().toString(36).slice(2);

const READING_SYSTEM = `You are the real-time eye of ACT, an app where the user types sentences and each one becomes an image the instant a period is pressed. Analyze the PARTIAL TEXT below — it may be mid-word. Reply with ONE vivid line (max 90 characters) describing the image currently forming: subject, setting, mood. No preamble, no quotes.`;
const READING_SCHEMA = { type: 'object', properties: { reading: { type: 'string' } }, required: ['reading'] };

const QUALITY = 'Beautifully composed, striking, vivid detail, cinematic lighting, high quality.';

export default function ACTStudio() {
  const [mode, setMode] = useState(() => localStorage.getItem('act_mode') !== 'off');
  const [buffer, setBuffer] = useState('');
  const [items, setItems] = useState([]);
  const [reading, setReading] = useState(null);
  const [chars, setChars] = useState(0);
  const readReq = useRef(0);
  const readingRef = useRef(null);
  const scrollRef = useRef(null);
  const imgCount = items.filter((i) => i.kind === 'shot').length;

  useEffect(() => {
    localStorage.setItem('act_mode', mode ? 'on' : 'off');
  }, [mode]);
  useEffect(() => {
    readingRef.current = reading;
  }, [reading]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items, buffer, reading]);

  const fire = (sentence) => {
    const sid = uid();
    setItems((p) => [...p, { id: sid, kind: 'shot', status: 'pending', startedAt: Date.now(), prompt: sentence }]);
    const seed = sentence.replace(/\.$/, '').trim();
    const eye = readingRef.current;
    base44.integrations.Core.GenerateImage({
      prompt: `${seed}. ${eye ? `${eye.trim()} ` : ''}${QUALITY}`,
    })
      .then(({ url }) => setItems((p) => p.map((it) => (it.id === sid ? { ...it, status: 'done', url } : it))))
      .catch(() => setItems((p) => p.map((it) => (it.id === sid ? { ...it, status: 'error' } : it))));
  };

  const retry = (item) => {
    setItems((p) => p.map((it) => (it.id === item.id ? { ...it, status: 'pending', startedAt: Date.now() } : it)));
    const seed = item.prompt.replace(/\.$/, '').trim();
    base44.integrations.Core.GenerateImage({ prompt: `${seed} ${QUALITY}` })
      .then(({ url }) => setItems((p) => p.map((it) => (it.id === item.id ? { ...it, status: 'done', url } : it))))
      .catch(() => setItems((p) => p.map((it) => (it.id === item.id ? { ...it, status: 'error' } : it))));
  };

  const onChange = (e) => {
    const value = e.target.value;
    setChars((c) => c + Math.max(0, value.length - buffer.length));
    if (!mode) {
      setBuffer(value);
      return;
    }
    // Every finished sentence (≥3 letters before a period) commits and fires.
    let kept = '';
    let out = value;
    for (;;) {
      const i = out.indexOf('.');
      if (i === -1) break;
      const seg = out.slice(0, i);
      const after = out.slice(i + 1);
      if ((kept + seg).trim().length >= 3) {
        const sentence = `${kept + seg}.`.trim();
        setItems((p) => [...p, { id: uid(), kind: 'text', text: sentence }]);
        fire(sentence);
        kept = '';
      } else {
        kept += `${seg}.`;
      }
      out = after;
    }
    setBuffer(kept + out);
  };

  // Real-time analysis of the text as it is being typed.
  useEffect(() => {
    if (!mode) {
      setReading(null);
      return;
    }
    const t = buffer.trim();
    if (t.length < 3) {
      setReading(null);
      return;
    }
    const req = ++readReq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `${READING_SYSTEM}\n\nPARTIAL TEXT: "${t}"`,
          response_json_schema: READING_SCHEMA,
        });
        if (req === readReq.current && res?.reading) setReading(res.reading);
      } catch {}
    }, 600);
    return () => clearTimeout(timer);
  }, [buffer, mode]);

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white">
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/10 shrink-0">
        <span className="text-sm font-black tracking-tight">ACT</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] text-neutral-600 tracking-wide">
            {chars} letters · {imgCount} images
          </span>
          <button
            onClick={() => {
              setItems([]);
              setBuffer('');
            }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white px-2 h-8"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" /> clear
          </button>
          <button
            onClick={() => setMode((m) => !m)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-[10px] uppercase tracking-widest transition-colors ${
              mode ? 'bg-white text-black border-white' : 'text-neutral-400 border-white/15 hover:text-white'
            }`}
            title="Real-time mode: every period fires an image"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode ? 'bg-black' : 'bg-neutral-600'}`} />
            real time {mode ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {items.length === 0 && !buffer && (
            <div className="text-center text-neutral-600 text-xs leading-relaxed pt-24">
              <p className="text-2xl font-black text-neutral-300 tracking-tight">Type what you want to see.</p>
              <p className="mt-3">Every letter is read in real time.</p>
              <p>Finish a sentence with a period — the period itself becomes the image.</p>
            </div>
          )}
          <ActStream items={items} onRetry={retry} />
          {buffer && (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200 mt-3">{buffer}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="h-4 mb-2 text-[11px] text-neutral-500 truncate">
            {!mode
              ? 'real time is off — periods are just periods'
              : reading
                ? `ACT sees: ${reading}`
                : buffer.trim().length >= 3
                  ? 'ACT is reading…'
                  : 'every sentence ends with a period'}
          </div>
          <textarea
            value={buffer}
            onChange={onChange}
            rows={2}
            placeholder="type what you want to see…"
            className="w-full resize-none bg-neutral-950 border border-white/15 rounded-xl px-4 py-3 text-[15px] placeholder:text-neutral-600 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>
    </div>
  );
}