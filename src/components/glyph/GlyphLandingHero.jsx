import React, { useEffect, useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { randomizeParams } from './glyphStyles';
import { renderTo } from './glyphEngine';

// The hero preview is the real renderer: a small procedural source is built on
// a canvas and then pushed through the actual Characters renderer.
function usePreview(canvasRef) {
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = 340;
    const h = 208;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#070b12';
    g.fillRect(0, 0, w, h);
    const grd = g.createRadialGradient(w * 0.66, h * 0.38, 6, w * 0.66, h * 0.38, h * 1.05);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.42, '#6BCAFF');
    grd.addColorStop(1, '#070b12');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath();
    g.ellipse(w * 0.28, h * 0.63, 52, 24, -0.28, 0, Math.PI * 2);
    g.ellipse(w * 0.36, h * 0.6, 34, 20, -0.2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(74,144,226,0.75)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(w * 0.72, h * 0.72, 40, Math.PI * 1.1, Math.PI * 1.85);
    g.stroke();
    const source = { width: w, height: h, imageData: g.getImageData(0, 0, w, h) };
    const base = randomizeParams(null, { style: 'characters', palette: 'cyan', seed: 482913 });
    renderTo(c, source, {
      ...base,
      cellSize: 6,
      fontScale: 1.05,
      plate: 'dark',
      effects: { ...base.effects, bloom: 0.55, scanlines: 0.22, glow: 0.3, grain: 0, vignette: 0.3 },
    }, 0);
  }, [canvasRef]);
}

export default function GlyphLandingHero({ hasWallet, onSeed, onEnter }) {
  const canvasRef = useRef(null);
  usePreview(canvasRef);

  const drop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) onSeed(file);
  };

  return (
    <section className="max-w-[1500px] mx-auto px-4 pt-10 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <div>
        <span className="glyph-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4A90E2' }} />
          local rendering engine · no upload
        </span>
        <h1 className="mt-5 text-[38px] sm:text-[52px] lg:text-[60px] leading-[0.98] font-extrabold tracking-[-0.03em]">
          Turn any image into
          <br />
          <span className="glyph-accent-text">visual code.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed glyph-muted max-w-[52ch]">
          Drop a photograph and it is rebuilt instantly out of characters, dither, tiles, dots, bricks or glyphs —
          then hit randomize and it becomes something else. Every style is a different rendering algorithm running
          on your own machine.
        </p>

        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={drop}
          className="glyph-drop mt-7 flex items-center gap-4 px-5 py-4 cursor-pointer max-w-[560px]"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSeed(f);
              e.target.value = '';
            }}
          />
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' }}
          >
            <ImagePlus className="w-5 h-5 text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">Drop an image to transform</span>
            <span className="block glyph-muted text-[11px] mt-0.5">JPG · PNG · WEBP · GIF — or paste with Ctrl+V</span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={onEnter} className="glyph-btn glyph-btn-primary px-6 py-3">
            {hasWallet ? 'Enter studio' : 'Connect Scorpion'}
          </button>
          <span className="glyph-muted text-[11px]">Everything runs locally in your browser.</span>
        </div>
      </div>

      <div className="glyph-card rounded-3xl p-3 sm:p-4">
        <div className="flex items-center justify-between px-2 pb-3">
          <span className="glyph-muted text-[10px] uppercase tracking-[0.2em]">Characters · cyan · bloom</span>
          <span className="glyph-muted text-[10px] glyph-mono">seed 482913</span>
        </div>
        <canvas ref={canvasRef} className="w-full h-auto rounded-2xl" />
        <div className="flex items-center justify-between px-2 pt-3">
          <span className="glyph-muted text-[10px] uppercase tracking-[0.2em]">live renderer output</span>
          <span className="glyph-muted text-[10px]">340 × 208</span>
        </div>
      </div>
    </section>
  );
}