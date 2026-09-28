// The caption layer: one line of text drawn over the whole scene, styled by a
// library of ready-made templates. Everything is painted onto the canvas, so a
// caption is part of the exported frame exactly as it looks on the stage.

const STACK = 'Inter, "Helvetica Regular", system-ui, sans-serif';
const INK = "#111418";

/**
 * The template library. `size` is a share of the canvas width and `y` a share of
 * its height, so a template keeps its proportions at any stage size. `decor`
 * names the shape drawn around the words, and `fill` says whether the words take
 * the caption's own colour or a fixed dark ink for the light-on-colour looks.
 */
export const CAPTION_TEMPLATES = [
  { id: "subtitle", name: "Subtitle", size: 0.058, weight: 800, upper: false, track: 0, align: "center", y: 0.88, fill: "text", decor: "outline" },
  { id: "highlight", name: "Highlight", size: 0.06, weight: 900, upper: true, track: 0.01, align: "center", y: 0.88, fill: "ink", decor: "bar" },
  { id: "kinetic", name: "Kinetic", size: 0.105, weight: 900, upper: true, track: -0.02, align: "center", y: 0.52, fill: "text", decor: "none" },
  { id: "launch", name: "Launch", size: 0.07, weight: 800, upper: true, track: 0.16, align: "center", y: 0.5, fill: "text", decor: "rules" },
  { id: "stamp", name: "Stamp", size: 0.056, weight: 900, upper: true, track: 0.07, align: "center", y: 0.85, fill: "ink", decor: "block" },
  { id: "rule", name: "Rule", size: 0.068, weight: 800, upper: true, track: 0.05, align: "center", y: 0.86, fill: "text", decor: "underline" },
  { id: "band", name: "Band", size: 0.06, weight: 800, upper: false, track: 0, align: "center", y: 0.86, fill: "text", decor: "band" },
  { id: "outline", name: "Outline", size: 0.08, weight: 900, upper: true, track: 0.02, align: "center", y: 0.5, fill: "none", decor: "hollow" },
  { id: "neon", name: "Neon", size: 0.082, weight: 900, upper: true, track: 0.02, align: "center", y: 0.5, fill: "text", decor: "glow" },
  { id: "third", name: "Lower third", size: 0.056, weight: 800, upper: true, track: 0.03, align: "left", y: 0.8, fill: "text", decor: "third" },
  { id: "bracket", name: "Bracket", size: 0.066, weight: 800, upper: true, track: 0.1, align: "center", y: 0.5, fill: "text", decor: "bracket" },
  { id: "shadow", name: "Hard shadow", size: 0.086, weight: 900, upper: true, track: 0.01, align: "center", y: 0.5, fill: "text", decor: "shadow" },
];

export const findTemplate = (id) => CAPTION_TEMPLATES.find((item) => item.id === id) || CAPTION_TEMPLATES[0];

/** The words broken into lines that fit the given width. */
function wrap(ctx, words, maxWidth) {
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draws the caption over the frame. The layout is measured from the canvas, so a
 * template reads the same on a small preview tile as it does on the full stage.
 */
export function drawCaption(ctx, canvas, caption) {
  const text = String(caption?.text || "").replace(/\s+/g, " ").trim();
  if (!text) return;

  const tpl = findTemplate(caption.template);
  const colour = caption.color || "#ffffff";
  const accent = caption.accent || "#ffe14d";
  const size = Math.max(8, canvas.width * tpl.size);
  const words = tpl.upper ? text.toUpperCase().split(" ") : text.split(" ");

  ctx.save();
  ctx.font = `${tpl.weight} ${size}px ${STACK}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // Tracking is only honoured where the browser supports it; elsewhere the
  // template simply reads a little tighter.
  try {
    ctx.letterSpacing = `${tpl.track * size}px`;
  } catch (error) {
    /* not supported — the template still draws */
  }

  const maxWidth = canvas.width * (tpl.align === "left" ? 0.72 : 0.88);
  const lines = wrap(ctx, words, maxWidth);
  const lineHeight = size * 1.2;
  const blockHeight = lineHeight * lines.length;
  const centreX = tpl.align === "left" ? canvas.width * 0.07 : canvas.width / 2;
  const top = canvas.height * tpl.y - blockHeight / 2;
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));

  const lineY = (index) => top + lineHeight * index + lineHeight / 2;
  const lineX = (line) => (tpl.align === "left" ? centreX : centreX - ctx.measureText(line).width / 2);

  // ── Shapes that sit behind the words ──
  const paintBack = () => {
    if (tpl.decor === "bar" || tpl.decor === "block") {
      const padX = size * 0.62;
      const padY = size * 0.34;
      const radius = tpl.decor === "bar" ? size * 0.24 : size * 0.06;
      ctx.fillStyle = accent;
      roundRect(ctx, centreX - widest / 2 - padX, top - padY, widest + padX * 2, blockHeight + padY * 2, radius);
      ctx.fill();
      return;
    }
    if (tpl.decor === "band") {
      ctx.fillStyle = "rgba(11, 13, 16, 0.66)";
      ctx.fillRect(0, top - size * 0.5, canvas.width, blockHeight + size);
      return;
    }
    if (tpl.decor === "third") {
      const height = blockHeight + size * 1.5;
      const y = top - size * 0.75;
      ctx.fillStyle = "rgba(11, 13, 16, 0.72)";
      ctx.fillRect(0, y, canvas.width, height);
      ctx.fillStyle = accent;
      ctx.fillRect(0, y, Math.max(3, canvas.width * 0.012), height);
      return;
    }
    if (tpl.decor === "rules") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, size * 0.045);
      const gap = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(centreX - widest / 2 - gap, top - gap * 0.7);
      ctx.lineTo(centreX + widest / 2 + gap, top - gap * 0.7);
      ctx.moveTo(centreX - widest / 2 - gap, top + blockHeight + gap * 0.7);
      ctx.lineTo(centreX + widest / 2 + gap, top + blockHeight + gap * 0.7);
      ctx.stroke();
      return;
    }
    if (tpl.decor === "underline") {
      const width = widest + size * 0.8;
      ctx.fillStyle = accent;
      ctx.fillRect(centreX - width / 2, top + blockHeight + size * 0.34, width, Math.max(2, size * 0.09));
    }
  };

  // ── The words themselves ──
  const paintWords = () => {
    lines.forEach((line, index) => {
      const x = lineX(line);
      const y = lineY(index);

      if (tpl.decor === "hollow") {
        ctx.lineWidth = Math.max(2, size * 0.075);
        ctx.lineJoin = "round";
        ctx.strokeStyle = colour;
        ctx.strokeText(line, x, y);
        return;
      }
      if (tpl.decor === "shadow") {
        ctx.fillStyle = "rgba(8, 10, 13, 0.55)";
        ctx.fillText(line, x + size * 0.055, y + size * 0.055);
      }
      if (tpl.decor === "glow") {
        ctx.shadowColor = accent;
        ctx.shadowBlur = size * 0.75;
      }
      if (tpl.decor === "outline") {
        ctx.lineWidth = Math.max(2, size * 0.11);
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(8, 10, 13, 0.88)";
        ctx.strokeText(line, x, y);
      }
      ctx.fillStyle = tpl.fill === "ink" ? INK : colour;
      ctx.fillText(line, x, y);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    });
  };

  // ── Marks drawn after the words ──
  const paintFront = () => {
    if (tpl.decor !== "bracket") return;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1.5, size * 0.06);
    const half = widest / 2 + size * 0.42;
    ctx.beginPath();
    ctx.moveTo(centreX - half, top - size * 0.3);
    ctx.lineTo(centreX - half, top + blockHeight + size * 0.3);
    ctx.moveTo(centreX + half, top - size * 0.3);
    ctx.lineTo(centreX + half, top + blockHeight + size * 0.3);
    ctx.stroke();
  };

  paintBack();
  paintWords();
  paintFront();
  ctx.restore();
}