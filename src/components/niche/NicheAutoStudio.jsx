import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Download, Compass, Film } from 'lucide-react';
import YouTubeDeploy from './YouTubeDeploy';
import { ANIMATION_STYLES, stylePrompt, customStylePrompt, compileExplainerVideo, videoExt } from './explainerVideo';
import NicheStyleLearner from './NicheStyleLearner';
import { factCheckExplainer } from './explainerFactCheck';

const uid = () => Math.random().toString(36).slice(2);

const WorkDots = () => (
  <span className="inline-flex gap-1 ml-1 align-middle">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

// Automatic mode: talk to the auto-pilot, it researches, writes, draws, narrates,
// stitches the stick-man explainer and hands it back ready to deploy.
export default function NicheAutoStudio({ niches }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [learnedStyles, setLearnedStyles] = useState([]);
  const [showLearner, setShowLearner] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const names = (niches || []).map((n) => n.niche_name);
    const intro = names.length
      ? `Your saved niches: ${names.slice(0, 6).join(' · ')}. Tap one below, paste any niche, or just talk to me.`
      : `Paste your niche and I'll take it from there — or just talk to me.`;
    setMessages([
      {
        id: uid(),
        role: 'ai',
        text: `Hey — I'm your NICHE auto-pilot. Give me a topic — I'll ask you to pick the animation style and how many scenes you want, then research live, write the script, draw every scene, narrate, caption and stitch the MP4 — ready to deploy to YouTube.\n\n${intro}`
      }
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    base44.entities.NicheStyle.list().then(setLearnedStyles).catch(() => {});
  }, []);

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const workId = uid();
    const history = [...messages];
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text },
      { id: workId, role: 'ai', working: true, text: 'Thinking' }
    ]);

    const setWork = (t) => setMessages((m) => m.map((x) => (x.id === workId ? { ...x, text: t } : x)));
    const finish = (patch) =>
      setMessages((m) => m.map((x) => (x.id === workId ? { ...x, working: false, ...patch } : x)));

    try {
      const convo = history
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'User' : 'You'}: ${m.text}`)
        .join('\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the NICHE Studio auto-pilot — a creative content director that builds animated explainer videos for creators, inside a chat.

${convo ? `Conversation so far:\n${convo}\n\n` : ''}User's saved niches: ${(niches || []).map((n) => n.niche_name).join(', ') || 'none yet'}.

User's new message: """${text}"""

Animation styles available (style ids): ${ANIMATION_STYLES.map((s) => `${s.id} (${s.name})`).join(', ')}. Default style: neutral.
${learnedStyles.length ? `Styles the user personally taught you from their own videos or images (style ids): ${learnedStyles.map((s) => `${s.id} ("${s.name}")`).join(', ')}. If they ask to use one of these, use its id.` : ''}

Decide what to do:
- If the user wants a video built (asks for an explainer, gives a topic or niche, says "make a video on X") but they have NOT yet picked an animation style and a scene count, return kind "ask". Reply with one short warm message asking BOTH: which animation style they want (list the 5 style names${learnedStyles.length ? ' plus their learned styles: ' + learnedStyles.map((s) => s.name).join(', ') : ''}) and how many scenes they'd like (6 to 15).
- If they HAVE picked (or told you to decide — then use style "neutral" and 8 scenes), return kind "video". Research the topic live for accuracy and fresh, specific angles. Then produce:
  - style: the chosen style id from the list above (default "neutral")
  - scene_count: the number of scenes they chose
  - title: click-worthy, under 60 characters
  - scenes: EXACTLY scene_count scenes. Each scene: "action" = describes ONLY what is seen (typing at a desk, plugging in a cable, celebrating) — never commands, URLs, code or step text in the action, those go only in the voiceover, "caption" = an on-screen caption of at most 8 words matching the scene, "voiceover" = 2–4 spoken sentences, written the way a person talks.
  - The script must actually teach: for how-to topics it includes the real technical steps — which website to open, which buttons or menus to click, which commands to run — in chronological order, using real URLs, commands and requirements you have verified from live research. No vague generalities, no invented details.
  - description: 2 short paragraphs for YouTube; tags: 8–10 SEO tags
  - reply: one warm sentence announcing the video and its topic
- Otherwise return kind "chat" and reply conversationally like a top-shelf niche strategist — sharp, creative, specific to their niche, never generic. Do NOT build a video unless it's clearly wanted.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['chat', 'ask', 'video'] },
            reply: { type: 'string' },
            video: {
              type: 'object',
              properties: {
                style: { type: 'string', enum: [...ANIMATION_STYLES.map((s) => s.id), ...learnedStyles.map((s) => s.id)] },
                scene_count: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                scenes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      caption: { type: 'string' },
                      voiceover: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (res.kind === 'video' && res.video?.scenes?.length) {
        const v = res.video;
        const learned = learnedStyles.find((s) => s.id === v.style);
        const styleId = learned ? v.style : ANIMATION_STYLES.some((s) => s.id === v.style) ? v.style : 'neutral';
        setWork('Fact-checking with live sources');
        const checked = await factCheckExplainer({ topic: v.title, title: v.title, scenes: v.scenes.slice(0, 15) });
        const scenes = checked.scenes.slice(0, 15);
        const n = scenes.length;
        const images = [];
        const audios = [];
        for (let i = 0; i < n; i++) {
          setWork(`Drawing · scene ${i + 1}/${n}`);
          const img = await base44.integrations.Core.GenerateImage({
            prompt: learned
              ? customStylePrompt(learned.description, scenes[i].action)
              : stylePrompt(styleId, scenes[i].action)
          });
          images.push(img.url);
        }
        for (let i = 0; i < n; i++) {
          setWork(`Recording narration · scene ${i + 1}/${n}`);
          const sp = await base44.integrations.Core.GenerateSpeech({ text: scenes[i].voiceover, voice: 'storm' });
          audios.push(sp.url);
        }
        setWork('Stitching your video');
        const blob = await compileExplainerVideo({
          images,
          audios,
          captions: scenes.map((s) => s.caption || String(s.voiceover || '').split(' ').slice(0, 8).join(' ')),
          style: styleId,
          onProgress: setWork
        });
        finish({
          text: `${res.reply || `Your explainer is ready — ${n} scenes, narrated, captioned, stitched.`}${checked.note ? `\n\nFact-checked: ${checked.note}` : ''}`,
          video: {
            url: URL.createObjectURL(blob),
            type: blob.type,
            title: v.title,
            description: v.description,
            tags: v.tags || []
          }
        });
      } else {
        finish({ text: res.reply || "Tell me a topic or paste your niche and I'll build the video." });
      }
    } catch (e) {
      finish({ text: `Something went wrong: ${e?.message || e}. Want me to try again?` });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const download = (m) => {
    const a = document.createElement('a');
    a.href = m.video.url;
    a.download = `${(m.video.title || 'niche-explainer').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${videoExt(m.video.type)}`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col" style={{ height: 'calc(100vh - 190px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
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
                  <WorkDots />
                </span>
              ) : (
                <>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.video && (
                    <div className="mt-3 space-y-3">
                      <video src={m.video.url} controls className="w-full rounded-xl border border-white/10 bg-black" />
                      <button
                        onClick={() => download(m)}
                        className="w-full py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/40 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download MP4
                      </button>
                      <YouTubeDeploy title={m.video.title} description={m.video.description} tags={m.video.tags} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {!busy && niches?.length > 0 && !messages.some((m) => m.role === 'user') && (
          <div className="flex flex-wrap gap-2 pt-1">
            {niches.slice(0, 4).map((n) => (
              <button
                key={n.id}
                onClick={() => send(`Make an explainer video for my niche: ${n.niche_name}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-xs font-medium transition-all"
              >
                <Compass className="w-3.5 h-3.5" /> {n.niche_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input stays pinned — it never scrolls away */}
      <div className="pt-3 pb-1 border-t border-white/10 mt-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowLearner(true)}
            disabled={busy}
            title="Teach me a style from a video or images"
            className="px-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
            aria-label="Teach me a style"
          >
            <Film className="w-4 h-4" />
          </button>
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
            placeholder="Paste your niche or tell me what to build…"
            disabled={busy}
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            className="px-4 rounded-xl bg-white text-black font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-40 transition-all"
            aria-label="Send"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showLearner && (
        <NicheStyleLearner
          onClose={() => setShowLearner(false)}
          onLearned={(s) => {
            setLearnedStyles((prev) => [...prev, s]);
            send(`I just taught you my style "${s.name}" — use it for my videos from now on`);
          }}
        />
      )}
    </div>
  );
}