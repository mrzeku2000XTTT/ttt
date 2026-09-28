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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
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

/** Turns the flat white sheet into transparency, with a soft edge falloff. */
function cutOut(img, tolerance = 46) {
  const canvas = sheetFor(img);
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const threshold = 255 - tolerance;
  const soft = 26;

  for (let i = 0; i < px.length; i += 4) {
    const min = Math.min(px[i], px[i + 1], px[i + 2]);
    if (min >= threshold) {
      px[i + 3] = 0;
    } else if (min >= threshold - soft) {
      const t = (min - (threshold - soft)) / soft;
      px[i + 3] = Math.round(px[i + 3] * (1 - t));
    }
  }

  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
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

  const img = await loadImage(url);
  const ratio = img.naturalWidth / img.naturalHeight || 1;

  try {
    return { url: transparent ? cutOut(img) : keepArtwork(img), ratio };
  } catch (error) {
    // The artwork was served without cross-origin access, so its pixels cannot
    // be read. Keep the original rather than losing the asset.
    return { url, ratio };
  }
}