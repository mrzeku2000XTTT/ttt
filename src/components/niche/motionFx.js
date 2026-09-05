// Motion FX engine — an After Effects-style motion layer for the explainer
// stitcher. When Motion FX is on, every still scene image becomes moving
// motion graphics: eased camera keyframes, cutout slide entrances, parallax
// drift, light sweeps, particles, shakes, pops, tile reveals and vignettes.
// Inspired by the Kutt hyperframe animation presets and Remotion's
// spring/easing idioms (github.com/remotion-dev/remotion).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - clamp01(p), 3);
const easeInOutCubic = (p) => {
  const x = clamp01(p);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutBack = (p) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(p);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Draw the image with cover fit + arbitrary transform (zoom / offset / rotate).
const cover = (img, W, H) => Math.max(W / img.width, H / img.height);
const drawTransformed = (ctx, img, W, H, { z = 1, x = 0, y = 0, rot = 0 } = {}) => {
  const s = cover(img, W, H) * z;
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.save();
  ctx.translate(W / 2 + x, H / 2 + y);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
};

// Deterministic particle field (no Math.random at draw time)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x0: ((i * 61) % 100) / 100,
  y0: ((i * 37) % 100) / 100,
  r: 1.5 + (i % 4),
  sp: 0.02 + (i % 5) * 0.008,
  wob: 0.5 + (i % 3) * 0.35
}));

export const MOTION_FX = [
  {
    id: 'parallax-drift',
    name: 'Parallax Drift',
    // two layers of the same image drifting at different speeds = depth
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * 0.45;
      drawTransformed(ctx, img, W, H, { z: 1.28 + 0.03 * Math.sin(t * 0.4), x: Math.sin(t * 0.3) * 26 });
      ctx.globalAlpha = ga;
      drawTransformed(ctx, img, W, H, { z: 1.06 + 0.02 * Math.sin(t * 1.1), x: Math.sin(t * 0.8 + 2) * -18, y: Math.cos(t * 0.6) * 10 });
    }
  },
  {
    id: 'float-breathe',
    name: 'Float & Breathe',
    draw: (ctx, img, p, t, env) => {
      drawTransformed(ctx, img, env.W, env.H, {
        z: 1.08 + 0.02 * Math.sin(t * 1.2),
        y: Math.sin(t * 1.6) * 10,
        x: Math.sin(t * 0.7) * 8
      });
    }
  },
  {
    id: 'slide-cutin',
    name: 'Slide Cut-In',
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      const entrance = (1 - easeOutCubic(p / 0.18)) * W * 0.35;
      drawTransformed(ctx, img, W, H, { z: 1.08, x: -entrance + Math.sin(t * 0.5) * 12 });
    }
  },
  {
    id: 'pop-bounce',
    name: 'Pop Bounce',
    draw: (ctx, img, p, t, env) => {
      const z = p < 0.15 ? 0.7 + 0.35 * easeOutBack(p / 0.15) : 1.05 + 0.015 * Math.sin(t * 1.4);
      drawTransformed(ctx, img, env.W, env.H, { z, x: Math.sin(t * 0.6) * 8 });
    }
  },
  {
    id: 'spin-drift',
    name: 'Spin Drift',
    draw: (ctx, img, p, t, env) => {
      const z = 1.15 - 0.09 * easeOutCubic(p); // slow eased zoom-out
      drawTransformed(ctx, img, env.W, env.H, { z, rot: Math.sin(t * 0.7) * 0.025, x: Math.sin(t * 0.4) * 14 });
    }
  },
  {
    id: 'impact-shake',
    name: 'Impact Shake',
    draw: (ctx, img, p, t, env) => {
      const amp = p < 0.12 ? 10 * (1 - p / 0.12) : 0;
      drawTransformed(ctx, img, env.W, env.H, {
        z: 1.07 + 0.015 * Math.sin(t * 1.8),
        x: Math.sin(t * 42) * amp,
        y: Math.cos(t * 35) * amp
      });
    }
  },
  {
    id: 'split-slide',
    name: 'Split Cutout Slide',
    // the image is cut into two vertical cutouts sliding in from opposite sides
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      const off = (1 - easeOutCubic(p / 0.22)) * W * 0.45;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
      drawTransformed(ctx, img, W, H, { z: 1.08, x: -off + Math.sin(t * 0.6) * 8 });
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
      drawTransformed(ctx, img, W, H, { z: 1.08, x: off + Math.cos(t * 0.6) * 8 });
      ctx.restore();
    }
  },
  {
    id: 'tile-reveal',
    name: 'Tile Reveal',
    // the image assembles from a staggered grid of tiles, then a slow zoom rides on top
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      const cols = 4;
      const rows = 3;
      const z = 1 + 0.06 * easeInOutCubic(p);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(z, z);
      ctx.translate(-W / 2, -H / 2);
      const s = cover(img, W, H);
      const srcW = W / s;
      const srcH = H / s;
      const srcX = (img.width - srcW) / 2;
      const srcY = (img.height - srcH) / 2;
      const tw = srcW / cols;
      const th = srcH / rows;
      const dw = W / cols;
      const dh = H / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const delay = (r * cols + c) * 0.018;
          const local = clamp01((p - delay) / 0.2);
          if (local <= 0) continue;
          const sc = easeOutCubic(local);
          const cx = (c + 0.5) * dw;
          const cy = (r + 0.5) * dh;
          ctx.drawImage(
            img,
            srcX + c * tw, srcY + r * th, tw, th,
            cx - (dw * sc) / 2, cy - (dh * sc) / 2, dw * sc, dh * sc
          );
        }
      }
      ctx.restore();
    }
  },
  {
    id: 'light-sweep',
    name: 'Light Sweep',
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      drawTransformed(ctx, img, W, H, { z: 1.09 + 0.02 * Math.sin(t * 0.9), x: Math.sin(t * 0.5) * 12 });
      const cycle = (t % 4) / 4;
      if (cycle < 0.62) {
        const lx = -W * 0.4 + (cycle / 0.62) * W * 1.8;
        const grad = ctx.createLinearGradient(lx - W * 0.22, 0, lx + W * 0.22, H);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
  },
  {
    id: 'zoom-punch',
    name: 'Camera Punch-In',
    draw: (ctx, img, p, t, env) => {
      const punch = 1 + 0.13 * easeOutCubic(p / 0.22);
      drawTransformed(ctx, img, env.W, env.H, {
        z: punch + 0.012 * Math.sin(t * 2),
        x: Math.sin(t * 0.45) * 10,
        y: Math.cos(t * 0.35) * 6
      });
    }
  },
  {
    id: 'orbit-pan',
    name: 'Orbit Pan',
    // multi-keyframe camera: pan across, then ease into a slow zoom
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      let x;
      let z;
      if (p < 0.5) {
        const k = easeInOutCubic(p / 0.5);
        x = -60 + k * 120;
        z = 1.12;
      } else {
        const k = easeInOutCubic((p - 0.5) / 0.5);
        x = 60 - k * 18;
        z = 1.12 + k * 0.1;
      }
      drawTransformed(ctx, img, W, H, { z, x, y: Math.sin(t * 0.9) * 5 });
    }
  },
  {
    id: 'particles-drift',
    name: 'Particle Drift',
    draw: (ctx, img, p, t, env) => {
      const { W, H, style } = env;
      drawTransformed(ctx, img, W, H, { z: 1.08 + 0.02 * p, x: Math.sin(t * 0.4) * 10 });
      const ga = ctx.globalAlpha;
      ctx.save();
      ctx.fillStyle = style.ink || '#ffffff';
      PARTICLES.forEach((pt, i) => {
        const py = (pt.y0 - ((t * pt.sp) % 1) + 1) % 1;
        const px = (pt.x0 + Math.sin(t * pt.wob + i) * 0.02 + 1) % 1;
        ctx.globalAlpha = ga * 0.25;
        ctx.beginPath();
        ctx.arc(px * W, py * H, pt.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  },
  {
    id: 'vignette-breathe',
    name: 'Vignette Breathe',
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      drawTransformed(ctx, img, W, H, { z: 1.1 + 0.02 * Math.sin(t * 0.8), y: Math.cos(t * 0.5) * 8 });
      const breathe = 0.32 + 0.14 * Math.sin(t * 1.3);
      const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${breathe.toFixed(3)})`);
      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  },
  {
    id: 'curtain-rise',
    name: 'Curtain Rise',
    draw: (ctx, img, p, t, env) => {
      const { W, H } = env;
      const entrance = (1 - easeOutCubic(p / 0.2)) * H * 0.28;
      drawTransformed(ctx, img, W, H, { z: 1.1, y: entrance + Math.sin(t * 0.9) * 6 });
    }
  }
];

// Assign a varied treatment to every scene — shuffled per build, never the
// same treatment twice in a row, so each scene moves differently.
export const assignMotionFx = (n) => {
  const pool = MOTION_FX.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (i * 7 + n * 3) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    let fx = pool[i % pool.length];
    if (i && out[i - 1] === fx) fx = pool[(i + 3) % pool.length];
    out.push(fx);
  }
  return out;
};