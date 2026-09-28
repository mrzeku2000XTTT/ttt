// The caption layer: the words for the scene, wrapped into readable lines and
// styled by a library of ready-made templates. Everything is painted onto the
// canvas, so a caption is part of the exported frame exactly as it looks here.
//
// A caption is a *block*, not a line: the words wrap inside a width you can pull
// wider or narrower, and the block can be dragged anywhere on the frame. `x`, `y`,
// `width` and `size` are all shares of the canvas, so a block keeps its place and
// its proportions at any stage size. When any of them is left unset the template's
// own value is used, so a fresh caption still lands where the look intends.

const STACK = 'Inter, "Helvetica Regular", system-ui, sans-serif';
const INK = "#111418";

// The gap between lines, as a multiple of the type size.
const LINE = 1.2;
// The smallest the type may shrink to, and the tallest the block may grow —
// both shares of the canvas. Together they keep a long transcription readable
// instead of squeezing it onto one line.
const MIN_SIZE = 0.026;
const MAX_BLOCK = 0.82;
// How close to an edge the block may sit, so it can never be dragged out of sight.
const EDGE = 0.02;

/**
 * The template library. `size` is a share of the canvas width and `x`, `y` and
 * `width` are shares of it too, so a template keeps its proportions at any stage
 * size. `decor` names the shape drawn around the words, and `fill` says whether
 * the words take the caption's own colour or a fixed dark ink for the
 * light-on-colour looks.
 */
export const CAPTION_TEMPLATES = [
  { id: "subtitle", name: "Subtitle", size: 0.058, weight: 800, upper: false, track: 0, align: "center", x: 0.5, y: 0.88, width: 0.86, fill: "text", decor: "outline" },
  { id: "highlight", name: "Highlight", size: 0.06, weight: 900, upper: true, track: 0.01, align: "center", x: 0.5, y: 0.88, width: 0.84, fill: "ink", decor: "bar" },
  { id: "kinetic", name: "Kinetic", size: 0.105, weight: 900, upper: true, track: -0.02, align: "center", x: 0.5, y: 0.52, width: 0.86, fill: "text", decor: "none" },
  { id: "launch", name: "Launch", size: 0.07, weight: 800, upper: true, track: 0.16, align: "center", x: 0.5, y: 0.5, width: 0.82, fill: "text", decor: "rules" },
  { id: "stamp", name: "Stamp", size: 0.056, weight: 900, upper: true, track: 0.07, align: "center", x: 0.5, y: 0.85, width: 0.84, fill: "ink", decor: "block" },
  { id: "rule", name: "Rule", size: 0.068, weight: 800, upper: true, track: 0.05, align: "center", x: 0.5, y: 0.86, width: 0.84, fill: "text", decor: "underline" },
  { id: "band", name: "Band", size: 0.06, weight: 800, upper: false, track: 0, align: "center", x: 0.5, y: 0.86, width: 0.86, fill: "text", decor: "band" },
  { id: "outline", name: "Outline", size: 0.08, weight: 900, upper: true, track: 0.02, align: "center", x: 0.5, y: 0.5, width: 0.86, fill: "none", decor: "hollow" },
  { id: "neon", name: "Neon", size: 0.082, weight: 900, upper: true, track: 0.02, align: "center", x: 0.5, y: 0.5, width: 0.86, fill: "text", decor: "glow" },
  { id: "third", name: "Lower third", size: 0.056, weight: 800, upper: true, track: 0.03, align: "left", x: 0.5, y: 0.8, width: 0.86, fill: "text", decor: "third" },
  { id: "bracket", name: "Bracket", size: 0.066, weight: 800, upper: true, track: 0.1, align: "center", x: 0.5, y: 0.5, width: 0.84, fill: "text", decor: "bracket" },
  { id: "shadow", name: "Hard shadow", size: 0.086, weight: 900, upper: true, track: 0.01, align: "center", x: 0.5, y: 0.5, width: 0.86, fill: "text", decor: "shadow" },
];

export const findTemplate = (id) => CAPTION_TEMPLATES.find((item) => item.id === id) || CAPTION_TEMPLATES[0];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Leaves the font and tracking set on the context, ready to measure or draw. */
function setFont(ctx, size, weight, track) {
  ctx.font = `${weight} ${size}px ${STACK}`;
  // Tracking is only honoured where the browser supports it; elsewhere the
  // template simply reads a little tighter.
  try {
    ctx.letterSpacing = `${track * size}px`;
  } catch (error) {
    /* not supported — the template still draws */
  }
}

/**
 * Breaks the words into the lines they actually need. Greedy, so each line is as
 * full as it can be without passing the width it was given — which is what makes
 * a long transcription read as a block instead of one shrinking line.
 */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
      return;
    }
    line = next;
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/**
 * Measures the caption block: the type size, the lines it wrapped into, and
 * where the block sits on the canvas — all in canvas pixels.
 *
 * The type starts at the template's size and the words wrap. The block is allowed
 * to grow downwards as the lines stack up, so the type only gives ground when the
 * whole thing would otherwise run off the frame, and never past the point where it
 * stops being readable. Returns null when there is nothing to draw.
 */
export function layoutCaption(ctx, canvas, caption) {
  if (!ctx || !canvas || !canvas.width || !canvas.height) return null;
  const text = String(caption?.text || "").replace(/\s+/g, " ").trim();
  if (!text) return null;

  const tpl = findTemplate(caption.template);
  const sentence = tpl.upper ? text.toUpperCase() : text;
  const boxW = canvas.width * (caption.width ?? tpl.width);
  const centreY = canvas.height * (caption.y ?? tpl.y);
  const cx = canvas.width * (caption.x ?? tpl.x);
  const maxHeight = canvas.height * MAX_BLOCK;
  const floor = canvas.width * MIN_SIZE;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let size = Math.max(floor, canvas.width * (caption.size ?? tpl.size));
  setFont(ctx, size, tpl.weight, tpl.track);
  let lines = wrapLines(ctx, sentence, boxW);

  // A word with no space in it can still be wider than the block, so the width is
  // checked alongside the height on every pass.
  for (let pass = 0; pass < 8 && size > floor; pass += 1) {
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const height = lines.length * size * LINE;
    const overWidth = widest > boxW * 1.01;
    const overHeight = height > maxHeight;
    if (!overWidth && !overHeight) break;
    const ratio = Math.min(overWidth ? boxW / widest : 1, overHeight ? maxHeight / height : 1);
    size = Math.max(floor, size * ratio * 0.995);
    setFont(ctx, size, tpl.weight, tpl.track);
    lines = wrapLines(ctx, sentence, boxW);
  }

  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  ctx.restore();

  const lineHeight = size * LINE;
  const blockHeight = lineHeight * lines.length;
  const top = clamp(
    centreY - blockHeight / 2,
    canvas.height * EDGE,
    Math.max(canvas.height * EDGE, canvas.height * (1 - EDGE) - blockHeight),
  );
  // A centred block balances on its middle; a left-aligned one starts at the
  // block's own left edge, so the panel behind it hugs the words either way.
  const inkLeft = tpl.align === "left" ? cx - boxW / 2 : cx - widest / 2;

  return { tpl, size, lines, lineHeight, blockHeight, cx, top, boxW, inkLeft, widest };
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
  const box = layoutCaption(ctx, canvas, caption);
  if (!box) return;

  const { tpl, size, lines, lineHeight, blockHeight, cx, top, inkLeft, widest } = box;
  const colour = caption.color || "#ffffff";
  const accent = caption.accent || "#ffe14d";
  const inkRight = inkLeft + widest;

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  setFont(ctx, size, tpl.weight, tpl.track);

  const lineY = (index) => top + lineHeight * index + lineHeight / 2;
  const lineX = (line) => (tpl.align === "left" ? inkLeft : cx - ctx.measureText(line).width / 2);

  // ── Shapes that sit behind the words ──
  const paintBack = () => {
    if (tpl.decor === "bar" || tpl.decor === "block") {
      const padX = size * 0.62;
      const padY = size * 0.34;
      const radius = tpl.decor === "bar" ? size * 0.24 : size * 0.06;
      ctx.fillStyle = accent;
      roundRect(ctx, inkLeft - padX, top - padY, widest + padX * 2, blockHeight + padY * 2, radius);
      ctx.fill();
      return;
    }
    if (tpl.decor === "band") {
      const padX = size * 0.5;
      const padY = size * 0.3;
      ctx.fillStyle = "rgba(11, 13, 16, 0.66)";
      roundRect(ctx, inkLeft - padX, top - padY, widest + padX * 2, blockHeight + padY * 2, size * 0.18);
      ctx.fill();
      return;
    }
    if (tpl.decor === "third") {
      const padX = size * 0.55;
      const padY = size * 0.5;
      const left = inkLeft - padX;
      const height = blockHeight + padY * 2;
      const y = top - padY;
      ctx.fillStyle = "rgba(11, 13, 16, 0.72)";
      roundRect(ctx, left, y, widest + padX * 2, height, size * 0.1);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.fillRect(left, y, Math.max(3, size * 0.14), height);
      return;
    }
    if (tpl.decor === "rules") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, size * 0.045);
      const gap = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(inkLeft - gap, top - gap * 0.7);
      ctx.lineTo(inkRight + gap, top - gap * 0.7);
      ctx.moveTo(inkLeft - gap, top + blockHeight + gap * 0.7);
      ctx.lineTo(inkRight + gap, top + blockHeight + gap * 0.7);
      ctx.stroke();
      return;
    }
    if (tpl.decor === "underline") {
      const width = widest + size * 0.8;
      ctx.fillStyle = accent;
      ctx.fillRect(cx - width / 2, top + blockHeight + size * 0.34, width, Math.max(2, size * 0.09));
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
    const gap = size * 0.42;
    ctx.beginPath();
    ctx.moveTo(inkLeft - gap, top - size * 0.3);
    ctx.lineTo(inkLeft - gap, top + blockHeight + size * 0.3);
    ctx.moveTo(inkRight + gap, top - size * 0.3);
    ctx.lineTo(inkRight + gap, top + blockHeight + size * 0.3);
    ctx.stroke();
  };

  paintBack();
  paintWords();
  paintFront();
  ctx.restore();
}