// The TALKSTICK mouth library.
//
// Every look draws the aperture for the current voice level, so all of them are
// animated by the same engine — pick the shape, the voice drives it.
//
// A style receives a context already translated to the centre of the mouth,
// with the ink colour and stroke width set, and only has to describe the shape:
//
//   w      mouth width in canvas pixels
//   open   aperture height in canvas pixels (smallest when silent)
//   level  0 → 1 voice level
//   weight stroke width in canvas pixels

const INK = "#111";
const TONGUE = "#c25b62";

/** A rounded rectangle path — a small helper so the shapes stay readable. */
function rounded(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export const MOUTH_STYLES = [
  {
    id: "oval",
    label: "Oval",
    hint: "The classic cartoon mouth",
    draw(ctx, { w, open, level }) {
      const rx = Math.max(1, w / 2);
      const ry = Math.max(1.5, open / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      if (level > 0.16) ctx.fill();
      else ctx.stroke();
    },
  },
  {
    id: "smile",
    label: "Smile",
    hint: "A curve that deepens with the voice",
    draw(ctx, { w, open }) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(0, open * 1.5, w / 2, 0);
      ctx.stroke();
    },
  },
  {
    id: "line",
    label: "Line",
    hint: "A flat mouth that never parts",
    draw(ctx, { w }) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();
    },
  },
  {
    id: "openO",
    label: "Open O",
    hint: "A thick ring that widens as it speaks",
    draw(ctx, { w, open, level, weight }) {
      const rx = Math.max(2, (w / 2) * (0.62 + level * 0.38));
      const ry = Math.max(2, open / 2);
      ctx.lineWidth = weight * (1.5 + level * 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  {
    id: "teeth",
    label: "Teeth",
    hint: "A tooth strip along the top lip",
    draw(ctx, { w, open, level }) {
      const rx = w / 2;
      const ry = Math.max(2.5, open / 2);
      rounded(ctx, -rx, -ry, rx * 2, ry * 2, ry * 0.75);
      ctx.fill();
      if (level > 0.22) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        rounded(ctx, -rx, -ry, rx * 2, Math.max(1.6, ry * 0.44), ry * 0.34);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  {
    id: "talk",
    label: "Talk",
    hint: "A rounded mouth with a moving tongue",
    draw(ctx, { w, open, level }) {
      const rx = w / 2;
      const ry = Math.max(2.5, open / 2);
      rounded(ctx, -rx, -ry, rx * 2, ry * 2, ry * 0.8);
      ctx.fill();
      if (level > 0.2) {
        ctx.save();
        ctx.fillStyle = TONGUE;
        ctx.beginPath();
        ctx.ellipse(0, ry * 0.62, rx * 0.44, Math.max(1.2, ry * 0.46), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  {
    id: "wobble",
    label: "Wobble",
    hint: "A hand-drawn edge that keeps shifting",
    draw(ctx, { w, open }) {
      const t = performance.now() / 240;
      const rx = w / 2;
      const ry = Math.max(2.5, open / 2);
      const steps = 44;
      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const a = (i / steps) * Math.PI * 2;
        const wob = 1 + Math.sin(a * 3 + t) * 0.06 + Math.sin(a * 5 - t * 1.4) * 0.035;
        const x = Math.cos(a) * rx * wob;
        const y = Math.sin(a) * ry * wob;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: "zigzag",
    label: "Zigzag",
    hint: "A jagged shout",
    draw(ctx, { w, open }) {
      const rx = w / 2;
      const ry = Math.max(2.5, open / 2);
      const peaks = 6;
      ctx.beginPath();
      ctx.moveTo(-rx, ry * 0.6);
      for (let i = 0; i <= peaks; i += 1) {
        const x = -rx + (w * i) / peaks;
        ctx.lineTo(x, i % 2 ? ry * 0.6 : -ry * 0.6);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: "pucker",
    label: "Pucker",
    hint: "A small round “ooh”",
    draw(ctx, { w, open, level }) {
      const r = Math.max(2, (Math.min(w, open) / 2) * (0.5 + level * 0.5));
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      if (level > 0.15) ctx.fill();
      else ctx.stroke();
    },
  },
];

export const DEFAULT_MOUTH_STYLE = "oval";

const BY_ID = Object.fromEntries(MOUTH_STYLES.map((style) => [style.id, style]));

/** The look for an id, falling back to the default so an old setting never breaks. */
export function mouthStyle(id) {
  return BY_ID[id] || BY_ID[DEFAULT_MOUTH_STYLE];
}

/** Draws one mouth look. The context must already be translated to the mouth centre. */
export function drawMouth(ctx, id, { w, open, level, weight }) {
  const ink = Math.max(2, weight);
  ctx.save();
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = ink;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  mouthStyle(id).draw(ctx, { w, open, level, weight: ink });
  ctx.restore();
}