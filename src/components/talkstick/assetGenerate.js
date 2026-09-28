import { base44 } from "@/api/base44Client";

// The generator always paints on a flat white sheet, so a prop can be cut out
// to a clean transparent PNG the moment it comes back.
const RECIPE = {
  prop:
    "Draw only this one thing: {subject}. Nothing else appears in the frame — no extra people, figures, faces, hands, animals or scenery that were not asked for. The single subject is centred and fully inside the frame, on a completely flat pure white background — no shadow, no reflection, no ground. Crisp clean edges, strong contrast against the white, plain illustration style, no text, no watermark.",
  background:
    "Draw only this location: {subject}. A wide full-bleed scene background of the empty place itself, with no characters, no people, no text and no watermark. Even lighting, uncluttered, sharp, cinematic.",
};

/** The prompt the generator actually sees. */
export const buildPrompt = (subject, kind) =>
  (RECIPE[kind] || RECIPE.prop).replace("{subject}", subject.trim());

function loadImage(src, cors) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Without a CORS-approved load the browser taints the canvas, reading the
    // pixels back throws, and the cut-out silently keeps its white sheet.
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The generated image could not be loaded"));
    img.src = src;
  });
}

function sheetFor(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas;
}

/** The artwork exactly as generated, re-encoded so it can be stored locally. */
function keepArtwork(img) {
  return sheetFor(img).toDataURL("image/png");
}

/**
 * Erases the flat white sheet to transparency and crops down to the subject, so
 * a prop fills its box on the stage instead of floating in the middle of an
 * invisible square. Returns the new artwork and its aspect ratio.
 */
function cutOut(img, tolerance = 46) {
  const canvas = sheetFor(img);
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const threshold = 255 - tolerance;
  const soft = 26;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      if (min >= threshold) {
        px[i + 3] = 0;
      } else if (min >= threshold - soft) {
        const t = (min - (threshold - soft)) / soft;
        px[i + 3] = Math.round(px[i + 3] * (1 - t));
      }
      if (px[i + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  ctx.putImageData(data, 0, 0);

  if (maxX < minX || maxY < minY) {
    return { url: canvas.toDataURL("image/png"), ratio: canvas.width / canvas.height };
  }

  // A hair of padding keeps soft edges from being clipped.
  const pad = Math.max(2, Math.round(Math.min(canvas.width, canvas.height) * 0.02));
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const w = Math.min(canvas.width - x0, maxX - minX + 1 + pad * 2);
  const h = Math.min(canvas.height - y0, maxY - minY + 1 + pad * 2);

  const tight = document.createElement("canvas");
  tight.width = w;
  tight.height = h;
  tight.getContext("2d").drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
  return { url: tight.toDataURL("image/png"), ratio: w / h };
}

/**
 * Generates one asset. Props come back with their flat sheet removed so they
 * drop onto the stage as transparent cut-outs. Everything is returned as a
 * data URL, so a generated scene survives a refresh just like an uploaded one.
 */
export async function generateAsset({ subject, kind, transparent }) {
  const result = await base44.integrations.Core.GenerateImage({
    prompt: buildPrompt(subject, kind),
  });
  const url = result?.url;
  if (!url) throw new Error("The generator did not return an image");

  let img;
  try {
    img = await loadImage(url, true);
  } catch (error) {
    img = await loadImage(url, false);
  }

  const ratio = img.naturalWidth / img.naturalHeight || 1;

  try {
    return transparent ? cutOut(img) : { url: keepArtwork(img), ratio };
  } catch (error) {
    // The artwork could not be read back, so the generator's own image is kept
    // rather than losing the asset entirely.
    return { url, ratio };
  }
}