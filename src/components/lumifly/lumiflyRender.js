import { FPS, easingFn, textAnimation } from './lumiflyPresets';

export const STAGE_DIMS = { '16:9': { w: 1280, h: 720 }, '9:16': { w: 720, h: 1280 } };

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Numbers from the panels can arrive empty — fall back rather than draw NaN. */
const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function hexToRgb(hex) {
  const h = String(hex || '#ffffff').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = (hex, a) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

const mixHex = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
};

/**
 * The backdrop. Every position is a pure function of time, so the motion loops
 * seamlessly instead of snapping back at the end of a cycle.
 */
export function drawBackground(ctx, w, h, background, time) {
  const colors = background?.colors?.length === 3 ? background.colors : ['#f5dcc5', '#d8a47f', '#5a301f'];
  const motion = background?.motion || 'mesh';
  const t = time * (Number(background?.speed) || 0.6);

  ctx.save();
  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, colors[0]);
  base.addColorStop(0.55, colors[1]);
  base.addColorStop(1, colors[2]);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  if (motion === 'mesh') {
    const spots = [
      { c: colors[0], x: 0.3 + 0.16 * Math.sin(t * 0.42), y: 0.26 + 0.14 * Math.cos(t * 0.31), r: 0.72 },
      { c: colors[1], x: 0.72 + 0.15 * Math.cos(t * 0.36 + 1.1), y: 0.36 + 0.16 * Math.sin(t * 0.27 + 0.6), r: 0.68 },
      { c: colors[2], x: 0.48 + 0.18 * Math.sin(t * 0.29 + 2.2), y: 0.84 + 0.13 * Math.cos(t * 0.34 + 1.6), r: 0.85 },
    ];
    spots.forEach((s) => {
      const g = ctx.createRadialGradient(s.x * w, s.y * h, 0, s.x * w, s.y * h, s.r * Math.max(w, h));
      g.addColorStop(0, rgba(s.c, 0.85));
      g.addColorStop(1, rgba(s.c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  } else if (motion === 'sweep') {
    const drift = Math.sin(t * 0.35) * w * 0.35;
    const g = ctx.createLinearGradient(-w * 0.4 + drift, 0, w * 1.4 + drift, h);
    g.addColorStop(0, rgba(colors[0], 0.95));
    g.addColorStop(0.5, rgba(colors[1], 0.55));
    g.addColorStop(1, rgba(colors[2], 0.95));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** The type's own gradient — rotating, breathing or still. */
function textGradient(ctx, scene, boxW, boxH, time) {
  const colors = scene.textColors?.length === 3 ? scene.textColors : ['#ffffff', '#ffe9d6', '#d8a47f'];
  const mode = scene.gradientAnimation || 'still';
  const r = Math.max(boxW, boxH) * 0.75;
  const angle = mode === 'sweep' ? (time * 0.35) % (Math.PI * 2) : 0;
  const g = ctx.createLinearGradient(
    -Math.cos(angle) * r,
    -Math.sin(angle) * r,
    Math.cos(angle) * r,
    Math.sin(angle) * r
  );
  if (mode === 'pulse') {
    const breathe = (Math.sin(time * 0.9) + 1) / 2;
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.5, mixHex(colors[1], colors[2], breathe * 0.7));
    g.addColorStop(1, colors[2]);
  } else {
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.5, colors[1]);
    g.addColorStop(1, colors[2]);
  }
  return g;
}

/** Wraps the words to the stage width so long phrases stay inside the frame. */
function wrapLines(ctx, text, maxW) {
  const lines = [];
  String(text)
    .split('\n')
    .forEach((raw) => {
      const words = raw.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push([]);
        return;
      }
      let line = [];
      words.forEach((word) => {
        const test = [...line, word];
        if (line.length && ctx.measureText(test.join(' ')).width > maxW) {
          lines.push(line);
          line = [word];
        } else {
          line = test;
        }
      });
      lines.push(line);
    });
  return lines;
}

/** Splits the text into sentences, so each one can fade in and out on its own. */
function splitSentences(text) {
  const sentences = [];
  String(text)
    .split('\n')
    .forEach((line) => {
      const parts = line.match(/[^.!?]+[.!?]*/g) || [];
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) sentences.push(trimmed);
      });
    });
  return sentences;
}

/**
 * FadeUpWords: every word fades and travels in on its own clock, its sentence
 * holds, then fades out before the next sentence begins.
 */
function drawWordSequence(ctx, scene, time, { w, unit, fontPx, ease }) {
  const cfg = scene.words || {};
  const fadeIn = Math.max(0.05, num(cfg.fadeDuration, 50) / FPS);
  const stagger = Math.max(0, num(cfg.stagger, 5) / FPS);
  const hold = Math.max(0, num(cfg.holdDuration, 10) / FPS);
  const fadeOut = Math.max(0, num(cfg.fadeOutDuration, 15) / FPS);
  const gap = Math.max(0, num(cfg.sentenceDelay, 0) / FPS);
  const travel = num(cfg.distance, 200) * unit;
  const blurMax = cfg.blurOn === false ? 0 : Math.max(0, num(cfg.blur, 12)) * unit;
  const canBlur = typeof ctx.filter === 'string';
  const axis = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[cfg.direction] || [0, 1];

  const lineHeight = fontPx * 1.14;
  const spaceW = ctx.measureText(' ').width;
  const blocks = splitSentences(scene.text).map((sentence) => {
    const lines = wrapLines(ctx, sentence, w * 0.9);
    return { lines, height: Math.max(lineHeight, lines.length * lineHeight) };
  });
  if (!blocks.length) return;

  const blockGap = fontPx * 0.4;
  const totalH = blocks.reduce((sum, block) => sum + block.height, 0) + blockGap * (blocks.length - 1);

  let sentenceStart = 0;
  let top = -totalH / 2;

  blocks.forEach((block) => {
    const words = block.lines.flat();
    const wordsEnd = sentenceStart + stagger * Math.max(0, words.length - 1) + fadeIn;
    const outStart = wordsEnd + hold;
    const sentenceAlpha = fadeOut > 0 && time > outStart ? clamp01(1 - (time - outStart) / fadeOut) : 1;
    const drift = cfg.drift ? -6 * unit * Math.max(0, time - wordsEnd) : 0;

    let lineTop = top;
    let index = 0;

    block.lines.forEach((lineWords) => {
      const lineW =
        lineWords.reduce((sum, word) => sum + ctx.measureText(word).width, 0) + spaceW * Math.max(0, lineWords.length - 1);
      let cursor = -lineW / 2;
      const lineY = lineTop + lineHeight / 2;

      lineWords.forEach((word) => {
        const wordW = ctx.measureText(word).width;
        const p = ease(clamp01((time - (sentenceStart + index * stagger)) / fadeIn));
        if (p > 0.001 && sentenceAlpha > 0.001) {
          const away = travel * (1 - p);
          ctx.save();
          ctx.globalAlpha = ctx.globalAlpha * p * sentenceAlpha;
          if (blurMax > 0 && canBlur) ctx.filter = `blur(${(blurMax * (1 - p)).toFixed(2)}px)`;
          ctx.fillText(word, cursor + wordW / 2 + axis[0] * away, lineY + axis[1] * away + drift);
          ctx.restore();
        }
        cursor += wordW + spaceW;
        index += 1;
      });

      lineTop += lineHeight;
    });

    sentenceStart = outStart + fadeOut + gap;
    top += block.height + blockGap;
  });
}

/**
 * One frame of a scene: backdrop, then the type with its animation, slide,
 * gradient and glow. `transition.in` / `.out` are 0 → 1 progress values for the
 * scene's entrance and exit windows; the entrance itself comes from the
 * previous scene's incoming group.
 */
export function drawScene(ctx, w, h, scene, time = 0, transition = {}) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (!scene) {
    ctx.restore();
    return;
  }
  drawBackground(ctx, w, h, scene.background, time);

  const text = String(scene.text || '');
  if (!text.trim()) {
    ctx.restore();
    return;
  }

  const unit = h / 1080;
  const fontPx = Math.max(8, (Number(scene.fontSize) || 300) * unit);
  const family = `"${scene.fontFamily || 'SF Pro Display'}", system-ui, -apple-system, sans-serif`;
  ctx.font = `${Number(scene.weight) || 700} ${fontPx}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const anim = textAnimation(scene.animation);
  const ease = easingFn(scene.easing);
  const enterDur = Math.max(0.15, Number(scene.speed) || 0.7);
  const p = ease(clamp01(time / enterDur));
  const m = anim.wordSequence ? { x: 0, y: 0, scale: 1, opacity: 1 } : anim.build(p, scene);

  const slideEase = ease(clamp01(time / Math.max(0.15, Number(scene.slideSpeed) || 0.9)));
  const slideStart = Number(scene.slideStart) || 0;
  const slideEnd = Number(scene.slideEnd) || 0;
  const slidePx = slideStart + (slideEnd - slideStart) * slideEase;

  let x = m.x * w + slidePx * unit;
  let y = m.y * h;
  let scale = m.scale;
  let opacity = m.opacity;

  // The exit uses this scene's own match cut. The entrance is the previous
  // scene's incoming group, so the two scenes hand over on one shared direction.
  const outDirection = scene.matchCut?.direction === 'right' ? 1 : -1;

  if (transition.out) {
    const o = scene.outgoing || {};
    const dp = easingFn(o.driftCurve)(clamp01(transition.out));
    x += outDirection * num(o.slideDistance, 0.5) * w * 0.45 * dp;
    y -= num(o.driftAmount, 0.15) * h * 0.12 * dp;
    opacity *= 1 - clamp01(transition.out);
  }

  if (transition.in && transition.incoming) {
    const i = transition.incoming;
    const ip = clamp01(transition.in);
    const inDirection = transition.direction === 'right' ? 1 : -1;
    if (transition.match !== false) x += -inDirection * num(i.slideDistance, 0.5) * w * 0.45 * (1 - ip);
    const fromOpacity = num(i.opacityStart, 0);
    const fromScale = num(i.scaleStart, 1);
    opacity *= fromOpacity + (1 - fromOpacity) * ip;
    scale *= fromScale + (1 - fromScale) * ip;
  }

  const lines = wrapLines(ctx, text, w * 0.9);
  const lineHeight = fontPx * 1.14;
  const blockH = Math.max(lineHeight, lines.length * lineHeight);
  const spaceW = ctx.measureText(' ').width;

  const glow = scene.glow || {};
  const glowFade = glow.on ? Math.max(0, 1 - time / Math.max(0.1, Number(glow.dissolve) || 5)) : 0;

  const anchor = scene.textPos || { x: 0.5, y: 0.5 };

  ctx.save();
  ctx.globalAlpha = clamp01(opacity);
  ctx.translate(w * num(anchor.x, 0.5) + x, h * num(anchor.y, 0.5) + y);
  ctx.scale(scale, scale);
  ctx.fillStyle = textGradient(ctx, scene, w * 0.7, blockH, time);
  if (glowFade > 0) {
    ctx.shadowColor = glow.color || '#ffffff';
    ctx.shadowBlur = (Number(glow.intensity) || 0.5) * fontPx * 0.6 * glowFade;
  }

  if (anim.wordSequence) {
    drawWordSequence(ctx, scene, time, { w, unit, fontPx, ease });
  } else {
    let wordIndex = 0;
    lines.forEach((words, li) => {
      const lineY = -blockH / 2 + lineHeight * (li + 0.5);
      const lineW =
        words.reduce((sum, word) => sum + ctx.measureText(word).width, 0) + spaceW * Math.max(0, words.length - 1);
      let cursor = -lineW / 2;
      words.forEach((word) => {
        const wordW = ctx.measureText(word).width;
        if (anim.stagger) {
          const wp = ease(clamp01((time - wordIndex * anim.stagger) / enterDur));
          const wm = anim.build(wp, scene);
          ctx.save();
          ctx.globalAlpha = clamp01(opacity) * clamp01(wm.opacity);
          ctx.fillText(word, cursor + wordW / 2, lineY + wm.y * h);
          ctx.restore();
        } else {
          ctx.fillText(word, cursor + wordW / 2, lineY);
        }
        cursor += wordW + spaceW;
        wordIndex += 1;
      });
    });
  }
  ctx.restore();
  ctx.restore();
}

let measureCtx = null;
function getMeasureCtx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx;
}

/**
 * Where the type sits once the scene has settled — the box the on-canvas gizmo
 * draws, measured with the same font and wrapping the renderer uses.
 */
export function textBounds(scene, w, h) {
  const ctx = getMeasureCtx();
  const unit = h / 1080;
  const fontPx = Math.max(8, (Number(scene.fontSize) || 300) * unit);
  const family = `"${scene.fontFamily || 'SF Pro Display'}", system-ui, -apple-system, sans-serif`;
  ctx.font = `${Number(scene.weight) || 700} ${fontPx}px ${family}`;

  const lineHeight = fontPx * 1.14;
  const spaceW = ctx.measureText(' ').width;
  let lines;
  let blockH;

  if (textAnimation(scene.animation).wordSequence) {
    const blocks = splitSentences(scene.text).map((sentence) => wrapLines(ctx, sentence, w * 0.9));
    const gap = fontPx * 0.4;
    blockH =
      blocks.reduce((sum, block) => sum + Math.max(lineHeight, block.length * lineHeight), 0) +
      gap * Math.max(0, blocks.length - 1);
    lines = blocks.flat();
  } else {
    lines = wrapLines(ctx, String(scene.text || ''), w * 0.9);
    blockH = Math.max(lineHeight, lines.length * lineHeight);
  }

  let blockW = 0;
  lines.forEach((words) => {
    const lineW =
      words.reduce((sum, word) => sum + ctx.measureText(word).width, 0) + spaceW * Math.max(0, words.length - 1);
    if (lineW > blockW) blockW = lineW;
  });

  const anchor = scene.textPos || { x: 0.5, y: 0.5 };
  return {
    x: w * num(anchor.x, 0.5) - blockW / 2,
    y: h * num(anchor.y, 0.5) - blockH / 2,
    w: Math.max(blockW, fontPx * 0.5),
    h: blockH,
    fontPx,
  };
}

/** Renders the current frame off-screen and hands back a PNG data URL. */
export function exportFrame(scene, aspect, time, transition = {}, scale = 1) {
  const dims = STAGE_DIMS[aspect] || STAGE_DIMS['16:9'];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(dims.w * scale);
  canvas.height = Math.round(dims.h * scale);
  drawScene(canvas.getContext('2d'), canvas.width, canvas.height, scene, time, transition);
  return canvas.toDataURL('image/png');
}