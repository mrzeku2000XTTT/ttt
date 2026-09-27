// The film's typography. A caption is never subtitles: each type is a whole
// look — the face, where it sits, how it arrives — so a film reads like a launch
// piece. Every size is derived from the composition, so the same film reads right
// at any resolution, and every animation is a pure function of the frame.
const FACE = "'Space Grotesk', 'Helvetica Regular', system-ui, sans-serif";

export const CAPTION_TYPES = ['kinetic', 'launch', 'stamp', 'rule'];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (p) => 1 - Math.pow(1 - clamp01(p), 3);

// The film's own arc decides the treatment: the hook shouts, the middle beats are
// quiet counterpoints, and the last line lands as a plate.
export function captionTypeFor(beat, index, count = 0) {
  const named = String(beat?.type || '').toLowerCase();
  if (CAPTION_TYPES.includes(named)) return named;
  if (index === 0) return 'kinetic';
  if (count && index === count - 1) return 'launch';
  return index % 2 === 1 ? 'rule' : 'stamp';
}

export function captionSpec(type, width = 1080, height = 1080) {
  const u = Math.min(width, height); // type is measured against the short edge
  switch (type) {
    // The hook: the biggest type on screen, each word climbing out of its own mask.
    case 'kinetic':
      return {
        type, u, face: FACE, size: u * 0.074, weight: 700, tracking: '-0.012em', line: 1.06,
        color: '#ffffff', maxWidth: '86%', anchor: 'center', plate: false,
        shadow: '0 0.05em 0.18em rgba(0,0,0,0.82)',
        scrim: 'radial-gradient(58% 38% at 50% 50%, rgba(0,0,0,0.5), rgba(0,0,0,0) 72%)',
        stagger: 0.07, inDur: 0.34, outDur: 0.3,
      };
    // A short boxed punch, held in the middle of the frame.
    case 'stamp':
      return {
        type, u, face: FACE, size: u * 0.042, weight: 700, tracking: '0.34em', line: 1.25,
        color: '#ffffff', maxWidth: '80%', anchor: 'center', plate: true,
        plateBg: 'rgba(4,7,12,0.42)', plateBorder: '1px solid rgba(255,255,255,0.42)',
        pad: '0.55em 1em', radius: '0.08em', shadow: '0 0.04em 0.14em rgba(0,0,0,0.7)',
        scrim: 'radial-gradient(50% 32% at 50% 50%, rgba(0,0,0,0.42), rgba(0,0,0,0) 74%)',
        stagger: 0, inDur: 0.3, outDur: 0.3,
      };
    // The quiet one: a thin rule draws in, the line follows it.
    case 'rule':
      return {
        type, u, face: FACE, size: u * 0.03, weight: 600, tracking: '0.26em', line: 1.35,
        color: 'rgba(255,255,255,0.94)', maxWidth: '62%', anchor: 'left', plate: false,
        shadow: '0 0.04em 0.14em rgba(0,0,0,0.78)',
        scrim: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 46%)',
        stagger: 0, inDur: 0.42, outDur: 0.3,
      };
    // The payoff: the boxed line that lands, white on a dark plate.
    case 'launch':
    default:
      return {
        type: 'launch', u, face: FACE, size: u * 0.05, weight: 700, tracking: '0.02em', line: 1.25,
        color: '#ffffff', maxWidth: '82%', anchor: 'bottom', plate: true,
        plateBg: 'rgba(5,8,13,0.62)', plateBorder: 'none', pad: '0.45em 0.78em',
        radius: '0.04em', shadow: '0 0.04em 0.14em rgba(0,0,0,0.6)',
        scrim: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0) 44%)',
        stagger: 0, inDur: 0.38, outDur: 0.32,
      };
  }
}

// The state of one caption at a moment. It arrives, it holds, and it clears out
// before the beat ends, so the film never cuts a line off mid-word.
export function captionFrame(spec, text, t, duration = 1) {
  const enter = easeOut(clamp01(t / (spec.inDur || 0.35)));
  const exit = clamp01((duration - t) / (spec.outDur || 0.3));
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return {
    opacity: Math.min(enter, exit),
    enter,
    rise: (1 - enter) * spec.u * 0.02,
    scale: spec.type === 'stamp' ? 1.08 - enter * 0.08 : 1,
    rule: easeOut(clamp01(t / ((spec.inDur || 0.4) * 0.75))),
    words: words.map((w, i) => ({
      text: w,
      progress: easeOut(clamp01((t - i * (spec.stagger || 0.07)) / 0.3)),
    })),
  };
}