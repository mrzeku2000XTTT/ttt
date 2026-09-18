import { assignMotionFx } from '@/components/niche/motionFx';

// Uses the same 720p composition and camera/caption rules as the desktop renderer.
export default function nicheMobilePainter({ style, styleId, cameras, motion, count, stopMotion, colorMode }) {
  const W = 1280, H = 720, drawH = H - 100;
  const ui = styleId === 'real-ui';
  const fxs = motion && !ui && !stopMotion ? assignMotionFx(count) : null;
  const moves = ['zoom-in', 'pan-left', 'zoom-out', 'pan-right', 'pan-up', 'zoom-in', 'pan-down', 'zoom-out'];
  return (ctx, assets, caption, i, p, t) => {
    ctx.fillStyle = stopMotion ? (colorMode === 'color' ? '#0b0b0e' : '#050507') : style.bg;
    ctx.fillRect(0, 0, W, H);
    const img = assets.images[stopMotion ? Math.min(assets.images.length - 1, Math.floor(p * assets.images.length)) : 0];
    if (fxs) fxs[i].draw(ctx, img, p, t, { W, H: drawH, style });
    else {
      const move = ui || stopMotion ? 'static' : (cameras[i] || moves[i % moves.length]);
      let z = 1, dx = 0, dy = 0;
      if (move === 'zoom-in') z = 1 + 0.12 * p;
      if (move === 'zoom-out') z = 1.12 - 0.12 * p;
      if (move.startsWith('pan-')) {
        z = 1.12;
        if (move === 'pan-left') dx = 0.5 - p;
        if (move === 'pan-right') dx = -0.5 + p;
        if (move === 'pan-up') dy = 0.5 - p;
        if (move === 'pan-down') dy = -0.5 + p;
      }
      const fit = (ui ? Math.min(W / img.width, drawH / img.height) : Math.max(W / img.width, drawH / img.height)) * z;
      const dw = img.width * fit, dh = img.height * fit;
      const boil = stopMotion ? (Math.floor(t * 12) % 2 === 0 ? 1 : -1) * 1.4 : 0;
      ctx.drawImage(img, (W - dw) / 2 + dx * Math.max(0, dw - W) / 2 + boil, (drawH - dh) / 2 + dy * Math.max(0, dh - drawH) / 2 - boil, dw, dh);
    }
    const lines = []; let line = '';
    for (const word of String(caption || '').split(/\s+/).filter(Boolean)) {
      if (line && (stopMotion ? line.split(' ').length >= 8 : `${line} ${word}`.length > 42)) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    ctx.font = 'bold 34px "Nunito", sans-serif';
    ctx.fillStyle = stopMotion ? '#f5f5f7' : style.ink;
    ctx.textAlign = 'center';
    lines.slice(0, 2).forEach((text, li) => ctx.fillText(text, W / 2, H - 56 + li * 42));
  };
}