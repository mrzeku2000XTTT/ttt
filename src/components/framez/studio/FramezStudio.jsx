import React, { useState, useEffect } from 'react';
import { Clapperboard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { planFilmPrompt, sceneCodePrompt, buildFramezDoc, fallbackScene, stageSize } from '../framezKit';
import FramezStage from './FramezStage';
import FramezCodePanel from './FramezCodePanel';
import FramezChatPanel from './FramezChatPanel';
import FramezMobileTabs from './FramezMobileTabs';

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
          motion: { type: 'string' },
          beat: { type: 'string' },
          image: { type: 'string', description: 'Optional prompt for a generated hero visual' }
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
  // On a phone the studio shows one panel at a time so it always fits the screen.
  const [tab, setTab] = useState('director');

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
  const genScene = async (filmObj, shot, i, n, imageUrl) => {
    for (let a = 0; a < 2; a++) {
      try {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: sceneCodePrompt(filmObj, shot, i, n, imageUrl),
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

      // Generate hero images for shots that request one (batched, best-effort)
      const imageUrls = {};
      const imgJobs = shots.map((s, i) => ({ i, prompt: s.image })).filter((x) => x.prompt);
      if (imgJobs.length) {
        setSteps((prev) => [...prev, { id: 'imgs', label: `Generating ${imgJobs.length} hero image${imgJobs.length > 1 ? 's' : ''}`, status: 'thinking' }]);
        for (let b = 0; b < imgJobs.length; b += 3) {
          const batch = imgJobs.slice(b, b + 3);
          await Promise.all(batch.map(async (j) => {
            try { const r = await base44.integrations.Core.GenerateImage({ prompt: j.prompt }); if (r?.url) imageUrls[j.i] = r.url; } catch (e) {}
          }));
        }
        patchStep('imgs', { status: 'done' });
      }

      const results = new Array(shots.length);
      for (let b = 0; b < shots.length; b += 3) {
        const batch = shots.slice(b, b + 3).map((shot, k) => ({ shot, i: b + k }));
        const got = await Promise.all(batch.map(({ shot, i }) => genScene(filmObj, shot, i, shots.length, imageUrls[i])));
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
      setTab('film');
      pushMsg('agent', `"${filmObj.title}" is ready — ${scenes.length} coded shots, ${total.toFixed(1)}s of film. It's playing on the stage. Export it, or open the code to see exactly what I wrote.`);
    } catch (e) {
      pushMsg('agent', `⚠️ ${e.message || 'The film build failed — try again.'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-[100dvh] lg:h-auto lg:min-h-screen bg-black text-white flex flex-col overflow-hidden lg:block lg:overflow-visible">
      <div className="flex flex-col flex-1 min-h-0 lg:block lg:max-w-6xl lg:mx-auto lg:px-4 lg:py-6">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 pr-20 sm:pr-40 flex-none lg:px-0 lg:pt-0 lg:pb-0 lg:mb-6 lg:pr-40">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">FRAMEZ</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">Coded motion films — hyperframes for everyone</div>
          </div>
        </div>

        {/* Phone — one panel at a time, so the studio always fits the screen */}
        <div className="lg:hidden flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {tab === 'director' && (
            <FramezChatPanel
              className="h-full"
              messages={messages}
              steps={steps}
              busy={busy}
              elapsed={elapsed}
              input={input}
              onInputChange={setInput}
              onRun={run}
            />
          )}

          {tab === 'film' && (
            <div className="min-h-full flex flex-col justify-center">
              <FramezStage doc={doc} film={film} />
            </div>
          )}

          {tab === 'code' && (
            codeShots.length ? (
              <FramezCodePanel shots={codeShots} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-xs text-white/35">
                Build a film and every line the agent writes shows up here.
              </div>
            )
          )}
        </div>

        {/* Desktop — the director chat beside the stage */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,380px),minmax(0,1fr)] gap-4">
          <FramezChatPanel
            className="max-h-[78vh]"
            messages={messages}
            steps={steps}
            busy={busy}
            elapsed={elapsed}
            input={input}
            onInputChange={setInput}
            onRun={run}
          />
          <div className="space-y-4">
            <FramezStage doc={doc} film={film} />
            <FramezCodePanel shots={codeShots} />
          </div>
        </div>

        <div className="lg:hidden flex-none">
          <FramezMobileTabs active={tab} onChange={setTab} />
        </div>
      </div>
    </div>
  );
}