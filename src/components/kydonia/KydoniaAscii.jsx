import React, { useEffect, useRef } from "react";

// KYDONIA's ASCII Mars globe — procedural, drawn in characters, nothing loaded.
// A shaded sphere is sampled cell by cell onto a density ramp; a rust survey
// sweep travels across the disc and brightens the characters it passes.

const RAMP = " .:-=+*#%@";
const CELL_ASPECT = 0.6; // monospace glyph width / height

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function terrain(lon, lat) {
  let sum = 0;
  let amp = 1;
  let freq = 1.7;
  let total = 0;
  for (let octave = 0; octave < 4; octave += 1) {
    sum += amp * noise(Math.cos(lon) * freq + 7, Math.sin(lat) * freq + 11);
    total += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / total;
}

export default function KydoniaAscii({ rows = 44, cols = 74, label, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let raf = 0;
    let size = { w: 0, h: 0, cellW: 8, cellH: 13 };
    let lastDrawn = -1;

    const measure = () => {
      const parent = canvas.parentElement;
      const w = Math.max(160, parent?.clientWidth || 0);
      const cellW = w / cols;
      const cellH = cellW / CELL_ASPECT;
      const h = rows * cellH;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { w, h, cellW, cellH };
    };

    const draw = (time) => {
      const { w, h, cellW, cellH } = size;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${Math.round(cellH * 1.05)}px "Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cx = cols / 2;
      const cy = rows / 2;
      const radius = Math.min(cols / 2, (rows / 2) * (1 / CELL_ASPECT)) * 0.94;
      const sweep = ((time * 0.018) % (cols + 30)) - 15;
      const spin = time * 0.00011;

      let currentColor = "";

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = (x + 0.5 - cx) / radius;
          const ny = (y + 0.5 - cy) / radius;
          const r2 = nx * nx + ny * ny;
          if (r2 > 1) continue;

          const nz = Math.sqrt(1 - r2);
          const sx = nx * Math.cos(spin) - nz * Math.sin(spin);
          const sz = nx * Math.sin(spin) + nz * Math.cos(spin);
          const lon = Math.atan2(sx, sz);
          const lat = Math.asin(Math.max(-1, Math.min(1, ny)));

          const albedo = 0.32 + 0.68 * terrain(lon * 1.6, lat * 1.6);
          const sun = Math.max(0, nx * 0.5 + ny * -0.34 + nz * 0.8);
          const lum = Math.min(1, albedo * (0.16 + 0.95 * sun));
          const char = RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.round(lum * (RAMP.length - 1))))];
          if (char === " ") continue;

          const inSweep = Math.abs(x - sweep) < 2.6;
          const color = inSweep
            ? "#ffd9c4"
            : lum > 0.56
              ? "#e8dcc8"
              : lum > 0.3
                ? "#b07a5c"
                : "#5f4436";

          if (color !== currentColor) {
            ctx.fillStyle = color;
            currentColor = color;
          }
          ctx.fillText(char, x * cellW + cellW / 2, y * cellH + cellH / 2);
        }
      }
    };

    const loop = (time) => {
      if (time - lastDrawn > 42) {
        draw(time);
        lastDrawn = time;
      }
      raf = requestAnimationFrame(loop);
    };

    measure();
    if (reduced) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const observer = new ResizeObserver(() => {
      measure();
      if (reduced) draw(0);
    });
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [rows, cols]);

  return (
    <div className={`kyd-ascii ${className}`}>
      <canvas ref={canvasRef} role="img" aria-label={label || "Mars rendered as a grid of ASCII characters"} />
    </div>
  );
}