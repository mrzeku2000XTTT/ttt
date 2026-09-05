import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Download, Film, Copy, Check, ArrowLeft, Youtube, TrendingUp, Wand2, BrainCircuit, ExternalLink } from 'lucide-react';
import HyperLogo from './HyperLogo';

const uid = () => Math.random().toString(36).slice(2);
const BRAIN_MODEL = 'gpt_5_6_sol'; // flagship GPT-5.6 brain
const STORE_KEY = 'hyper_studio_chat_v1';

const QUICK = [
  { icon: Youtube, label: 'Ad Intel', text: 'Find the best-performing crypto ads and promo videos on YouTube right now and break down what makes them work' },
  { icon: TrendingUp, label: 'Growth Plan', text: 'Build me a realistic 90-day organic growth strategy for a crypto YouTube channel from zero' },
  { icon: Wand2, label: 'Motion', text: 'Make a cinematic motion graphic for our token launch — black, premium, no text' },
];

// ── Orchestrator brain: classify intent, then run the right pipeline ──
const ORCHESTRATOR_PROMPT = (msg) => `You are HYPER's orchestrator brain — an elite crypto marketing intelligence system.
The user said: """${msg}"""

Classify the intent into exactly ONE action:
- "research" → they want YouTube ad/video research (crypto ads, competitor videos, channel scans, "what's working", promo analysis).
- "strategy" → they want an organic growth / marketing strategy, plan, roadmap, cadence, or content system.
- "motion" → they want a motion graphic / video / animation rendered.
- "chat" → general marketing question or conversation.

Return JSON:
- action: one of research|strategy|motion|chat
- searchQuery: (research only) a sharp YouTube search query, crypto-marketing focused, e.g. "best crypto ads 2026", "Kaspa promo video", "crypto exchange commercial". Empty otherwise.
- reply: one confident sentence telling the user what you're doing (this is shown immediately).
- videoPrompt: (motion only) a vivid, self-contained cinematic motion-graphics prompt. Black/dark background, realistic, film grain, studio lighting, describe ONLY what is SEEN — motion, camera, lighting, materials. 1–3 sentences. Empty otherwise.
- duration: (motion only) 4, 6 or 8.`;

const STRATEGY_PROMPT = (msg) => `You are HYPER's Organic Growth Architect — a crypto marketing strategist who has scaled YouTube channels and token communities from zero.
User request: """${msg}"""

Design a REALISTIC, no-fluff organic growth strategy. Assume a small team (1–3 people) and zero ad budget. Be specific to crypto: hooks around price action narrative, builder transparency, token utility, community rituals.
Return JSON:
- reply: 2–3 sentence executive summary of the play.
- phases: 3–4 phases, each { title, timeframe, focus, actions: 3–4 concrete weekly actions }
- hooks: 5 scroll-stopping video hook ideas tuned for crypto audiences
- kpis: 4 measurable numbers to track weekly
- cadence: recommended posting cadence in one line.`;

const ANALYSIS_PROMPT = (msg, videos) => `You are HYPER's Ad Intelligence analyst — a crypto marketing expert.
The user asked: """${msg}"""
Here are real YouTube videos found (title, channel, views):
${JSON.stringify(videos, null, 1).slice(0, 6000)}

Analyze what's working in crypto marketing right now based on these. Return JSON:
- insights: 3–4 sentences on the patterns that make these ads/videos perform (hooks, tone, format, CTAs).
- topPatterns: 4 short bullet patterns worth stealing
- recommendedActions: 3 concrete things the user should do next`;

export default function HyperStudio({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [vertical, setVertical] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      setMessages(
        saved.length
          ? saved
          : [
              {
                id: uid(),
                role: 'ai',
                text: 'HYPER online. I run crypto ad research on YouTube, build realistic organic growth systems, and render cinematic motion graphics. Ask me anything — or hit a quick action below.',
              },
            ]
      );
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const workId = uid();
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text },
      { id: workId, role: 'ai', working: true, text: 'Thinking', startedAt: Date.now() },
    ]);
    const setWork = (t) => setMessages((m) => m.map((x) => (x.id === workId ? { ...x, text: t } : x)));
    const finish = (patch) =>
      setMessages((m) => m.map((x) => (x.id === workId ? { ...x, working: false, ...patch } : x)));

    try {
      // 1. Brain classifies intent
      const plan = await base44.integrations.Core.InvokeLLM({
        model: BRAIN_MODEL,
        prompt: ORCHESTRATOR_PROMPT(text),
        response_json_schema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['research', 'strategy', 'motion', 'chat'] },
            searchQuery: { type: 'string' },
            reply: { type: 'string' },
            videoPrompt: { type: 'string' },
            duration: { type: 'number' },
          },
        },
      });

      if (plan.action === 'research') {
        setWork('Scanning YouTube ads & videos');
        const res = await base44.functions.invoke('youtubeApiSearch', {
          query: plan.searchQuery || text,
        });
        const videos = res?.videos || res?.data?.videos || [];
        setWork('Reverse-engineering what works');
        const analysis = await base44.integrations.Core.InvokeLLM({
          model: BRAIN_MODEL,
          prompt: ANALYSIS_PROMPT(text, videos),
          response_json_schema: {
            type: 'object',
            properties: {
              insights: { type: 'string' },
              topPatterns: { type: 'array', items: { type: 'string' } },
              recommendedActions: { type: 'array', items: { type: 'string' } },
            },
          },
        });
        finish({ text: plan.reply, videos, analysis });
      } else if (plan.action === 'strategy') {
        setWork('Architecting your growth system');
        const strategy = await base44.integrations.Core.InvokeLLM({
          model: BRAIN_MODEL,
          prompt: STRATEGY_PROMPT(text),
          response_json_schema: {
            type: 'object',
            properties: {
              reply: { type: 'string' },
              phases: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    timeframe: { type: 'string' },
                    focus: { type: 'string' },
                    actions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              hooks: { type: 'array', items: { type: 'string' } },
              kpis: { type: 'array', items: { type: 'string' } },
              cadence: { type: 'string' },
            },
          },
        });
        finish({ strategy });
      } else if (plan.action === 'motion') {
        setWork('Rendering motion');
        const vid = await base44.integrations.Core.GenerateVideo({
          prompt: plan.videoPrompt,
          duration: plan.duration === 4 || plan.duration === 8 ? plan.duration : 6,
          aspect_ratio: vertical ? '9:16' : '16:9',
          generate_audio: false,
        });
        finish({ text: plan.reply || 'Render complete.', video: { url: vid.url, prompt: plan.videoPrompt } });
      } else {
        finish({ text: plan.reply });
      }
    } catch (e) {
      finish({ text: `Something broke: ${e?.message || e}. Try again?` });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const download = (m) => {
    const a = document.createElement('a');
    a.href = m.video.url;
    a.download = `hyper-${m.id}.mp4`;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HyperLogo size={36} />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight leading-none">HYPER</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/15 bg-white/[0.03] text-[9px] font-black tracking-widest text-white/50">
                <BrainCircuit className="w-3 h-3" /> GPT-5.6 BRAIN
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVertical((v) => !v)}
              disabled={busy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all disabled:opacity-40 ${
                vertical ? 'border-white/40 bg-white/10' : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              {vertical ? '9:16' : '16:9'}
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </button>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-5">
          {messages.map((m) => (
            <Message key={m.id} m={m} onDownload={download} vertical={vertical} />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                  disabled={busy}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/40 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  <Icon className="w-3.5 h-3.5" /> {q.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask HYPER — spy on crypto ads, build a growth plan, or render a motion graphic…"
              disabled={busy}
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="px-4 py-3 rounded-xl font-bold bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all disabled:opacity-40"
              aria-label="Send"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message renderer: text / video result / research result / strategy result ──
function Message({ m, onDownload, vertical }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 bg-white text-black text-sm leading-relaxed">
          {m.text}
        </div>
      </div>
    );
  }

  if (m.working) {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white/[0.04] border border-white/10 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin opacity-70" /> {m.text}
            <span className="inline-flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-fit rounded-2xl rounded-bl-sm px-4 py-3 bg-white/[0.04] border border-white/10 backdrop-blur-xl text-sm leading-relaxed space-y-4">
        {m.text && <p className="whitespace-pre-line">{m.text}</p>}

        {/* Strategy system */}
        {m.strategy && <StrategyCard s={m.strategy} />}

        {/* Research result */}
        {m.analysis && (
          <div className="space-y-3">
            <p className="text-white/80">{m.analysis.insights}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] font-black tracking-widest text-white/30 mb-2">PATTERNS THAT WORK</div>
                <ul className="space-y-1.5">
                  {(m.analysis.topPatterns || []).map((p, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2">
                      <span className="text-white/30">▸</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] font-black tracking-widest text-white/30 mb-2">DO THIS NEXT</div>
                <ul className="space-y-1.5">
                  {(m.analysis.recommendedActions || []).map((p, i) => (
                    <li key={i} className="text-xs text-white/70 flex gap-2">
                      <span className="text-white/30">▸</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {m.videos?.length > 0 && <VideoGrid videos={m.videos} />}

        {/* Motion render */}
        {m.video && (
          <div className="space-y-2">
            <video
              src={m.video.url}
              controls
              autoPlay
              muted
              loop
              className={`w-full rounded-xl border border-white/10 bg-black ${vertical ? 'max-h-[60vh] mx-auto' : ''}`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onDownload(m)}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download MP4
              </button>
              <CopyBtn value={m.video.prompt} />
            </div>
            <p className="text-[11px] text-white/30 border-l-2 border-white/10 pl-2 italic">{m.video.prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ s }) {
  const [copied, setCopied] = useState(false);
  const full = JSON.stringify(s, null, 2);
  return (
    <div className="space-y-4">
      <p className="text-white/80">{s.reply}</p>
      <div className="space-y-2">
        {(s.phases || []).map((p, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-black tracking-widest text-white/30">PHASE {i + 1} · {p.timeframe}</div>
            </div>
            <div className="mt-1 font-bold text-sm">{p.title}</div>
            <div className="text-xs text-white/50 mt-0.5">{p.focus}</div>
            <ul className="mt-2 space-y-1.5">
              {(p.actions || []).map((a, j) => (
                <li key={j} className="text-xs text-white/70 flex gap-2">
                  <span className="text-white/30">▸</span> {a}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[10px] font-black tracking-widest text-white/30 mb-2">VIDEO HOOKS</div>
          <ul className="space-y-1.5">
            {(s.hooks || []).map((h, i) => (
              <li key={i} className="text-xs text-white/70 flex gap-2">
                <span className="text-white/30">▸</span> {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[10px] font-black tracking-widest text-white/30 mb-2">WEEKLY KPIs</div>
          <div className="flex flex-wrap gap-1.5">
            {(s.kpis || []).map((k, i) => (
              <span key={i} className="px-2 py-1 rounded-full border border-white/15 text-[11px] text-white/70">{k}</span>
            ))}
          </div>
          {s.cadence && <div className="mt-3 text-xs text-white/50 border-t border-white/10 pt-2">{s.cadence}</div>}
        </div>
      </div>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(full);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
        className="w-full py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy full strategy'}
      </button>
    </div>
  );
}

function VideoGrid({ videos }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2.5">
      {videos.slice(0, 12).map((v, i) => (
        <a
          key={v.videoId || i}
          href={`https://www.youtube.com/watch?v=${v.videoId}`}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/30 transition-all"
        >
          <div className="relative aspect-video bg-black">
            {v.thumbnail ? (
              <img src={v.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white/30" />
              </div>
            )}
            <ExternalLink className="absolute top-2 right-2 w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="p-2.5">
            <div className="text-xs font-medium line-clamp-2 leading-snug">{v.title}</div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/40">
              <span className="truncate">{v.channelName}</span>
              {v.views && <span className="shrink-0">· {v.views} views</span>}
              {v.duration && <span className="shrink-0">· {v.duration}</span>}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="px-3 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center gap-2"
      title="Copy the prompt"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}