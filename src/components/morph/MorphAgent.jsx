import React, { useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SHAPE_NAMES, keysToTracks, makeLayer } from './morphEngine';

const KEY = { type: 'object', properties: { t: { type: 'number' }, v: { type: 'number' } }, required: ['t', 'v'] };
const TRACK = { type: 'array', items: KEY };

const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    duration: { type: 'number' },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', description: 'shape | text' },
          shape: { type: 'string' },
          morphTo: { type: 'string' },
          color: { type: 'string' },
          text: { type: 'string' },
          size: { type: 'number' },
          keys: {
            type: 'object',
            description: 'keyframe lists per property — x, y, scale, rotation, opacity, morph',
            properties: {
              x: TRACK, y: TRACK, scale: TRACK, rotation: TRACK, opacity: TRACK, morph: TRACK,
            },
          },
        },
        required: ['name', 'type', 'keys'],
      },
    },
  },
  required: ['name', 'duration', 'layers'],
};

const EXAMPLES = [
  'A circle grows, morphs into a star and drifts across the frame',
  'Logo reveal: text rises while a hexagon spins and becomes a burst',
];

/**
 * The AI director. It never touches the renderer — it only writes scene JSON
 * (layers + keyframes) which the deterministic engine then plays back.
 */
export default function MorphAgent({ onScene }) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    const idea = prompt.trim();
    if (!idea || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the AI director of a motion-graphics engine. Turn the idea below into a scene the engine can play.

IDEA: ${idea}

The engine animates LAYERS. Every layer is either a "shape" or a "text" and has these animatable properties:
- x: horizontal position, 0 = left edge, 1 = right edge (0.5 = centre)
- y: vertical position, 0 = top, 1 = bottom
- scale: size multiplier, 1 = normal
- rotation: degrees, can exceed 360 for spins
- opacity: 0 to 1
- morph: 0 = the layer's "shape", 1 = the layer's "morphTo" shape. Anything between is a real point-for-point blend, so animate it for a true morph.

Shapes available: ${SHAPE_NAMES.join(', ')}.

Rules:
- Write keyframes as {t, v} pairs in SECONDS from 0 to the scene duration (5–8s). Each property's list must start at or before its first visible moment and be ordered by t.
- Give every layer at least 2 keyframes on the properties that move. Layers that never change look broken.
- x and y should stay between 0.05 and 0.95 so nothing leaves the frame. scale between 0.1 and 2.5.
- For a morph, key "morph" from 0 to 1 across a couple of seconds.
- Text layers: type "text", put the words in "text" (max 4 words), and keep them legible — large size (0.14–0.3), high opacity.
- Use 2–4 layers total. One clear focal element, one supporting element, optionally a title.
- Colours: white #ffffff, or one accent (#ff4d4d red, #3ddc84 green, #4d8dff blue, #facc15 amber).
- Think like a title designer: an entrance, a transformation, a settle. Never a static slide.`,
        response_json_schema: SCHEMA,
      });

      const data = res || {};
      const layers = (Array.isArray(data.layers) ? data.layers : []).slice(0, 6).map((l) => {
        const type = l.type === 'text' ? 'text' : 'shape';
        return makeLayer({
          type,
          name: String(l.name || (type === 'text' ? 'Title' : 'Shape')).slice(0, 40),
          shape: SHAPE_NAMES.includes(l.shape) ? l.shape : 'circle',
          morphTo: SHAPE_NAMES.includes(l.morphTo) ? l.morphTo : 'star',
          color: /^#[0-9a-f]{6}$/i.test(l.color || '') ? l.color : '#ffffff',
          text: String(l.text || '').slice(0, 40),
          size: Math.min(1, Math.max(0.03, Number(l.size) || 0.2)),
          tracks: keysToTracks(l.keys),
        });
      });

      if (!layers.length) throw new Error('The director returned nothing usable — try rephrasing.');
      onScene({
        name: String(data.name || idea).slice(0, 60),
        duration: Math.min(20, Math.max(2, Number(data.duration) || 6)),
        layers,
      });
    } catch (e) {
      setError(e?.message || 'The director could not build that scene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Wand2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
            placeholder={EXAMPLES[0]}
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/12 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-white/40"
          />
        </div>
        <button
          onClick={run}
          disabled={busy || !prompt.trim()}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[11px] font-bold disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? 'Directing…' : 'Direct'}
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}