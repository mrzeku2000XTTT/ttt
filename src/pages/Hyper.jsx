import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Download, Film, Wand2, Sparkles, Copy, Check } from 'lucide-react';

const uid = () => Math.random().toString(36).slice(2);

// Starter prompts — each is a self-contained motion-graphics brief, black + cinematic
const PRESETS = [
  'Kinetic typography: the word "LAUNCH" slams into frame with a screen shake, charcoal background, fine film grain',
  'Logo reveal: a matte black sphere cracks open releasing white light particles, macro lens, studio rim light',
  'Lower third: a clean white line draws across a black screen, text fades in, broadcast lower-third style',
  'Abstract motion: liquid mercury droplets fall in slow motion on black, realistic reflections, soft key light',
];

export default function Hyper() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [vertical, setVertical] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        id: uid(),
        role: 'ai',
        text: "HYPER online. Describe the motion graphic you need — I'll direct it and render a real MP4. Black, cinematic, ready to drop in."
      }
    ]);
  }, []);

  useEffect(() => {
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
      { id: workId, role: 'ai', working: true, text: 'Directing the shot', startedAt: Date.now() }
    ]);
    const setWork = (t) => setMessages((m) => m.map((x) => (x.id === workId ? { ...x, text: t } : x)));
    const finish = (patch) =>
      setMessages((m) => m.map((x) => (x.id === workId ? { ...x, working: false, ...patch } : x)));

    try {
      // 1. HYPER turns the request into one tight motion-graphics Veo prompt
      const ar = vertical ? '9:16' : '16:9';
      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: `You are HYPER, a motion-graphics director. Turn the user's request into ONE vivid, self-contained motion-graphics video prompt for a cinematic AI video model (Google Veo).
Aesthetic rules: black / dark background, realistic, cinematic, film grain, studio lighting. No on-screen text unless the user explicitly asked for typography. Describe ONLY what is SEEN — motion, camera, lighting, materials, color. 1–3 sentences. No preamble, no commentary.
User request: """${text}"""
Return JSON with: reply (one warm sentence confirming), videoPrompt (the prompt), duration (4, 6, or 8).`,
        response_json_schema: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            videoPrompt: { type: 'string' },
            duration: { type: 'number' }
          }
        }
      });
      setWork('Rendering motion');
      // 2. Generate the real MP4
      const vid = await base44.integrations.Core.GenerateVideo({
        prompt: plan.videoPrompt,
        duration: plan.duration === 4 || plan.duration === 8 ? plan.duration : 6,
        aspect_ratio: ar,
        generate_audio: false
      });
      finish({
        text: plan.reply || 'Done — your motion graphic is ready.',
        video: { url: vid.url, prompt: plan.videoPrompt }
      });
    } catch (e) {
      finish({ text: `Render failed: ${e?.message || e}. Want me to try again?` });
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.25)]">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">HYPER</h1>
              <p className="text-[11px] text-white/40 leading-none mt-0.5">Motion graphics, on demand</p>
            </div>
          </div>
          <button
            onClick={() => setVertical((v) => !v)}
            disabled={busy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${
              vertical ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-white/50 hover:text-white hover:border-white/40'
            }`}
            title="Toggle aspect ratio"
          >
            <Film className="w-3.5 h-3.5" />
            {vertical ? '9:16' : '16:9'}
          </button>
        </div>
      </header>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white text-black rounded-br-sm'
                    : 'bg-white/[0.04] border border-white/10 text-white rounded-bl-sm'
                }`}
              >
                {m.working ? (
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin opacity-70" /> {m.text}
                    <span className="inline-flex gap-1 ml-1 align-middle">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </span>
                ) : (
                  <>
                    <p className="whitespace-pre-line">{m.text}</p>
                    {m.video && (
                      <div className="mt-3 space-y-2">
                        <video
                          src={m.video.url}
                          controls
                          autoPlay
                          muted
                          loop
                          className={`w-full rounded-xl border border-white/10 bg-black ${vertical ? 'max-h-[70vh] mx-auto' : ''}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => download(m)}
                            className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download MP4
                          </button>
                          <CopyPromptButton prompt={m.video.prompt} />
                        </div>
                        <p className="text-[11px] text-white/30 border-l-2 border-white/10 pl-2 italic">{m.video.prompt}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setInput(p); inputRef.current?.focus(); }}
                disabled={busy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-xs font-medium transition-all disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3" /> {p.split(':')[0]}
              </button>
            ))}
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
              placeholder="Describe a motion graphic — e.g. 'black ink drops blooming into a logo reveal'…"
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

const CopyPromptButton = ({ prompt }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(prompt);
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
};