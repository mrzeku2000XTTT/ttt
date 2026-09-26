import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, Shuffle, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PALETTES, paletteById } from './glyphPalettes';
import { DITHER_ALGOS, STYLES } from './glyphStyles';
import GlyphMark from './GlyphMark';

const STYLE_IDS = STYLES.map((s) => s.id);
const PALETTE_IDS = PALETTES.map((p) => p.id);

const SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'One short sentence describing what you changed.' },
    style: { type: 'string', enum: [...STYLE_IDS, ''] },
    palette: { type: 'string', enum: [...PALETTE_IDS, ''] },
    cellSize: { type: 'number' },
    fontScale: { type: 'number' },
    spacing: { type: 'number' },
    rotation: { type: 'number' },
    brightness: { type: 'number' },
    contrast: { type: 'number' },
    saturation: { type: 'number' },
    jitter: { type: 'number' },
    ditherAlgo: { type: 'string', enum: [...DITHER_ALGOS, ''] },
    charSet: { type: 'string', enum: ['classic', 'blocks', 'minimal', 'tech', 'matrix', 'symbols', ''] },
    dotShape: { type: 'string', enum: ['circle', 'square', 'diamond', ''] },
    halftoneMode: { type: 'string', enum: ['mono', 'rgb', ''] },
    plate: { type: 'string', enum: ['auto', 'light', 'dark', ''] },
  },
  required: ['reply'],
};

const LIMITS = {
  cellSize: [2, 40],
  fontScale: [0.5, 2],
  spacing: [0, 8],
  rotation: [-45, 45],
  brightness: [-70, 70],
  contrast: [0.4, 2.2],
  saturation: [0, 2],
  jitter: [0, 1],
};

const GREETING =
  'Drop an image and I will rebuild it out of characters, tiles, dots or pixels. Tell me how it should look — or press Randomize.';

const QUICK = [
  { label: 'New look', icon: Shuffle, say: 'Give me a new look.' },
  { label: 'Surprise me', icon: Sparkles, say: 'Surprise me.' },
  { label: 'More contrast', icon: Wand2, say: 'More contrast please.' },
  { label: 'Smaller cells', icon: Wand2, say: 'Use smaller cells.' },
];

function buildPrompt(text, params) {
  const current = params
    ? `style=${params.style}, palette=${params.palette}, cellSize=${params.cellSize}, fontScale=${params.fontScale}, spacing=${params.spacing}, rotation=${params.rotation}, brightness=${params.brightness}, contrast=${params.contrast}, saturation=${params.saturation}, jitter=${params.jitter}, plate=${params.plate}, ditherAlgo=${params.ditherAlgo}, charSet=${params.charSet}`
    : 'no image loaded yet';
  return [
    'You are GLYPH, a render assistant inside a local image-transformation studio.',
    'One image is on screen and it is rebuilt by a renderer. You change HOW it is rebuilt — never what the image is.',
    `Renderers: ${STYLE_IDS.join(', ')}.`,
    `Palettes: ${PALETTE_IDS.join(', ')}.`,
    'cellSize 2-40, fontScale 0.5-2, spacing 0-8, rotation -45-45, brightness -70-70, contrast 0.4-2.2, saturation 0-2, jitter 0-1.',
    `Current settings: ${current}.`,
    'Set ONLY the fields that must change. Use "" for every field you want left alone.',
    'Reply with one short sentence, 18 words maximum, no lists and no markdown.',
    `The user says: "${text}"`,
  ].join('\n');
}

export default function GlyphChat({ params, imageReady, onApply, onRandomize, onSurprise }) {
  const [messages, setMessages] = useState([{ role: 'glyph', text: GREETING }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const say = (role, text) => setMessages((m) => [...m, { role, text }]);

  const ask = async (text) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    setInput('');
    say('user', clean);
    setThinking(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(clean, params),
        response_json_schema: SCHEMA,
      });
      const patch = {};
      if (res?.style && STYLE_IDS.includes(res.style)) patch.style = res.style;
      if (res?.palette && PALETTE_IDS.includes(res.palette)) {
        patch.palette = res.palette;
        patch.paletteObj = paletteById(res.palette);
      }
      Object.entries(LIMITS).forEach(([key, [min, max]]) => {
        const v = Number(res?.[key]);
        if (Number.isFinite(v) && v !== 0) patch[key] = Math.min(max, Math.max(min, v));
      });
      if (res?.ditherAlgo && DITHER_ALGOS.includes(res.ditherAlgo)) patch.ditherAlgo = res.ditherAlgo;
      if (res?.charSet) patch.charSet = res.charSet;
      if (res?.dotShape) patch.dotShape = res.dotShape;
      if (res?.halftoneMode) patch.halftoneMode = res.halftoneMode;
      if (res?.plate) patch.plate = res.plate;

      if (Object.keys(patch).length) onApply(patch);
      say('glyph', res?.reply || (Object.keys(patch).length ? 'Done — the render changed.' : 'Tell me which way to take it.'));
    } catch (e) {
      say('glyph', 'I could not reach the model just now — the quick actions below still work.');
    }
    setThinking(false);
  };

  const quick = (item) => {
    if (thinking || !imageReady) return;
    say('user', item.say);
    if (item.label === 'New look') {
      onRandomize();
      say('glyph', 'New renderer, new palette, same image.');
    } else if (item.label === 'Surprise me') {
      onSurprise();
      say('glyph', 'Something unusual, still built from your pixels.');
    } else if (item.label === 'More contrast') {
      onApply({ contrast: Math.min(2.2, (params?.contrast || 1) + 0.3) });
      say('glyph', 'Pushed the contrast up.');
    } else {
      onApply({ cellSize: Math.max(2, Math.round((params?.cellSize || 12) * 0.7)) });
      say('glyph', 'Smaller cells, so more detail survives.');
    }
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 flex max-h-[64vh] flex-col rounded-t-3xl glyph-card p-3 lg:static lg:z-auto lg:max-h-none lg:h-[560px] lg:w-[324px] lg:shrink-0 lg:rounded-2xl">
      <div className="flex items-center gap-2.5 pb-3 mb-1" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <GlyphMark size={30} spinning={thinking} />
        <div className="min-w-0 flex-1">
          <p className="glyph-word text-[11px]">Glyph</p>
          <p className="glyph-muted text-[10px] truncate">
            {thinking ? 'rendering an answer…' : imageReady ? 'ask for a look' : 'waiting for an image'}
          </p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-0.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[86%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                m.role === 'user' ? 'text-[#04202f]' : 'glyph-pill'
              }`}
              style={m.role === 'user' ? { background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' } : undefined}
            >
              {m.text}
            </p>
          </div>
        ))}

        {thinking && (
          <div className="flex items-center gap-2.5">
            <GlyphMark size={22} spinning />
            <span className="glyph-muted text-[11px]">rebuilding…</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pb-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => quick(q)}
            disabled={thinking || !imageReady}
            className="glyph-pill rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-semibold disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder={imageReady ? 'Make it look like newsprint…' : 'Load an image first'}
          disabled={!imageReady}
          className="flex-1 resize-none rounded-xl px-3 py-2 text-[12px] glyph-mono"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--g-line)',
            color: 'var(--g-ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!imageReady || thinking || !input.trim()}
          className="glyph-btn glyph-btn-primary h-9 w-9 p-0 disabled:opacity-40"
          title="Send"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}