import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Clapperboard, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { planFilmPrompt, sceneCodePrompt, buildFramezDoc, fallbackScene, stageSize } from '../framezKit';
import ThinkingBubble from './ThinkingBubble';
import FramezStage from './FramezStage';
import FramezCodePanel from './FramezCodePanel';

const PRESETS = [
  'Cinematic launch film for a fintech app called Apex — dark glass, bold type, one killer feature per shot',
  'Kaspa bull run hype film — black background, orange accent, rising candlesticks, moon energy',
  'Minimal product reveal — one word per shot, Apple-style, tiny logo at the end'
];

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    aspect: { type: 'string', enum: ['16:9', '9:16'] },
    bg: { type: 'string' },
    ink: { type: 'string' },
    accent: { type: 'string' },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          summary: { type: 'string' },
          duration: { type: 'number' },
          motion: { type: 'string' }
        },
        required: ['label', 'summary', 'duration']
      }
    }
  },
  required: ['title', 'aspect', 'shots']
};

const CODE_SCHEMA = {
  type: 'object',
  properties: { html: { type: 'string' }, js: { type: 'string' } },
  required: ['html', 'js']
};

export default function FramezStudio() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [steps, setSteps] = useState([]);
  const [messages, setMessages] = useState([
    { role: 'agent', content: "I'm Framez — your coded-film agent. Describe any product, idea, or vibe, and I'll write the HTML motion code for every shot, right in front of you." }
  ]);
  const [film, setFilm] = useState(null);
  const [doc, setDoc] = useState(null);
  const [codeShots, setCodeShots] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, steps]);

  useEffect(() => {
    if (!busy) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  const patchStep = (id, patch) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const pushMsg = (role, content) => setMessages((m) => [...m, { role, content }]);

  // Smart token use: one small call per shot, batches of 3, one retry each.
  const genScene = async (filmObj, shot, i, n) => {
    for (let a = 0; a < 2; a++) {
      try {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: sceneCodePrompt(filmObj, shot, i, n),
          response_json_schema: CODE_SCHEMA
        });
        if (r?.html && r?.js) return r;
      } catch (e) { /* retry once, then fall back */ }
    }
    return fallbackScene(shot);
  };

  const run = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    setElapsed(0);
    setDoc(null);
    setFilm(null);
    setCodeShots([]);
    pushMsg('user', text);
    setSteps([{ id: 'plan', label: 'Breaking your idea into a shot list', status: 'thinking' }]);
    try {
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: planFilmPrompt(text),
        response_json_schema: PLAN_SCHEMA
      });
      const shots = (plan.shots || []).slice(0, 7);
      if (!shots.length) throw new Error('Empty plan');
      const { W, H } = stageSize(plan.aspect);
      const filmObj = {
        title: plan.title || 'Untitled Film',
        aspect: plan.aspect === '9:16' ? '9:16' : '16:9',
        W, H,
        bg: plan.bg || '#050507',
        ink: plan.ink || '#f5f5f7',
        accent: plan.accent || '#22d3ee',
        shots
      };
      patchStep('plan', { status: 'done' });
      setSteps((prev) => [...prev, ...shots.map((s, i) => ({ id: 's' + i, label: `Shot ${i + 1} — ${s.label}`, status: 'thinking' }))]);

      const results = new Array(shots.length);
      for (let b = 0; b < shots.length; b += 3) {
        const batch = shots.slice(b, b + 3).map((shot, k) => ({ shot, i: b + k }));
        const got = await Promise.all(batch.map(({ shot, i }) => genScene(filmObj, shot, i, shots.length)));
        batch.forEach(({ i, shot }, k) => {
          results[i] = got[k];
          patchStep('s' + i, { status: 'typing', code: (got[k].js || '').slice(0, 460) });
          setTimeout(() => patchStep('s' + i, { status: 'done' }), 800);
        });
      }

      const scenes = shots.map((s, i) => ({
        html: results[i].html,
        js: results[i].js,
        dur: Math.min(2.4, Math.max(1.2, Number(s.duration) || 1.6))
      }));
      const total = scenes.reduce((a, s) => a + s.dur, 0);
      setFilm(filmObj);
      setDoc(buildFramezDoc(scenes, { W: filmObj.W, H: filmObj.H, bg: filmObj.bg, ink: filmObj.ink }));
      setCodeShots(shots.map((s, i) => ({ label: s.label, html: results[i].html, code: results[i].js })));
      pushMsg('agent', `"${filmObj.title}" is ready — ${scenes.length} coded shots, ${total.toFixed(1)}s of film. It's playing on the stage. Export it, or open the code to see exactly what I wrote.`);
    } catch (e) {
      pushMsg('agent', `⚠️ ${e.message || 'The film build failed — try again.'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">FRAMEZ</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">Coded motion films — hyperframes for everyone</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,380px),minmax(0,1fr)] gap-4">
          {/* Left — chat + thinking bubbles */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col max-h-[78vh]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
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

            <div className="px-3 pb-3 pt-2 border-t border-white/10">
              <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInput(p)}
                    className="flex-shrink-0 max-w-[240px] truncate text-[10px] font-medium text-white/50 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-all"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />{p}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 focus-within:border-white/40 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
                  placeholder="Describe your film — product, vibe, words to hit…"
                  rows={1}
                  disabled={busy}
                  style={{ fontSize: '16px' }}
                  className="flex-1 bg-transparent outline-none resize-none text-sm placeholder:text-white/30 max-h-24 py-1"
                />
                <button
                  onClick={run}
                  disabled={!input.trim() || busy}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-all flex-shrink-0"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right — stage + code */}
          <div className="space-y-4">
            <FramezStage doc={doc} film={film} />
            <FramezCodePanel shots={codeShots} />
          </div>
        </div>
      </div>
    </div>
  );
}