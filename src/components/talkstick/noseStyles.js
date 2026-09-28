// TALKSTICK noses — a small library of static shapes to finish the face.

const INK = "#111";

export const NOSE_STYLES = [
  {
    id: "dash",
    label: "Dash",
    hint: "A short vertical line",
    draw(ctx, { h, stroke }) {
      ctx.lineWidth = stroke;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(0, h / 2);
      ctx.stroke();
    },
  },
  {
    id: "hook",
    label: "Hook",
    hint: "A small hooked nose",
    draw(ctx, { w, h, stroke }) {
      ctx.lineWidth = stroke;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.quadraticCurveTo(w * 0.55, h * 0.1, 0, h / 2);
      ctx.stroke();
    },
  },
  {
    id: "dot",
    label: "Dot",
    hint: "A single dot",
    draw(ctx, { w, h }) {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1.5, w / 2), Math.max(1.5, h / 2), 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "triangle",
    label: "Triangle",
    hint: "A drawn triangle",
    draw(ctx, { w, h }) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, -h / 2);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      ctx.fill();
    },
  },
];

const byId = (id) => NOSE_STYLES.find((style) => style.id === id) || NOSE_STYLES[0];

/** Draws the nose, centred on the current origin. */
export function drawNose(ctx, id, { w, h, stroke }) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  byId(id).draw(ctx, { w, h, stroke: Math.max(2, stroke) });
  ctx.restore();
}