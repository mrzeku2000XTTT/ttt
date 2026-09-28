// TALKSTICK eyes.
//
// A style draws one eye; an animation decides how open it is and where the pupil
// looks on each frame. Both are driven by the same clock and the same voice level,
// so any style can be paired with any animation.

const INK = "#111";

const BLINK_PERIOD = 3.4;
const BLINK_LENGTH = 0.16;

/** 1 while the eye is open, dipping to 0 for a moment every few seconds. */
function blinkAt(t, offset = 0) {
  const p = (t + offset) % BLINK_PERIOD;
  if (p > BLINK_LENGTH) return 1;
  return 1 - Math.sin((p / BLINK_LENGTH) * Math.PI);
}

/**
 * Animation presets. `state` gets the clock in seconds, the voice level and the
 * side (-1 left, 1 right) and returns how open the eye is plus the pupil offset.
 * `preview` is the instant the preset's tile is sampled at, so each tile shows
 * something different from its neighbours.
 */
export const EYE_ANIMS = [
  {
    id: "open",
    label: "Open",
    hint: "Always wide open",
    preview: { t: 0, level: 0.5 },
    state: () => ({ open: 1, dx: 0, dy: 0 }),
  },
  {
    id: "blink",
    label: "Blink",
    hint: "A natural blink every few seconds",
    preview: { t: 0.08, level: 0.5 },
    state: ({ t }) => ({ open: blinkAt(t), dx: 0, dy: 0 }),
  },
  {
    id: "widen",
    label: "Widen",
    hint: "The eyes grow with the voice",
    preview: { t: 0, level: 1 },
    state: ({ level }) => ({ open: 1 + level * 0.35, dx: 0, dy: 0 }),
  },
  {
    id: "look",
    label: "Look",
    hint: "The pupils wander around",
    preview: { t: 1, level: 0.5 },
    state: ({ t }) => ({ open: 1, dx: Math.sin(t * 0.7) * 0.55, dy: Math.sin(t * 0.43) * 0.24 }),
  },
  {
    id: "wink",
    label: "Wink",
    hint: "One eye winks on a loop",
    preview: { t: 2.08, level: 0.5 },
    state: ({ t, side }) => ({ open: side > 0 ? blinkAt(t, 1.4) : 1, dx: 0, dy: 0 }),
  },
  {
    id: "sleepy",
    label: "Sleepy",
    hint: "Droopy lids that lift as it speaks",
    preview: { t: 0, level: 0.15 },
    state: ({ level }) => ({ open: 0.4 + level * 0.36, dx: 0, dy: 0 }),
  },
];

export const EYE_STYLES = [
  {
    id: "dots",
    label: "Dots",
    hint: "Two solid dots",
    draw(ctx, { r, open, dx, dy }) {
      ctx.beginPath();
      ctx.ellipse(dx * r * 0.5, dy * r * 0.5, r, Math.max(0.7, r * open), 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "rings",
    label: "Rings",
    hint: "Open eyes with a wandering pupil",
    draw(ctx, { r, open, dx, dy, stroke }) {
      ctx.lineWidth = stroke;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, Math.max(0.8, r * open), 0, 0, Math.PI * 2);
      ctx.stroke();
      if (open > 0.35) {
        ctx.beginPath();
        ctx.arc(dx * r * 0.42, dy * r * 0.42, Math.max(1.4, r * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "arcs",
    label: "Arcs",
    hint: "Simple curved strokes",
    draw(ctx, { r, open, stroke }) {
      ctx.lineWidth = stroke;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, -Math.max(1, r * open) * 2, r, 0);
      ctx.stroke();
    },
  },
];

const styleById = (id) => EYE_STYLES.find((style) => style.id === id) || EYE_STYLES[0];
const animById = (id) => EYE_ANIMS.find((anim) => anim.id === id) || EYE_ANIMS[0];

/** Draws the pair of eyes, centred on the current origin. */
export function drawEyePair(ctx, styleId, animId, { size, spacing, level, stroke, time }) {
  const style = styleById(styleId);
  const anim = animById(animId);
  const r = Math.max(1.5, size / 2);

  ctx.save();
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  [-1, 1].forEach((side) => {
    const state = anim.state({ t: time, level, side });
    ctx.save();
    ctx.translate((side * spacing) / 2, 0);
    style.draw(ctx, {
      r,
      open: Math.max(0, Math.min(2, state.open)),
      dx: state.dx || 0,
      dy: state.dy || 0,
      stroke,
    });
    ctx.restore();
  });

  ctx.restore();
}