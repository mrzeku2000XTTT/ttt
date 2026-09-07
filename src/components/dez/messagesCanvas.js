import { easeOutBack } from './messagesEngine';

// Canvas painter for the iOS Messages look — one renderer shared by the
// live preview and the MP4 export so they can never drift apart.

export const W = 390;
export const H = 780;

const MARGIN = 14;
const GAP = 5;
const MAX_BW = 246;
const PAD_X = 14;
const PAD_Y = 9;
const LINE_H = 22;
const RADIUS = 18;
const IN_BG = '#E9E9EB';
const IN_TX = '#000000';
const OUT_BG = '#007AFF';
const OUT_TX = '#FFFFFF';
const DOTS_TX = '#8E8E93';
const FONT = '400 17px -apple-system, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const rr = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

const layout = (ctx, text) => {
  const maxW = MAX_BW - PAD_X * 2;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const wd of words) {
    const test = line ? line + ' ' + wd : wd;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = wd;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const w = Math.min(MAX_BW, Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width), 20) + PAD_X * 2));
  const h = lines.length * LINE_H + PAD_Y * 2;
  return { lines, w, h };
};

const countTyped = (it, t) => {
  const idx = (it.charTimes || []).findIndex((ct) => ct > t);
  return idx === -1 ? it.text.length : idx;
};

// What is on screen at time t: bubbles + typing dots with their y positions.
const collect = (ctx, tl, t) => {
  const list = [];
  let y = MARGIN;
  for (const it of tl.items) {
    if (it.side === 'incoming') {
      if (t >= it.show) {
        const g = layout(ctx, it.text);
        list.push({ kind: 'bubble', side: 'incoming', it, g, y, popP: Math.min(1, Math.max(0, (t - it.show) / it.pop)) });
        y += g.h + GAP;
      } else if (t >= it.dotsStart) {
        list.push({ kind: 'dots', y });
        y += 40 + GAP;
      }
    } else {
      const typed = countTyped(it, t);
      if (typed > 0) {
        const full = typed >= it.text.length;
        const sub = full ? it.text : it.text.slice(0, typed);
        const g = layout(ctx, sub);
        list.push({ kind: 'bubble', side: 'outgoing', it, g, sub, typing: !full, y });
        y += g.h + GAP;
      }
    }
  }
  return { list, bottom: y };
};

const drawTail = (ctx, x, y, h, side, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (side === 'incoming') {
    ctx.moveTo(x + 5, y + h - 9);
    ctx.quadraticCurveTo(x - 2, y + h + 7, x - 7, y + h + 8);
    ctx.quadraticCurveTo(x + 4, y + h + 9, x + 14, y + h - 2);
  } else {
    ctx.moveTo(x - 5, y + h - 9);
    ctx.quadraticCurveTo(x + 2, y + h + 7, x + 7, y + h + 8);
    ctx.quadraticCurveTo(x - 4, y + h + 9, x - 14, y + h - 2);
  }
  ctx.closePath();
  ctx.fill();
};

const drawBubble = (ctx, d, t) => {
  const incoming = d.side === 'incoming';
  const x = incoming ? MARGIN : W - MARGIN - d.g.w;
  const bg = incoming ? IN_BG : OUT_BG;
  const tx = incoming ? IN_TX : OUT_TX;
  const h = d.g.h;

  ctx.save();
  if (incoming && d.popP < 1) {
    ctx.globalAlpha = 0.3 + 0.7 * d.popP;
    const s = Math.max(0.2, 0.55 + 0.45 * easeOutBack(d.popP));
    const ax = x + 8, ay = h;
    ctx.translate(ax, d.y + ay);
    ctx.scale(s, s);
    ctx.translate(-ax, -(d.y + ay));
  }
  ctx.fillStyle = bg;
  drawTail(ctx, x, d.y, h, d.side, bg);
  rr(ctx, x, d.y, d.g.w, h, RADIUS);
  ctx.fill();

  ctx.fillStyle = tx;
  ctx.textBaseline = 'top';
  let ty = d.y + PAD_Y - 2;
  const lastIdx = d.g.lines.length - 1;
  d.g.lines.forEach((line, i) => {
    ctx.fillText(line, x + PAD_X, ty);
    if (d.typing && i === lastIdx) {
      const cx = x + PAD_X + ctx.measureText(line).width + 3;
      ctx.fillStyle = OUT_TX;
      rr(ctx, cx, ty + 2, 2.5, 16, 1.25);
      ctx.fill();
    }
    ty += LINE_H;
  });
  ctx.restore();
};

const drawDots = (ctx, y, t) => {
  const x = MARGIN;
  ctx.fillStyle = IN_BG;
  drawTail(ctx, x, y, 40, 'incoming', IN_BG);
  rr(ctx, x, y, 64, 40, 20);
  ctx.fill();
  ctx.fillStyle = DOTS_TX;
  for (let i = 0; i < 3; i++) {
    const phase = Math.max(0, Math.sin(t * 10 - i * 0.6));
    ctx.beginPath();
    ctx.arc(x + 16 + i * 16, y + 20 - phase * 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function drawFrame(ctx, tl, t) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  ctx.font = FONT;
  ctx.textBaseline = 'top';
  if (!tl || !tl.items.length) return;

  // pass 1 — collect; pass 2 — draw with autoscroll applied
  const { list, bottom } = collect(ctx, tl, t);
  const scroll = Math.max(0, bottom - GAP - (H - 16));
  ctx.save();
  ctx.translate(0, -scroll);
  for (const d of list) {
    if (d.kind === 'dots') drawDots(ctx, d.y, t);
    else drawBubble(ctx, d, t);
  }
  ctx.restore();
}