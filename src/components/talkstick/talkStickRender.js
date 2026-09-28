// Drawing one frame of the character: the artwork, then every placed feature on top.

import { drawMouth } from "./mouthStyles";
import { drawEyePair } from "./eyeStyles";
import { drawNose } from "./noseStyles";
import { assetBox, isBehind } from "./sceneAssets";

/**
 * Sizes the canvas to the artwork so the whole drawing fits the stage, keeping
 * its aspect ratio. Returns the fitted size.
 */
export function fitCanvas(canvas, image, maxWidth, maxHeight) {
  if (!canvas || !image) return null;
  // The artwork is either an uploaded image or a canvas the studio drew, so read
  // whichever size the source actually exposes.
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return null;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  return { width: canvas.width, height: canvas.height };
}

/**
 * The colour to cover the original mouth with: sampled from a ring of pixels
 * just outside the mouth, so it matches the face or the paper behind it instead
 * of assuming a white background. Only used when the cover is switched on.
 */
function patchColor(ctx, cx, cy, rx, ry) {
  const outer = 1.55;
  const left = Math.max(0, Math.floor(cx - rx * outer));
  const top = Math.max(0, Math.floor(cy - ry * outer));
  const width = Math.min(ctx.canvas.width - left, Math.ceil(rx * outer * 2));
  const height = Math.min(ctx.canvas.height - top, Math.ceil(ry * outer * 2));
  if (width < 2 || height < 2) return "#ffffff";

  let data;
  try {
    data = ctx.getImageData(left, top, width, height).data;
  } catch (error) {
    return "#ffffff";
  }

  const samples = 24;
  let r = 0;
  let g = 0;
  let b = 0;
  let taken = 0;
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(angle) * rx * 1.45) - left;
    const y = Math.round(cy + Math.sin(angle) * ry * 1.45) - top;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = (y * width + x) * 4;
    if (data[p + 3] < 200) continue;
    r += data[p];
    g += data[p + 1];
    b += data[p + 2];
    taken += 1;
  }
  if (!taken) return "#ffffff";
  return `rgb(${Math.round(r / taken)}, ${Math.round(g / taken)}, ${Math.round(b / taken)})`;
}

// Where the character has been dragged to, in canvas pixels. Face spots are
// stored relative to it, so moving the character carries the whole face along.
const NO_CHAR = { x: 0, y: 0 };

/** Where a feature sits and how big it is, in canvas pixels. */
function metrics(canvas, spot, part, char) {
  return {
    x: spot.x + char.x,
    y: spot.y + char.y + canvas.height * (part.offsetY / 100),
    w: canvas.width * (part.width / 100),
    h: canvas.width * (part.height / 100),
  };
}

/** Paints one layer of assets, in the order they were added. */
function paintLayer(ctx, canvas, assets, images) {
  if (!images) return;
  assets.forEach((asset) => {
    const art = images.get(asset.url);
    if (!art) return;
    const box = assetBox(asset, canvas);
    ctx.drawImage(art, box.x - box.w / 2, box.y - box.h / 2, box.w, box.h);
  });
}

/**
 * Draws one frame: everything sitting behind (background plates and props sent
 * back), the character, anything sent to the front, then the face on top — so
 * the mouth and eyes always stay visible while they move.
 */
export function drawFrame(ctx, canvas, image, rig, settings, level, scene) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const assets = scene?.assets || [];
  const char = scene?.char || NO_CHAR;
  paintLayer(ctx, canvas, assets.filter(isBehind), scene?.images);
  ctx.drawImage(image, char.x, char.y, canvas.width, canvas.height);
  paintLayer(ctx, canvas, assets.filter((asset) => !isBehind(asset)), scene?.images);

  if (!rig) return;

  const stroke = Math.max(2, canvas.width / 170);

  if (rig.eyes) {
    const m = metrics(canvas, rig.eyes, settings.eyes, char);
    ctx.save();
    ctx.translate(m.x, m.y);
    drawEyePair(ctx, settings.eyes.style, settings.eyes.anim, {
      size: m.h,
      spacing: m.w,
      level,
      stroke,
      time: performance.now() / 1000,
    });
    ctx.restore();
  }

  if (rig.nose) {
    const m = metrics(canvas, rig.nose, settings.nose, char);
    ctx.save();
    ctx.translate(m.x, m.y);
    drawNose(ctx, settings.nose.style, { w: m.w, h: m.h, stroke });
    ctx.restore();
  }

  if (rig.mouth) {
    const m = metrics(canvas, rig.mouth, settings.mouth, char);
    const open = m.h * (0.18 + level * 1.35);
    const w = m.w * (0.88 + level * 0.12);

    ctx.save();
    ctx.translate(m.x, m.y);

    // The cover is off by default — the mouth is drawn straight onto the artwork.
    if (settings.mouth.patch) {
      const patchX = Math.max(m.w * 0.62, w * 0.58);
      const patchY = Math.max(m.h * 0.78, open * 0.85);
      ctx.fillStyle = patchColor(ctx, m.x, m.y, patchX, patchY);
      ctx.beginPath();
      ctx.ellipse(0, 0, patchX, patchY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawMouth(ctx, settings.mouth.style, { w, open, level, weight: stroke });
    ctx.restore();
  }
}