import { gsap } from 'gsap';
import { base44 } from '@/api/base44Client';

// GSAP UI overlay — the agent designs a small animated UI layer (glass cards,
// buttons, progress bars, cursors, badges) that is composited ON TOP of the
// video. The spec is declarative: elements in frame-fraction coordinates plus
// GSAP from/to tweens. At render time real GSAP timelines animate plain proxy
// objects (no DOM), and the canvas draws each element from that state — so the
// exact same spec drives the live preview and the recorded frames, frame for
// frame, with no dependency on DOM timing or layout.

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

const TYPES = ['panel', 'bar', 'pill', 'text', 'cursor', 'ring', 'badge'];

const EASES = [
  'power3.out', 'power2.out', 'power4.out', 'power1.out',
  'expo.out', 'back.out(1.7)', 'back.out(2)', 'circ.out',
  'power2.inOut', 'sine.inOut', 'elastic.out(1, 0.6)', 'none'
];

const clamp = (n, lo, hi, dflt) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt;
};

const hex = (v, dflt) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : dflt);

const rgba = (h, a) => {
  const s = hex(h, '#0b0f14').slice(1);
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Rough spoken length of a line (≈155 wpm) so the agent can time its animation.
export const estimateSeconds = (line) =>
  Math.max(2.5, Math.round((String(line || '').split(/\s+/).filter(Boolean).length / 2.6) * 10) / 10);

const fromOf = (e) => {
  const f = e.from || {};
  return {
    dx: clamp(f.x, -2, 2, 0),
    dy: clamp(f.y, -2, 2, 0.05),
    opacity: clamp(f.opacity, 0, 1, 0),
    scale: clamp(f.scale, 0.1, 4, 1),
    grow: clamp(f.grow, 0, 1, 1)
  };
};

const toOf = (e) => {
  const t = e.to || {};
  return {
    dx: clamp(t.x, -2, 2, 0),
    dy: clamp(t.y, -2, 2, 0),
    opacity: clamp(t.opacity, 0, 1, 1),
    scale: clamp(t.scale, 0.1, 4, 1),
    grow: clamp(t.grow, 0, 1, 1)
  };
};

// Fallback layer so a weak model response still yields something usable.
const DEFAULT_OVERLAY = {
  title: 'Highlight card',
  elements: [
    { type: 'panel', x: 0.06, y: 0.1, w: 0.36, h: 0.16, text: 'Watch this', size: 0.05, at: 0.15, duration: 0.6, ease: 'back.out(1.7)', loop: '', from: {}, to: {} },
    { type: 'bar', x: 0.06, y: 0.3, w: 0.36, h: 0.022, at: 0.45, duration: 1, ease: 'power3.out', loop: '', from: { grow: 0, opacity: 1 }, to: {} }
  ]
};

export function normalizeOverlay(spec, seconds = 5) {
  const els = (Array.isArray(spec?.elements) ? spec.elements : [])
    .filter((e) => e && TYPES.includes(String(e.type || '').toLowerCase()))
    .slice(0, 6)
    .map((e) => {
      const type = String(e.type).toLowerCase();
      return {
        type,
        x: clamp(e.x, -0.4, 1.4, 0.06),
        y: clamp(e.y, -0.4, 1.4, 0.1),
        w: clamp(e.w, 0.02, 1.2, type === 'text' ? 0.4 : 0.3),
        h: clamp(e.h, 0.015, 1.2, type === 'text' ? 0.07 : 0.12),
        text: String(e.text || '').slice(0, 60),
        size: clamp(e.size, 0.02, 0.2, 0.045),
        align: ['left', 'center', 'right'].includes(e.align) ? e.align : 'left',
        fill: hex(e.fill, '#0b0f14'),
        stroke: hex(e.stroke, '#22d3ee'),
        ink: hex(e.ink, '#ffffff'),
        radius: clamp(e.radius, 0, 0.5, 0.02),
        at: clamp(e.at, 0, 40, 0),
        duration: clamp(e.duration, 0.2, 3, 0.6),
        ease: EASES.includes(e.ease) ? e.ease : 'power3.out',
        loop: ['pulse', 'float'].includes(e.loop) ? e.loop : '',
        out_at: Number.isFinite(Number(e.out_at)) ? clamp(e.out_at, 0, 60, seconds) : null,
        from: fromOf(e),
        to: toOf(e)
      };
    });
  const out = els.length ? els : normalizeOverlay(DEFAULT_OVERLAY, seconds).elements;
  return { title: String(spec?.title || 'UI overlay').slice(0, 60), elements: out };
}

// Builds the paused GSAP timeline once and exposes seek + draw, so the caller
// can render any instant deterministically (preview loop or recorded frame).
export function createOverlayPlayer(spec) {
  const els = (spec?.elements || []).map((e) => ({
    ...e,
    dx: e.from.dx,
    dy: e.from.dy,
    opacity: e.from.opacity,
    scale: e.from.scale,
    grow: e.from.grow,
    pulse: 0,
    bob: 0
  }));

  const tl = gsap.timeline({ paused: true });
  els.forEach((el) => {
    tl.fromTo(
      el,
      { dx: el.from.dx, dy: el.from.dy, opacity: el.from.opacity, scale: el.from.scale, grow: el.from.grow },
      {
        dx: el.to.dx,
        dy: el.to.dy,
        opacity: el.to.opacity,
        scale: el.to.scale,
        grow: el.to.grow,
        duration: el.duration,
        ease: el.ease,
        immediateRender: true
      },
      el.at
    );
    if (el.loop === 'pulse') tl.to(el, { pulse: 1, duration: 0.75, repeat: -1, yoyo: true, ease: 'sine.inOut' }, el.at + el.duration);
    if (el.loop === 'float') tl.to(el, { bob: 1, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }, el.at);
    if (el.out_at != null) tl.to(el, { opacity: 0, duration: 0.5, ease: 'power2.in' }, el.out_at);
  });

  return {
    duration: tl.duration(),
    seek: (t) => tl.time(Math.max(0, Number.isFinite(t) ? t : 0), false),
    draw: (ctx, W, H, alpha = 1) => drawElements(ctx, els, W, H, alpha)
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawElements(ctx, els, W, H, alpha) {
  els.forEach((el) => {
    if (el.opacity <= 0.002) return;
    const wobble = el.loop === 'float' ? (el.bob - 0.5) * 0.03 : 0;
    const beat = el.loop === 'pulse' ? 1 + 0.04 * el.pulse : 1;

    const restW = el.w * W;
    const restH = el.h * H;
    const left0 = (el.x + el.dx) * W;
    const top0 = (el.y + el.dy + wobble) * H;
    const centerX = left0 + restW / 2;
    const centerY = top0 + restH / 2;

    const bw = restW * el.scale * beat * (el.type === 'bar' ? el.grow : 1);
    const bh = restH * el.scale * beat;
    // bars grow from their left edge (progress); everything else scales from its center
    const left = el.type === 'bar' ? left0 : centerX - bw / 2;
    const top = centerY - bh / 2;
    const r = el.radius * Math.min(W, H);
    const weight = el.type === 'text' ? '700' : '600';
    const fontPx = Math.max(8, Math.round(el.size * H));

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity * alpha));

    switch (el.type) {
      case 'panel':
      case 'pill':
      case 'badge': {
        roundRectPath(ctx, left, top, bw, bh, r);
        ctx.fillStyle = rgba(el.fill, el.type === 'panel' ? 0.72 : 0.92);
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = H * 0.03;
        ctx.shadowOffsetY = H * 0.01;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = Math.max(1, H * 0.0022);
        ctx.strokeStyle = rgba(el.stroke, 0.5);
        ctx.stroke();
        if (el.text) {
          ctx.fillStyle = el.ink;
          ctx.font = `${weight} ${fontPx}px ${FONT}`;
          ctx.textBaseline = 'middle';
          if (el.type === 'panel') {
            ctx.textAlign = el.align;
            const tx = el.align === 'center' ? left + bw / 2 : el.align === 'right' ? left + bw - r * 1.4 : left + r * 1.4;
            ctx.fillText(el.text, tx, top + bh / 2, bw * 0.88);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(el.text, left + bw / 2, top + bh / 2, bw * 0.88);
          }
        }
        break;
      }
      case 'bar': {
        roundRectPath(ctx, left, top, Math.max(1, bw), bh, Math.min(r, bh / 2));
        ctx.fillStyle = rgba(el.stroke, 0.9);
        ctx.fill();
        break;
      }
      case 'text': {
        ctx.fillStyle = el.ink;
        ctx.font = `${weight} ${fontPx}px ${FONT}`;
        ctx.textAlign = el.align;
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = H * 0.025;
        const tx = el.align === 'center' ? left + bw / 2 : el.align === 'right' ? left + bw : left;
        ctx.fillText(el.text, tx, top + bh / 2, bw);
        break;
      }
      case 'ring': {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(1, bw / 2), Math.max(1, bh / 2), 0, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(el.stroke, 0.85);
        ctx.lineWidth = Math.max(2, H * 0.006);
        ctx.stroke();
        if (el.text) {
          ctx.fillStyle = el.ink;
          ctx.font = `${weight} ${fontPx}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, centerX, centerY, bw * 0.8);
        }
        break;
      }
      case 'cursor': {
        ctx.translate(left, top);
        const s = Math.max(restW, restH) * el.scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, s * 0.92);
        ctx.lineTo(s * 0.26, s * 0.68);
        ctx.lineTo(s * 0.46, s);
        ctx.lineTo(s * 0.64, s * 0.9);
        ctx.lineTo(s * 0.44, s * 0.6);
        ctx.lineTo(s * 0.78, s * 0.56);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = H * 0.012;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }
      default:
        break;
    }

    ctx.restore();
  });
}

// Ask the agent to design the overlay for one scene/sentence.
export async function generateOverlaySpec({ action, line, brand }) {
  const seconds = estimateSeconds(line);
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a motion designer adding a GSAP-animated UI overlay that sits ON TOP of a video frame.

Video scene (what the viewer sees): "${action}"
Narration line being spoken: "${line}"
${brand ? `Creator's niche / brand: ${brand}` : ''}

Design a small, premium overlay of 2–4 UI elements that animate in over the frame while this line is spoken — a glassy stat card sliding in, a button that presses, a progress bar that fills, a labelled pill, a check badge, a cursor tap. Use real, short UI copy (2–5 words) that supports the line. Never re-type the narration as a subtitle.

Coordinate space: x, y, w, h are fractions of the frame (0–1, origin top-left). Keep every element fully inside x 0.04–0.96 and y 0.06–0.74 — the bottom band is reserved for captions. Leave at least 0.03 of clear space between elements so nothing overlaps.

Timings: "at" is when the element animates in, in seconds from the start of the line; "duration" is 0.3–1.2s. The whole overlay must be on screen within ${seconds}s. Use expressive GSAP eases (expo.out, back.out(1.7), power3.out). Use loop "pulse" or "float" on at most one element. Set "out_at" only if an element should leave before the line ends.

Element types: panel (glass card, may hold text), pill/badge (rounded chip with centered text), text (headline text, no box), bar (a bar that grows — set from.grow to 0 and to.grow to 1), cursor (a mouse pointer — include one when the line involves a click or tap), ring (outlined circle, e.g. a highlight or loading ring).

Colors: fill = dark glass (#0b0f14), stroke = ONE accent (#22d3ee cyan, #a3e635 lime, #f472b6 pink or #facc15 amber), ink = text color (#ffffff, or #0b0f14 on light fills). Keep it minimal and premium — no clutter, no emoji.`,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Two or three word name for this overlay idea' },
        elements: {
          type: 'array',
          description: 'The animated UI elements, 2–4 of them',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'panel | bar | pill | text | cursor | ring | badge' },
              x: { type: 'number', description: 'left edge, fraction of frame width' },
              y: { type: 'number', description: 'top edge, fraction of frame height' },
              w: { type: 'number', description: 'width, fraction of frame width' },
              h: { type: 'number', description: 'height, fraction of frame height' },
              text: { type: 'string', description: 'Short UI copy, or empty' },
              size: { type: 'number', description: 'font size as a fraction of frame height' },
              align: { type: 'string', description: 'left | center | right' },
              fill: { type: 'string', description: 'hex panel/background color' },
              stroke: { type: 'string', description: 'hex accent color' },
              ink: { type: 'string', description: 'hex text color' },
              radius: { type: 'number', description: 'corner radius, fraction of frame height' },
              at: { type: 'number', description: 'seconds into the line when it animates in' },
              duration: { type: 'number', description: 'animation length in seconds' },
              ease: { type: 'string', description: 'GSAP ease name' },
              loop: { type: 'string', description: 'pulse | float | empty' },
              out_at: { type: 'number', description: 'seconds when it leaves, or omit to stay' },
              from: {
                type: 'object',
                description: 'starting values — x/y are offsets from the resting position',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  opacity: { type: 'number' },
                  scale: { type: 'number' },
                  grow: { type: 'number' }
                }
              },
              to: {
                type: 'object',
                description: 'ending values, usually all at rest',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  opacity: { type: 'number' },
                  scale: { type: 'number' },
                  grow: { type: 'number' }
                }
              }
            },
            required: ['type', 'x', 'y', 'w', 'h', 'at']
          }
        }
      }
    }
  });

  return normalizeOverlay(res, seconds);
}