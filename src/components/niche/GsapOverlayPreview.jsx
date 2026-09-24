import React, { useEffect, useRef, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { createOverlayPlayer } from './gsapOverlay';

const W = 640;
const H = 360;

// Live canvas preview of one GSAP UI overlay spec, drawn over its scene image
// with the exact same player the video export uses.
export default function GsapOverlayPreview({ image, spec, label }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    imgRef.current = null;
    if (!image) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; };
    img.src = image;
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spec?.elements?.length) return;
    const ctx = canvas.getContext('2d');
    const player = createOverlayPlayer(spec);
    let raf = 0;
    let start = 0;

    const loop = (ts) => {
      if (!start) start = ts;
      const t = (ts - start) / 1000;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0b0f14';
      ctx.fillRect(0, 0, W, H);
      const img = imgRef.current;
      if (img) {
        const fit = Math.max(W / img.width, H / img.height);
        const dw = img.width * fit;
        const dh = img.height * fit;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
      player.seek(t);
      player.draw(ctx, W, H, 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spec, image, nonce]);

  if (!spec?.elements?.length) return null;

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.03] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-cyan-200/80 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {label || 'GSAP UI overlay'} · {spec.title}
        </p>
        <button
          onClick={() => setNonce((n) => n + 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-[11px] font-semibold transition-all"
        >
          <Play className="w-3 h-3" />
          Replay
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border border-white/10 bg-black" />
    </div>
  );
}