// GLYPH — the built-in picture.
//
// Nothing has to be uploaded before the studio can show something: this is a
// drawn source in the same shape every renderer already reads, so inspiration
// and a brand-new gallery are never blocked by an empty canvas.

import { makeRng } from './glyphPalettes';

export const SAMPLE_SIZE = { width: 620, height: 780 };

/** The built-in picture as a working source. */
export function sampleSource() {
  const { width: w, height: h } = SAMPLE_SIZE;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  const rng = makeRng(20260926);

  // A deep ground, so the subject reads as a silhouette against light.
  g.fillStyle = '#070a14';
  g.fillRect(0, 0, w, h);

  // The warm light the figure is standing in.
  const glow = g.createRadialGradient(w * 0.62, h * 0.3, 8, w * 0.62, h * 0.3, h * 0.62);
  glow.addColorStop(0, 'rgba(255,238,208,0.95)');
  glow.addColorStop(0.34, 'rgba(255,140,78,0.6)');
  glow.addColorStop(0.68, 'rgba(96,58,190,0.38)');
  glow.addColorStop(1, 'rgba(7,10,20,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  // A cooler light from the far side, so the two never cancel out.
  const rim = g.createRadialGradient(w * 0.14, h * 0.68, 6, w * 0.14, h * 0.68, h * 0.5);
  rim.addColorStop(0, 'rgba(96,190,255,0.5)');
  rim.addColorStop(1, 'rgba(7,10,20,0)');
  g.fillStyle = rim;
  g.fillRect(0, 0, w, h);

  // Out-of-focus lights behind the figure.
  for (let i = 0; i < 28; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.78;
    const r = 5 + rng() * 26;
    const bokeh = g.createRadialGradient(x, y, 0, x, y, r);
    bokeh.addColorStop(0, `rgba(255,${180 + Math.round(rng() * 60)},${140 + Math.round(rng() * 80)},${(0.1 + rng() * 0.26).toFixed(3)})`);
    bokeh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = bokeh;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // The figure: head and shoulders, near-black.
  g.fillStyle = '#05070d';
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.41, w * 0.185, h * 0.15, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(w * 0.12, h);
  g.quadraticCurveTo(w * 0.19, h * 0.62, w * 0.5, h * 0.6);
  g.quadraticCurveTo(w * 0.81, h * 0.62, w * 0.88, h);
  g.closePath();
  g.fill();

  // A lit edge down one side: the silhouette still has to have form.
  g.strokeStyle = 'rgba(255,208,152,0.8)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(w * 0.5, h * 0.41, w * 0.185, Math.PI * 1.12, Math.PI * 1.74);
  g.stroke();
  g.beginPath();
  g.moveTo(w * 0.795, h * 0.86);
  g.quadraticCurveTo(w * 0.83, h * 0.68, w * 0.6, h * 0.612);
  g.stroke();

  // Fine grain, so the tonal styles have something to bite on.
  const grain = g.getImageData(0, 0, w, h);
  const d = grain.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() - 0.5) * 14;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  g.putImageData(grain, 0, 0);

  return { width: w, height: h, imageData: grain };
}

/** The same picture as a file, so the studio can load it like any upload. */
export function sampleFile() {
  const src = sampleSource();
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').putImageData(src.imageData, 0, 0);
  return new Promise((resolve) => {
    c.toBlob((b) => resolve(new File([b], 'glyph-sample.png', { type: 'image/png' })), 'image/png');
  });
}