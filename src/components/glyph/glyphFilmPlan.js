import { renderStill } from './glyphEngine';
import { PALETTES, paletteById } from './glyphPalettes';
import { STYLES, randomizeParams } from './glyphStyles';
import { MOTION_PRESETS } from './spriteMotionEngine';

// A film is 10 to 15 seconds of the artwork, whatever the chat sends back.
export const FILM_MIN_SECONDS = 10;
export const FILM_MAX_SECONDS = 15;
const BEAT_MAX_SECONDS = 4;
const BEAT_MIN_SECONDS = 1.2;
const STILL_MAX_EDGE = 900;

const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// The chat names a renderer or a palette in words, so a near miss still lands on
// a real one instead of being dropped.
const findStyle = (value) => {
  const key = norm(value);
  if (!key) return null;
  const exact = STYLES.find((s) => s.id === value || norm(s.id) === key || norm(s.name) === key);
  if (exact) return exact.id;
  const loose = STYLES.find((s) => norm(s.id).includes(key) || key.includes(norm(s.id)));
  return loose ? loose.id : null;
};

const findPalette = (value) => {
  const key = norm(value);
  if (!key) return null;
  const exact = PALETTES.find((p) => p.id === value || norm(p.id) === key || norm(p.name) === key);
  if (exact) return exact.id;
  const loose = PALETTES.find((p) => norm(p.id).includes(key) || key.includes(norm(p.id)));
  return loose ? loose.id : null;
};

// The beats arrive as one delimited string — "motion:seconds:renderer:palette:
// CAPTION" joined with "|" — which is far more reliable than a nested schema.
export function parseFilm(title, beats) {
  const list = String(beats || '')
    .split('|')
    .map((chunk) => {
      const parts = String(chunk).split(':');
      return {
        motion: (parts[0] || '').trim().toLowerCase(),
        seconds: Number(parts[1]),
        style: (parts[2] || '').trim(),
        palette: (parts[3] || '').trim(),
        caption: parts.slice(4).join(':').trim().slice(0, 48),
      };
    })
    .filter((b) => b.motion && Number.isFinite(b.seconds));
  if (list.length < 3) return null;
  const name = String(title || '').trim().slice(0, 48);
  return { title: name || 'Motion film', beats: list };
}

// Keep the film real: movements that exist, renderers that exist, and a running
// time that genuinely sits between 10 and 15 seconds.
export function normalizeFilm(plan) {
  const beats = (plan?.beats || []).slice(0, 9).map((b) => ({
    motion: MOTION_PRESETS.some((m) => m.id === b.motion) ? b.motion : 'float',
    seconds: Math.min(BEAT_MAX_SECONDS, Math.max(BEAT_MIN_SECONDS, Number(b.seconds) || 2)),
    style: findStyle(b.style) || '',
    palette: findPalette(b.palette) || '',
    caption: String(b.caption || '').slice(0, 48),
  }));
  if (beats.length < 3) return null;
  const total = beats.reduce((s, b) => s + b.seconds, 0);
  if (total < FILM_MIN_SECONDS || total > FILM_MAX_SECONDS) {
    const target = Math.min(FILM_MAX_SECONDS, Math.max(FILM_MIN_SECONDS, total));
    const k = target / total;
    beats.forEach((b) => {
      b.seconds = Math.min(BEAT_MAX_SECONDS, Math.max(BEAT_MIN_SECONDS, b.seconds * k));
    });
  }
  return { title: String(plan?.title || 'Motion film').slice(0, 48), beats };
}

// One still per beat: the artwork rendered in that beat's look, at a size the
// film plays smoothly. A handful of local renders, so it takes seconds.
export function buildFilmStills(source, params, beats) {
  const scale = Math.min(1, STILL_MAX_EDGE / Math.max(source.width, source.height));
  let width = 0;
  let height = 0;
  const stills = beats.map((beat) => {
    let p = params;
    if (beat.style && beat.style !== params.style) {
      p = randomizeParams(params, { style: beat.style, palette: beat.palette || params.palette });
    } else if (beat.palette && beat.palette !== params.palette) {
      p = { ...params, palette: beat.palette, paletteObj: paletteById(beat.palette) };
    }
    const canvas = renderStill(source, p, scale, null);
    width = canvas.width;
    height = canvas.height;
    return canvas.toDataURL('image/jpeg', 0.92);
  });
  return { stills, width: width || source.width, height: height || source.height };
}