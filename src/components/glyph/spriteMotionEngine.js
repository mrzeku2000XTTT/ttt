import { drawStyle } from './glyphRenderers';
import { randomizeParams } from './glyphStyles';
import { PALETTES } from './glyphPalettes';

/**
 * Sprite motion engine — ported from GL-PH's spriteMotionEngine.ts.
 *
 * Turns ONE reference image into an articulated motion cycle (wings, body,
 * limbs deformed with real kinematics rather than a plain scale), runs a
 * treatment pipeline over every frame (ASCII, dither, halftone, pixel, VHS)
 * and packs the result into a game-ready sprite sheet with metadata.
 *
 * Plain JS, no dependencies, everything on the device.
 */

export const MOTION_PRESETS = [
  { id: 'wing_flap', label: 'Wing flap' },
  { id: 'idle', label: 'Idle' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'hover', label: 'Hover' },
  { id: 'float', label: 'Float' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'walk', label: 'Walk' },
  { id: 'run', label: 'Run' },
  { id: 'fly', label: 'Fly' },
  { id: 'jump', label: 'Jump' },
  { id: 'attack', label: 'Attack' },
  { id: 'hit', label: 'Hit' },
  { id: 'spin', label: 'Spin' },
  { id: 'turn', label: 'Turn' },
  { id: 'custom', label: 'Custom' },
];

// 'contour' exists in the upstream type but has no implementation, so it is not
// offered here — a picker option that silently does nothing is worse than none.
export const TREATMENTS = [
  { id: 'none', label: 'None' },
  { id: 'ascii', label: 'ASCII' },
  { id: 'dither', label: 'Dither' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'vhs', label: 'VHS' },
];

// Every ASCII-category style from the GLYPH library, in library order. These
// render through GLYPH's own engine, so a sprite carries the app's real look.
export const GLYPH_ASCII_STYLES = [
  { id: 'characters', label: 'Characters' },
  { id: 'asciiStudio', label: 'ASCII Studio' },
  { id: 'block', label: 'Block' },
  { id: 'dots', label: 'Dots' },
  { id: 'mixed', label: 'Mixed' },
  { id: 'braille', label: 'Braille' },
  { id: 'animatedAscii', label: 'Animated ASCII' },
  { id: 'matrix', label: 'Matrix' },
];

/* ── gradient grounds ─────────────────────────────────────────────────── */

const rgb = (c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

// The app's own palette grounds, turned into gradients: each runs from its dark
// ground, through the middle of its ramp, to its brightest colour — so a sheet
// sits in the same colour language as the rest of the app.
export const GRADIENTS = PALETTES.filter((p) => p.ramp || p.colors).map((p) => {
  const ramp = p.ramp || p.colors;
  const mid = rgb(ramp[Math.floor(ramp.length / 2)]);
  const to = rgb(ramp[ramp.length - 1]);
  return {
    id: p.id,
    label: p.name,
    from: p.bg,
    mid,
    to,
    css: `linear-gradient(135deg, ${p.bg}, ${mid}, ${to})`,
  };
});

export function gradientById(id) {
  return GRADIENTS.find((g) => g.id === id) || GRADIENTS[0];
}

/** Optimal grid for packing — works for ANY frame count, not just the presets. */
export function calculateBestGrid(frameCount) {
  switch (frameCount) {
    case 4:
      return { cols: 2, rows: 2 };
    case 6:
      return { cols: 3, rows: 2 };
    case 8:
      return { cols: 4, rows: 2 };
    case 12:
      return { cols: 4, rows: 3 };
    case 16:
      return { cols: 4, rows: 4 };
    case 24:
      return { cols: 6, rows: 4 };
    case 32:
      return { cols: 8, rows: 4 };
    default: {
      const cols = Math.ceil(Math.sqrt(frameCount));
      const rows = Math.ceil(frameCount / cols);
      return { cols, rows };
    }
  }
}

/**
 * Remove the background (chroma key) and crop/centre the subject into a square
 * frame, so every pose is anchored the same way.
 */
export function extractAndCenterSubject(sourceImage, targetSize, chromaKey) {
  const origW = sourceImage.width;
  const origH = sourceImage.height;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Could not get 2D context');

  srcCtx.drawImage(sourceImage, 0, 0);
  const imgData = srcCtx.getImageData(0, 0, origW, origH);
  const data = imgData.data;

  const keyHex = (chromaKey?.color || '#000000').replace('#', '');
  const kr = parseInt(keyHex.slice(0, 2) || '00', 16);
  const kg = parseInt(keyHex.slice(2, 4) || '00', 16);
  const kb = parseInt(keyHex.slice(4, 6) || '00', 16);
  const tolSq = ((chromaKey?.tolerance ?? 18) * 2.55) ** 2;

  let minX = origW;
  let minY = origH;
  let maxX = 0;
  let maxY = 0;
  let hasVisiblePixels = false;

  for (let y = 0; y < origH; y += 1) {
    for (let x = 0; x < origW; x += 1) {
      const i = (y * origW + x) * 4;
      let alpha = data[i + 3];

      if (alpha > 5) {
        if (chromaKey?.enabled) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const distSq = (r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2;

          if (distSq <= tolSq) {
            const edgeFade = Math.sqrt(distSq / Math.max(1, tolSq));
            if (edgeFade < 0.8) {
              data[i + 3] = 0;
              continue;
            }
            alpha = Math.round(alpha * ((edgeFade - 0.8) / 0.2));
            data[i + 3] = alpha;
          }
        }

        if (data[i + 3] > 10) {
          hasVisiblePixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  srcCtx.putImageData(imgData, 0, 0);

  if (!hasVisiblePixels) {
    minX = 0;
    minY = 0;
    maxX = origW - 1;
    maxY = origH - 1;
  }

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetSize;
  outCanvas.height = targetSize;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not get out context');

  const maxDim = Math.max(bboxW, bboxH);
  const scale = (targetSize * 0.78) / Math.max(1, maxDim);
  const drawW = bboxW * scale;
  const drawH = bboxH * scale;
  const destX = (targetSize - drawW) / 2;
  const destY = (targetSize - drawH) / 2;

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(srcCanvas, minX, minY, bboxW, bboxH, destX, destY, drawW, drawH);

  return { canvas: outCanvas, bbox: { minX, minY, maxX, maxY } };
}

/**
 * One articulated pose. Segments of the reference sprite are translated,
 * rotated and foreshortened along the motion cycle — the subject keeps its
 * identity because the actual pixels are deformed, never redrawn.
 */
export function renderArticulatedFrame(baseSprite, frameIndex, totalFrames, config) {
  const size = config.frameSize;
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = size;
  frameCanvas.height = size;
  const ctx = frameCanvas.getContext('2d');
  if (!ctx) return frameCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const t = (frameIndex / totalFrames) % 1;
  const phase = t * Math.PI * 2;
  const intensity = config.intensity;

  const cx = size / 2;
  const cy = size / 2;

  const yawDeg = config.cameraAngle?.yaw ?? 0;
  const pitchDeg = config.cameraAngle?.pitch ?? 0;
  const yawRad = (yawDeg * Math.PI) / 180;
  const pitchRad = (pitchDeg * Math.PI) / 180;

  const cosYaw = Math.cos(yawRad);
  const sinYaw = Math.sin(yawRad);
  const cosPitch = Math.max(0.2, Math.cos(pitchRad));

  const bodyHalfW = size * 0.1; // central 20% column is the anchored body

  ctx.save();

  ctx.translate(cx, cy);
  ctx.scale(1.0, cosPitch);
  ctx.translate(-cx, -cy);

  switch (config.preset) {
    case 'wing_flap':
    case 'fly': {
      // 3D dihedral wing stroke with camera perspective: wings raise, peak,
      // sweep down, pass level, tuck, recover.
      const flapCycle = Math.sin(phase);
      const flapCosine = Math.cos(phase);

      const bodyHoverY = -flapCycle * 4.5 * intensity;
      const maxDihedral = 0.85 * intensity;
      const wingAngle = flapCycle * maxDihedral;
      const camberShift = flapCosine * 12 * intensity;

      const wingScaleX = Math.max(0.08, Math.abs(cosYaw) * Math.cos(wingAngle * 0.95));

      const drawLeftWing = () => {
        ctx.save();
        ctx.translate(cx - bodyHalfW * Math.abs(cosYaw), cy + bodyHoverY);
        ctx.rotate(-wingAngle * 0.35 * Math.sign(cosYaw || 1));
        ctx.scale(wingScaleX, 1.0 + flapCycle * 0.08 * intensity);
        ctx.drawImage(
          baseSprite,
          0,
          0,
          cx - bodyHalfW,
          size,
          -(cx - bodyHalfW),
          -cy + camberShift * 0.3,
          cx - bodyHalfW,
          size
        );
        ctx.restore();
      };

      const drawRightWing = () => {
        ctx.save();
        ctx.translate(cx + bodyHalfW * Math.abs(cosYaw), cy + bodyHoverY);
        ctx.rotate(wingAngle * 0.35 * Math.sign(cosYaw || 1));
        ctx.scale(wingScaleX, 1.0 + flapCycle * 0.08 * intensity);
        ctx.drawImage(
          baseSprite,
          cx + bodyHalfW,
          0,
          cx - bodyHalfW,
          size,
          0,
          -cy + camberShift * 0.3,
          cx - bodyHalfW,
          size
        );
        ctx.restore();
      };

      const drawBody = () => {
        ctx.save();
        const bodySway = Math.sin(phase * 2) * 0.03 * intensity;
        ctx.translate(cx, cy + bodyHoverY);
        ctx.rotate(bodySway);
        ctx.scale(Math.max(0.35, Math.abs(cosYaw)), 1.0);
        ctx.drawImage(baseSprite, cx - bodyHalfW, 0, bodyHalfW * 2, size, -bodyHalfW, -cy, bodyHalfW * 2, size);
        ctx.restore();
      };

      // Depth sorting: the wing away from the camera is drawn first.
      if (sinYaw >= 0) {
        drawRightWing();
        drawBody();
        drawLeftWing();
      } else {
        drawLeftWing();
        drawBody();
        drawRightWing();
      }
      break;
    }

    case 'idle':
    case 'breathing': {
      const breath = (Math.sin(phase) + 1) * 0.5;
      const scaleX = 1 + (breath * 0.035 - 0.015) * intensity;
      const scaleY = 1 + ((1 - breath) * 0.035 - 0.015) * intensity;
      const hoverY = Math.sin(phase) * 3 * intensity;
      const microTilt = Math.sin(phase * 1.5) * 0.015 * intensity;

      ctx.translate(cx, cy + hoverY);
      ctx.rotate(microTilt);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'hover':
    case 'float': {
      // Buoyant figure-8 with a slight bank into the curves.
      const hoverX = Math.sin(phase) * 8 * intensity;
      const hoverY = Math.sin(phase * 2) * 6 * intensity;
      const bankAngle = Math.cos(phase) * 0.06 * intensity;
      const pulseScale = 1 + Math.sin(phase * 2) * 0.02 * intensity;

      ctx.translate(cx + hoverX, cy + hoverY);
      ctx.rotate(bankAngle);
      ctx.scale(pulseScale, pulseScale);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'bounce': {
      // Ballistic arc with squash on impact and stretch in the air.
      const bounceHeight = 22 * intensity;
      const parabolicY = Math.abs(Math.sin(phase)) * bounceHeight;
      const isTouchingGround = Math.sin(phase) < 0.25;

      let sx = 1.0;
      let sy = 1.0;
      if (isTouchingGround) {
        const squashFactor = (0.25 - Math.sin(phase)) * 0.8 * intensity;
        sx = 1.0 + squashFactor;
        sy = 1.0 - squashFactor * 0.8;
      } else {
        const stretchFactor = Math.cos(phase) * 0.12 * intensity;
        sx = 1.0 - stretchFactor * 0.5;
        sy = 1.0 + stretchFactor;
      }

      ctx.translate(cx, cy + bounceHeight - parabolicY);
      ctx.scale(sx, sy);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'walk':
    case 'run': {
      const isRun = config.preset === 'run';
      const stridePhase = phase * (isRun ? 2 : 1);
      const bob = Math.abs(Math.sin(stridePhase)) * (isRun ? 9 : 5) * intensity;
      const sway = Math.sin(stridePhase) * (isRun ? 0.08 : 0.04) * intensity;
      const forwardLean = (isRun ? 0.08 : 0.03) * intensity;

      // The legs step against each other while the body rides above them, so the
      // sheet reads as walking instead of bobbing on the spot. The unshifted band
      // is drawn first, so a step never leaves a hole behind it.
      const hipLine = Math.round(size * 0.56);
      const legHeight = size - hipLine;
      const halfW = Math.round(size / 2);
      const step = Math.sin(stridePhase) * (isRun ? 0.1 : 0.06) * size * intensity;

      ctx.translate(cx, cy - bob);
      ctx.rotate(sway + forwardLean);

      ctx.drawImage(baseSprite, 0, 0, size, hipLine, -cx, -cy, size, hipLine);
      ctx.drawImage(baseSprite, 0, hipLine, size, legHeight, -cx, -cy + hipLine, size, legHeight);
      ctx.drawImage(baseSprite, 0, hipLine, halfW, legHeight, -cx + step, -cy + hipLine, halfW, legHeight);
      ctx.drawImage(
        baseSprite,
        halfW,
        hipLine,
        size - halfW,
        legHeight,
        -cx + halfW - step,
        -cy + hipLine,
        size - halfW,
        legHeight
      );
      break;
    }

    case 'jump': {
      // A real arc: crouch, take off, hang, land, recover. It never sinks below
      // the ground it left, and the landing carries the weight.
      const AIR_START = 0.18;
      const AIR_END = 0.72;
      let lift = 0;
      let sx = 1;
      let sy = 1;

      if (t < AIR_START) {
        const p = t / AIR_START;
        const crouch = Math.sin(p * Math.PI * 0.5);
        sy = 1 - crouch * 0.09 * intensity;
        sx = 1 + crouch * 0.07 * intensity;
        lift = crouch * 5 * intensity;
      } else if (t < AIR_END) {
        const p = (t - AIR_START) / (AIR_END - AIR_START);
        const arc = 4 * p * (1 - p);
        const stretch = Math.sin(p * Math.PI) * 0.14 * intensity;
        lift = -arc * 34 * intensity;
        sy = 1 + stretch;
        sx = 1 - stretch * 0.6;
      } else {
        const p = (t - AIR_END) / (1 - AIR_END);
        const land = Math.sin(p * Math.PI) * Math.exp(-p * 2);
        sy = 1 - land * 0.12 * intensity;
        sx = 1 + land * 0.1 * intensity;
        lift = land * 6 * intensity;
      }

      ctx.translate(cx, cy + lift);
      ctx.scale(sx, sy);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'attack': {
      // Wind-up → snap → follow-through → recovery.
      let tx = 0;
      let angle = 0;
      let scale = 1.0;

      if (t < 0.25) {
        const p0 = t / 0.25;
        tx = -p0 * 12 * intensity;
        angle = -p0 * 0.1 * intensity;
      } else if (t < 0.5) {
        const p1 = (t - 0.25) / 0.25;
        tx = -12 + p1 * 34 * intensity;
        angle = 0.18 * intensity;
        scale = 1.0 + p1 * 0.12 * intensity;
      } else {
        const p2 = (t - 0.5) / 0.5;
        tx = 22 * (1 - p2) * intensity;
        angle = 0.18 * (1 - p2) * intensity;
      }

      ctx.translate(cx + tx, cy);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'hit': {
      const recoil = Math.exp(-t * 6) * Math.sin(t * Math.PI * 8) * 16 * intensity;
      ctx.translate(cx - recoil, cy);
      ctx.rotate(-recoil * 0.01);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'turn': {
      // Turning on the spot: it rotates in the plane, all the way round.
      ctx.translate(cx, cy);
      ctx.rotate(phase);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'spin': {
      // Spinning in depth: it goes edge-on, mirrors, and comes back around. The
      // floor keeps it from collapsing to a single line mid-turn.
      const cosAngle = Math.cos(phase);
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.12, Math.abs(cosAngle)), 1.0);
      if (cosAngle < 0) ctx.filter = 'brightness(0.85) contrast(1.1)';
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }

    case 'custom':
    default: {
      const dihedral = (config.customParams?.dihedralAngle ?? 0.6) * intensity;
      const flap = Math.sin(phase);
      const sX = Math.max(0.3, Math.cos(flap * dihedral));
      const hover = Math.sin(phase) * (config.customParams?.bodyHover ?? 6) * intensity;

      ctx.translate(cx, cy + hover);
      ctx.scale(sX, 1.0);
      ctx.drawImage(baseSprite, -cx, -cy);
      break;
    }
  }

  ctx.restore();

  if (config.glyphStyle) {
    // A GLYPH style rebuilds the frame with the app's real renderer, so the
    // sprite carries GLYPH's actual ASCII look rather than a lookalike.
    const params = config.glyphParams || buildGlyphParams(config.glyphStyle, size);
    applyGlyphStyle(frameCanvas, params, t);
  } else if (config.treatment && config.treatment !== 'none') {
    applyStylisticTreatment(frameCanvas, config.treatment, config.treatmentIntensity, config.treatmentColor);
  }

  // Last, so the sprite sits ON the ground — a sheet that is not transparent.
  if (config.background === 'gradient') {
    applyGradientBackground(frameCanvas, config.gradientId);
  }

  return frameCanvas;
}

/* ── GLYPH styles ─────────────────────────────────────────────────────── */

/**
 * One parameter set for a whole sequence — GLYPH's own randomiser, with the
 * source's colours kept so the sprite still looks like the image that went in.
 * Cell size is scaled to the frame, so a 128px and a 512px sheet read the same.
 */
export function buildGlyphParams(styleId, frameSize = 256) {
  const params = randomizeParams(null, { style: styleId, palette: 'original' });
  const scale = Math.max(0.5, frameSize / 256);
  return {
    ...params,
    cellSize: Math.max(3, Math.round(params.cellSize * scale)),
    brightness: 0,
  };
}

/** Rebuild one frame through GLYPH's renderer, keeping the sprite's silhouette. */
function applyGlyphStyle(canvas, params, t) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const src = { data: ctx.getImageData(0, 0, W, H).data, width: W, height: H };

  const styled = document.createElement('canvas');
  styled.width = W;
  styled.height = H;
  const sctx = styled.getContext('2d');
  if (!sctx) return;

  drawStyle(sctx, src, W, H, params, t);

  // Every style paints a full ground; clipping that back to the frame's own
  // alpha is what keeps a sprite sheet transparent between the poses.
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(canvas, 0, 0);
  sctx.globalCompositeOperation = 'source-over';

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(styled, 0, 0);
}

/** Lay a gradient ground under the sprite, so the frame is no longer transparent. */
function applyGradientBackground(canvas, gradientId) {
  const g = gradientById(gradientId);
  if (!g) return;
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  const lctx = layer.getContext('2d');
  if (!lctx) return;
  lctx.drawImage(canvas, 0, 0);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, g.from);
  grad.addColorStop(0.55, g.mid);
  grad.addColorStop(1, g.to);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(layer, 0, 0);
}

/**
 * Treatment pipeline — applied to each frame before packing.
 * The ASCII pass is the one that turns the motion into a character matrix.
 */
function applyStylisticTreatment(canvas, treatment, intensity, tintColor) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const getLum = (i) => (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;

  switch (treatment) {
    case 'ascii': {
      const cellSize = Math.max(6, Math.round(10 * (w / 256)));
      const chars = ' .:*#@';
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const octx = offscreen.getContext('2d');
      if (!octx) return;

      octx.font = `${cellSize}px monospace`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = tintColor || '#1ff2e1';

      for (let y = 0; y < h; y += cellSize) {
        for (let x = 0; x < w; x += cellSize) {
          const i = (y * w + x) * 4;
          const alpha = data[i + 3];
          if (alpha > 40) {
            const lum = getLum(i);
            const charIdx = Math.min(chars.length - 1, Math.floor(lum * chars.length));
            const char = chars[charIdx];
            if (char !== ' ') {
              octx.globalAlpha = (alpha / 255) * intensity;
              octx.fillText(char, x + cellSize / 2, y + cellSize / 2);
            }
          }
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0);
      break;
    }

    case 'pixel': {
      const blockSize = Math.max(3, Math.round(6 * (w / 256)));
      const smallW = Math.max(1, Math.round(w / blockSize));
      const smallH = Math.max(1, Math.round(h / blockSize));

      const down = document.createElement('canvas');
      down.width = smallW;
      down.height = smallH;
      const dctx = down.getContext('2d');
      if (!dctx) return;

      dctx.drawImage(canvas, 0, 0, smallW, smallH);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(down, 0, 0, smallW, smallH, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      break;
    }

    case 'dither': {
      const bayer4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          if (data[i + 3] > 10) {
            const threshold = (bayer4[y % 4][x % 4] / 16 - 0.5) * 60 * intensity;
            data[i] = Math.min(255, Math.max(0, data[i] + threshold));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + threshold));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + threshold));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'halftone': {
      const spacing = 8;
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const octx = offscreen.getContext('2d');
      if (!octx) return;
      octx.fillStyle = tintColor || '#1ff2e1';

      for (let y = 0; y < h; y += spacing) {
        for (let x = 0; x < w; x += spacing) {
          const i = (y * w + x) * 4;
          const alpha = data[i + 3];
          if (alpha > 40) {
            const lum = getLum(i);
            const radius = (spacing / 2) * Math.sqrt(lum) * intensity;
            if (radius > 0.5) {
              octx.globalAlpha = alpha / 255;
              octx.beginPath();
              octx.arc(x + spacing / 2, y + spacing / 2, radius, 0, Math.PI * 2);
              octx.fill();
            }
          }
        }
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0);
      break;
    }

    case 'vhs': {
      const shift = Math.round(3 * intensity);
      for (let y = 0; y < h; y += 1) {
        const scanline = y % 2 === 0 ? 0.8 : 1.0;
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4;
          if (data[i + 3] > 10) {
            const rIdx = (y * w + Math.min(w - 1, x + shift)) * 4;
            data[i] = data[rIdx] * scanline;
            data[i + 1] *= scanline;
            data[i + 2] *= scanline;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    default:
      break;
  }
}

/**
 * Full sequence + packed sheet. `onProgress(done, total)` lets a large,
 * unbounded frame count stay responsive instead of freezing the tab.
 */
export async function generateSpriteMotion(sourceImage, config, name = 'sprite', onProgress) {
  const { canvas: baseSprite } = extractAndCenterSubject(sourceImage, config.frameSize, config.chromaKey);

  // Built ONCE for the whole sequence: a style's seed, cell size and palette
  // have to stay put, or every frame would come out in a different look.
  const cfg = config.glyphStyle
    ? { ...config, glyphParams: buildGlyphParams(config.glyphStyle, config.frameSize) }
    : config;

  const totalFrames = config.frameCount;
  const frames = [];

  for (let i = 0; i < totalFrames; i += 1) {
    const frameCanvas = renderArticulatedFrame(baseSprite, i, totalFrames, cfg);
    frames.push({ index: i, canvas: frameCanvas, dataUrl: frameCanvas.toDataURL('image/png') });
    if (onProgress) onProgress(i + 1, totalFrames);
    // Yield to the browser so the progress readout actually paints.
    if (i % 3 === 2) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const { cols, rows } = calculateBestGrid(totalFrames);
  const sheetWidth = cols * config.frameSize;
  const sheetHeight = rows * config.frameSize;

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = sheetWidth;
  sheetCanvas.height = sheetHeight;
  const sheetCtx = sheetCanvas.getContext('2d');
  if (!sheetCtx) throw new Error('Could not get sheet context');

  sheetCtx.clearRect(0, 0, sheetWidth, sheetHeight);
  frames.forEach((frame, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    sheetCtx.drawImage(frame.canvas, col * config.frameSize, row * config.frameSize);
  });

  const metadata = {
    name,
    style: config.glyphStyle || config.treatment,
    background: config.background === 'gradient' ? gradientById(config.gradientId).id : 'transparent',
    frameWidth: config.frameSize,
    frameHeight: config.frameSize,
    frames: totalFrames,
    fps: config.fps,
    loop: config.loop,
    columns: cols,
    rows,
    sheetWidth,
    sheetHeight,
    animations: {
      [config.preset]: { start: 0, end: totalFrames - 1, loop: config.loop },
    },
  };

  return { frames, spriteSheetCanvas: sheetCanvas, metadata };
}

/** Read any image file into a canvas. */
export function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not read that image'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('That file could not be read as an image'));
    img.src = URL.createObjectURL(file);
  });
}

/** Built-in reference sprite so the studio works before anything is uploaded. */
export function createSampleButterflyCanvas(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const drawWingPair = (isRight) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (isRight) ctx.scale(-1, 1);

    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.bezierCurveTo(40, -130, 160, -160, 210, -90);
    ctx.bezierCurveTo(225, -50, 195, 20, 130, 30);
    ctx.bezierCurveTo(80, 35, 30, 15, 10, 5);
    ctx.closePath();

    const foreGrad = ctx.createLinearGradient(10, -10, 210, -90);
    foreGrad.addColorStop(0, '#0e0b0b');
    foreGrad.addColorStop(0.55, '#1ff2e1');
    foreGrad.addColorStop(1, '#9c5fef');
    ctx.fillStyle = foreGrad;
    ctx.fill();

    ctx.strokeStyle = '#1ff2e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.quadraticCurveTo(80, -70, 180, -90);
    ctx.moveTo(15, -10);
    ctx.quadraticCurveTo(90, -40, 175, -50);
    ctx.moveTo(15, -10);
    ctx.quadraticCurveTo(70, -10, 140, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.bezierCurveTo(30, 25, 120, 40, 140, 100);
    ctx.bezierCurveTo(150, 140, 100, 180, 50, 160);
    ctx.bezierCurveTo(20, 150, 15, 80, 10, 30);
    ctx.closePath();

    const hindGrad = ctx.createLinearGradient(10, 15, 140, 140);
    hindGrad.addColorStop(0, '#0e0b0b');
    hindGrad.addColorStop(0.6, '#9c5fef');
    hindGrad.addColorStop(1, '#1ff2e1');
    ctx.fillStyle = hindGrad;
    ctx.fill();

    ctx.strokeStyle = '#9c5fef';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  };

  drawWingPair(false);
  drawWingPair(true);

  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.ellipse(0, 20, 12, 55, 0, 0, Math.PI * 2);
  const bodyGrad = ctx.createLinearGradient(0, -35, 0, 75);
  bodyGrad.addColorStop(0, '#1ff2e1');
  bodyGrad.addColorStop(0.5, '#0a0a0a');
  bodyGrad.addColorStop(1, '#9c5fef');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(31,242,225,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -42, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#1ff2e1';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5, -45, 2.5, 0, Math.PI * 2);
  ctx.arc(5, -45, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-4, -50);
  ctx.bezierCurveTo(-15, -75, -35, -95, -50, -85);
  ctx.moveTo(4, -50);
  ctx.bezierCurveTo(15, -75, 35, -95, 50, -85);
  ctx.strokeStyle = '#1ff2e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-50, -85, 3.5, 0, Math.PI * 2);
  ctx.arc(50, -85, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#9c5fef';
  ctx.fill();

  ctx.restore();

  return canvas;
}