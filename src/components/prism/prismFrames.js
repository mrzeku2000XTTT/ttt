// PRISM decode engine.
//
// Everything here runs in the browser on a <video> element and a canvas — no
// server, no ffmpeg. We seek the file, draw real pixels, and measure them:
// motion between samples, cut boundaries, brightness, how much of the frame is
// white, and the actual colour palette. What we measure is fact; the AI read on
// top of it is clearly labelled as an interpretation.

export const SAMPLE_W = 96;
export const SAMPLE_H = 54;
export const MAX_SAMPLES = 180;
export const SHEET_MAX = 18;
export const THUMB_W = 380;
export const VISION_FRAMES = 8;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/**
 * Resolve once a source is decodable. Takes a URL (we build the element) or an
 * element already on the page (we just wait for it) — the studio keeps the real
 * <video> mounted so you can scrub the file you are inspecting.
 */
export function loadVideo(srcOrEl) {
  return new Promise((resolve, reject) => {
    const external = typeof srcOrEl !== 'string';
    const v = external ? srcOrEl : document.createElement('video');
    if (!external) {
      v.crossOrigin = 'anonymous';
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.src = srcOrEl;
    }

    const settle = () => {
      if (!v.videoWidth || !v.videoHeight) {
        reject(new Error('The file decoded but reported no picture. Is it really a video?'));
        return;
      }
      resolve(v);
    };

    if (v.readyState >= 2 && v.videoWidth) {
      settle();
      return;
    }

    const timer = setTimeout(() => reject(new Error('Timed out reading this video — it may be too large or the host is slow.')), 45000);
    const ok = () => {
      clearTimeout(timer);
      settle();
    };
    v.addEventListener('loadeddata', ok, { once: true });
    v.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('This file could not be decoded by the browser. MP4 (H.264) and WebM are safe bets.'));
    }, { once: true });
  });
}

/** Seek and wait for the frame to actually be ready to draw. */
export function seekTo(v, t) {
  const target = clamp(t, 0, Math.max(0, (v.duration || 0) - 0.05));
  return new Promise((resolve) => {
    const onSeeked = () => {
      v.removeEventListener('seeked', onSeeked);
      resolve();
    };
    v.addEventListener('seeked', onSeeked);
    v.currentTime = target;
  });
}

/**
 * Best-effort frame rate. Browsers do not expose fps, so we play a fraction of a
 * second and read the media timestamps the compositor actually hands us.
 */
export async function estimateFps(v) {
  if (typeof v.requestVideoFrameCallback !== 'function') return null;
  const times = [];
  try {
    v.muted = true;
    await v.play();
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    const stop = (value) => {
      try { v.pause(); } catch { /* already stopped */ }
      resolve(value);
    };
    const step = (_now, meta) => {
      times.push(meta.mediaTime);
      if (times.length < 14) {
        v.requestVideoFrameCallback(step);
        return;
      }
      const deltas = [];
      for (let i = 1; i < times.length; i += 1) {
        const d = times[i] - times[i - 1];
        if (d > 0.001) deltas.push(d);
      }
      if (!deltas.length) return stop(null);
      deltas.sort((a, b) => a - b);
      const median = deltas[Math.floor(deltas.length / 2)];
      stop(median > 0 ? Math.round(1 / median) : null);
    };
    try {
      v.requestVideoFrameCallback(step);
    } catch {
      stop(null);
    }
  });
}

/** Draw a grid of samples across the whole video, small enough to measure. */
export async function sampleSeries(v, onProgress) {
  const duration = v.duration || 0;
  const count = clamp(Math.round(duration / 0.25), 12, MAX_SAMPLES);
  const step = duration / count;
  const canvas = makeCanvas(SAMPLE_W, SAMPLE_H);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const frames = [];

  for (let i = 0; i < count; i += 1) {
    const t = i * step;
    await seekTo(v, t);
    ctx.drawImage(v, 0, 0, SAMPLE_W, SAMPLE_H);
    frames.push({ t, data: ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data });
    onProgress?.((i + 1) / count, `Sampling frame ${i + 1} of ${count}`);
  }
  return { frames, interval: step };
}

const hexOf = (r, g, b) => `#${[r, g, b].map((n) => clamp(n, 0, 255).toString(16).padStart(2, '0')).join('')}`;

/** A readable name for a colour, so the palette is not just hex codes. */
export function colourName(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const pct = Math.round(l * 100);
  if (l > 0.965) return 'white';
  if (l < 0.04) return 'black';
  if (s < 0.1) return `${pct}% grey`;
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const hue =
    h < 15 || h >= 345 ? 'red'
      : h < 45 ? 'orange'
        : h < 70 ? 'yellow'
          : h < 160 ? 'green'
            : h < 200 ? 'cyan'
              : h < 260 ? 'blue'
                : h < 300 ? 'violet'
                  : 'magenta';
  const tone = l > 0.72 ? 'light ' : l < 0.28 ? 'deep ' : '';
  return `${tone}${hue}`;
}

/** The dominant colours of a set of frames, by area. */
export function paletteOf(frames, limit = 8) {
  const buckets = new Map();
  frames.forEach(({ data }) => {
    for (let p = 0; p < data.length; p += 4) {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      e.n += 1;
      e.r += r;
      e.g += g;
      e.b += b;
      buckets.set(key, e);
    }
  });
  const total = [...buckets.values()].reduce((sum, e) => sum + e.n, 0) || 1;
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((e) => {
      const hex = hexOf(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n));
      return { hex, name: colourName(hex), share: Math.round((e.n / total) * 1000) / 10 };
    });
}

/**
 * Measure the series: motion between samples, where the cuts are, how bright the
 * piece runs, how much of it is white, and the palette per shot.
 */
export function analyseSeries(frames, duration) {
  const px = SAMPLE_W * SAMPLE_H;
  const motion = [];
  const brightness = [];
  const white = [];

  frames.forEach((frame, i) => {
    const d = frame.data;
    let lum = 0;
    let wh = 0;
    for (let p = 0; p < d.length; p += 4) {
      lum += (d[p] + d[p + 1] + d[p + 2]) / 3;
      if (d[p] >= 236 && d[p + 1] >= 236 && d[p + 2] >= 236) wh += 1;
    }
    brightness.push(Math.round((lum / px / 255) * 100));
    white.push(Math.round((wh / px) * 100));

    if (i === 0) {
      motion.push(0);
      return;
    }
    const prev = frames[i - 1].data;
    let diff = 0;
    for (let p = 0; p < d.length; p += 4) {
      diff += Math.abs(d[p] - prev[p]) + Math.abs(d[p + 1] - prev[p + 1]) + Math.abs(d[p + 2] - prev[p + 2]);
    }
    motion.push(Math.round((diff / (px * 3) / 255) * 1000) / 10);
  });

  const rest = motion.slice(1);
  const mean = rest.length ? rest.reduce((a, b) => a + b, 0) / rest.length : 0;
  const variance = rest.length ? rest.reduce((a, b) => a + (b - mean) ** 2, 0) / rest.length : 0;
  const sd = Math.sqrt(variance);
  // A cut is a spike against this video's own rhythm, not an absolute number.
  const threshold = Math.max(mean + 2.2 * sd, mean * 2.2, 7);

  const cuts = [];
  motion.forEach((m, i) => {
    if (i > 0 && m > threshold) cuts.push(Math.round(frames[i].t * 100) / 100);
  });

  const bounds = [0, ...cuts, duration];
  const shots = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const start = bounds[i];
    const end = bounds[i + 1];
    if (end - start < 0.05) continue;
    const inShot = frames.filter((f) => f.t >= start && f.t <= end);
    const shotMotion = inShot.map((f) => motion[frames.indexOf(f)] || 0);
    shots.push({
      index: shots.length + 1,
      start,
      end,
      length: Math.round((end - start) * 100) / 100,
      motion: shotMotion.length ? Math.round((shotMotion.reduce((a, b) => a + b, 0) / shotMotion.length) * 10) / 10 : 0,
      palette: paletteOf(inShot, 4),
    });
  }

  const avg = (list) => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0);

  return {
    motion,
    brightness,
    white,
    cuts,
    shots,
    threshold: Math.round(threshold * 10) / 10,
    palette: paletteOf(frames, 8),
    summary: {
      sampleInterval: Math.round((duration / Math.max(1, frames.length)) * 1000) / 1000,
      cuts: cuts.length,
      shots: shots.length,
      avgShot: shots.length ? Math.round((duration / shots.length) * 100) / 100 : duration,
      shortestShot: shots.length ? Math.min(...shots.map((s) => s.length)) : duration,
      longestShot: shots.length ? Math.max(...shots.map((s) => s.length)) : duration,
      avgBrightness: avg(brightness),
      avgWhite: avg(white),
      peakMotion: motion.length ? Math.max(...motion) : 0,
      avgMotion: Math.round(avg(motion.slice(1)) * 10) / 10,
      pacing: (() => {
        const a = avg(shots.map((s) => s.length));
        if (a < 0.8) return 'very fast';
        if (a < 1.8) return 'fast';
        if (a < 3.5) return 'measured';
        if (a < 6) return 'slow';
        return 'contemplative';
      })(),
    },
  };
}

/** Real thumbnails, drawn from the file itself. */
export async function contactSheet(v, times, onProgress) {
  const ratio = v.videoHeight && v.videoWidth ? v.videoHeight / v.videoWidth : 9 / 16;
  const canvas = makeCanvas(THUMB_W, THUMB_W * ratio);
  const ctx = canvas.getContext('2d');
  const out = [];
  for (let i = 0; i < times.length; i += 1) {
    await seekTo(v, times[i]);
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    out.push({ t: times[i], url: canvas.toDataURL('image/jpeg', 0.72) });
    onProgress?.((i + 1) / times.length, `Rendering thumbnail ${i + 1} of ${times.length}`);
  }
  return out;
}

/** Pick evenly spread frames, plus the busiest moments, for the visual read. */
export function pickVisionTimes(sheet, motion, duration, count = VISION_FRAMES) {
  const picked = [];
  const add = (t) => {
    const clean = Math.round(clamp(t, 0, duration) * 100) / 100;
    if (!picked.some((p) => Math.abs(p - clean) < 0.2)) picked.push(clean);
  };
  add(0);
  const stride = duration / (count + 1);
  for (let i = 1; i <= count; i += 1) add(i * stride);
  // The three busiest samples — that is where the motion actually is.
  motion
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 3)
    .forEach(({ i }) => add((sheet[i]?.t ?? 0)));
  return picked.sort((a, b) => a - b).slice(0, count + 3);
}

export function dataUrlToFile(dataUrl, name) {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export const timecode = (s) => {
  const total = Math.max(0, Number(s) || 0);
  const m = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  const cs = Math.floor((total % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

export const fileSize = (bytes) => {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
};