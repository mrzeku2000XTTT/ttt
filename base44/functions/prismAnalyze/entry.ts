import { creditOperation, publicImageUrls, text } from '../../shared/creditOperation.ts';

/**
 * PRISM — the visual read.
 *
 * The browser has already measured the file (cuts, pacing, motion, palette) and
 * sampled real frames. This turns those stills plus the measurements into a
 * design read: typography, animation, and a rebuildable keyframe recipe.
 *
 * The rule is grounding: the model may only describe what the stills show or the
 * measurements support. Anything else must be reported as not determinable.
 */

const SCHEMA = {
  type: 'object',
  properties: {
    what_it_is: { type: 'string' },
    summary: { type: 'string' },
    typography: {
      type: 'object',
      properties: {
        faces: { type: 'string' },
        weights: { type: 'string' },
        casing: { type: 'string' },
        tracking: { type: 'string' },
        placement: { type: 'string' },
        treatment: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['faces', 'weights', 'casing', 'tracking', 'placement', 'treatment'],
    },
    animation: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          element: { type: 'string' },
          motion: { type: 'string' },
          when: { type: 'string' },
          easing: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['element', 'motion', 'when', 'easing'],
      },
    },
    transitions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { at: { type: 'number' }, type: { type: 'string' }, description: { type: 'string' } },
        required: ['at', 'type', 'description'],
      },
    },
    lighting: { type: 'string' },
    composition: { type: 'string' },
    palette_notes: { type: 'string' },
    recipe: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'number' },
          what: { type: 'string' },
          how: { type: 'string' },
        },
        required: ['t', 'what', 'how'],
      },
    },
    rebuild_notes: { type: 'string' },
    confidence: { type: 'string' },
  },
  required: ['what_it_is', 'summary', 'typography', 'animation', 'recipe', 'confidence'],
};

function buildPrompt(meta, times, count) {
  return `You are PRISM, a forensic video-design analyst. You are given ${count} still frames sampled from ONE video, in chronological order, plus measurements taken from the file's real pixels.

MEASUREMENTS (facts — these were measured, trust them over your impressions):
${meta}

STILL TIMESTAMPS (seconds, same order as the images): ${times.join(', ')}

GROUNDING RULES — do not break these:
- Describe ONLY what is visible in the stills, or what the measurements support. This is a forensic read, not a mood board.
- If you cannot actually tell something (a specific typeface, an unreadable word), write "not determinable" or "unreadable". Never guess a font name, brand, lyric or language you cannot see.
- The stills are samples, not every frame: infer motion from how elements sit relative to each other across the timestamps and from the measured motion series, and say when a timing is inferred.

WHAT TO REPORT:
- what_it_is: one line naming the kind of piece (title card sequence, logo sting, product teaser, social cut, etc.)
- summary: 2-3 sentences on the design intent and how it reads.
- typography: the visual character of the type — serif/sans/mono/geometric/high-contrast, weight, casing, letter-spacing, alignment, size relative to frame, and how it is treated (masked, clipped, on a plate, kinetic, on a path). Note how many distinct type styles there are.
- animation: one entry per moving element. Name the motion, its direction, roughly when it happens in seconds, the easing it appears to use (linear / ease-out / ease-in-out / spring / stepped), and the detail that matters for a rebuild.
- transitions: what happens at each measured cut — hard cut, whip, dissolve, match cut, scale-through — grounded in the timestamps.
- lighting and composition: how the frame is lit and arranged.
- palette_notes: how the measured palette is actually used (dominant background, accent, text colour).
- recipe: THE POINT OF THIS APP. A rebuildable, ordered list of keyframe moments: time in seconds, what happens, and exactly how to construct it in a motion engine (which property, from → to, which curve). Be concrete enough that someone could rebuild the piece from this list alone.
- rebuild_notes: the practical things a person would get wrong trying to copy this.
- confidence: plainly what you are sure of, and what is a guess.

Return JSON only.`;
}

export default async function (req) {
  return creditOperation(req, async (base44, input) => {
    const frames = publicImageUrls(input.frames, 12);
    if (!frames.length) throw new Error('No frames were supplied to read.');

    // Our own measurements, length-capped so nothing unbounded reaches the model.
    const meta = text(JSON.stringify(input.meta ?? {}), 'Measurements', 6000, true) || '{}';
    const times = Array.isArray(input.times)
      ? input.times.slice(0, 12).map((t) => Math.round(Number(t) * 100) / 100).filter((t) => Number.isFinite(t))
      : [];

    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(meta, times, frames.length),
      file_urls: frames,
      model: 'gemini_3_1_pro',
      response_json_schema: SCHEMA,
    });

    return { report, frames_read: frames.length };
  });
}