import React, { useEffect, useRef } from 'react';

// GLYPH's mark — the gradient tool's recipe in one small tile: a colour ramp
// with a hue drift, shaped by a wave profile so every column fills with its own
// banded gradient, then scanlined. Idle it is a still; while GLYPH is answering
// in chat it turns and its hue drifts.

const HUES = [186, 202, 222, 248, 268]; // cyan → blue → indigo → violet

function rampAt(t) {
  const u = ((t % 1) + 1) % 1;
  const x = u * (HUES.length - 1);
  const i = Math.min(HUES.length - 2, Math.floor(x));
  const f = x - i;
  return HUES[i] + (HUES[i + 1] - HUES[i]) * f;
}

const css = (h, l, a = 1) => `hsla(${h.toFixed(1)}, 92%, ${l}%, ${a})`;

const PEAKS = 3;
const BANDS = 6;
// The gradient tool's signature animation is its hue rotate: the whole ramp
// walks the spectrum instead of sitting still. Degrees per second.
const HUE_TURN = 62;

function paint(canvas, t) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const hs = t * HUE_TURN;
  const drift = t * 0.16;

  ctx.fillStyle = '#050a11';
  ctx.fillRect(0, 0, W, H);

  // the glow the gradient sits on
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.7, 0, W * 0.5, H * 0.7, H);
  glow.addColorStop(0, css(rampAt(0.3 + drift) + hs, 60, 0.55));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // one column at a time: the wave sets where the gradient starts
  for (let x = 0; x < W; x++) {
    const u = x / Math.max(1, W - 1);
    const wave = (Math.sin((u * PEAKS + drift * 2) * Math.PI * 2) + 1) / 2;
    const top = H * (0.12 + (1 - wave) * 0.46);
    const col = rampAt(u * 0.45 + drift + wave * 0.1) + hs;
    const span = H - top;
    for (let b = 0; b < BANDS; b++) {
      const y0 = top + (span * b) / BANDS;
      const y1 = top + (span * (b + 1)) / BANDS;
      ctx.fillStyle = css(col + 14 - b * 6, 34 + b * 7);
      ctx.fillRect(x, y0, 1, y1 - y0 + 1);
    }
  }

  // the tool's scanline texture
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 1; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

export default function GlyphMark({ size = 40, spinning = false, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.max(16, Math.round(size * dpr));
    if (c.width !== px || c.height !== px) {
      c.width = px;
      c.height = px;
    }
    if (!spinning) {
      paint(c, 0);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      paint(c, (performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [size, spinning]);

  return (
    <span
      className={`glyph-mark ${spinning ? 'glyph-mark-spin' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <canvas ref={ref} />
    </span>
  );
}