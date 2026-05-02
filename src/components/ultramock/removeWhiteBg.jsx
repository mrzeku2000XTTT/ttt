/**
 * Client-side white/near-white background removal.
 * AI image generators frequently return PNGs with a solid white (or off-white)
 * background even when prompted for transparency. This walks the pixels and
 * converts anything close to white to fully transparent, with a soft alpha
 * falloff so edges don't show a hard halo.
 *
 * Returns a new object-URL (blob URL) for a transparent PNG, plus a cleanup fn.
 *
 * tolerance: 0..255 — how far from pure white still counts as background.
 *   Higher = more aggressive removal. 30–50 is a good range.
 */
export async function removeWhiteBackground(imageUrl, { tolerance = 40 } = {}) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const threshold = 255 - tolerance;
  // Soft falloff range — pixels within this are partially transparent
  const softRange = 25;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const minRGB = Math.min(r, g, b);
    if (minRGB >= threshold) {
      // Fully white-ish → fully transparent
      px[i + 3] = 0;
    } else if (minRGB >= threshold - softRange) {
      // Near-white → soft alpha falloff to avoid hard halo
      const t = (minRGB - (threshold - softRange)) / softRange;
      px[i + 3] = Math.round(px[i + 3] * (1 - t));
    }
  }

  ctx.putImageData(data, 0, 0);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Canvas export failed");
  const url = URL.createObjectURL(blob);
  return { url, cleanup: () => URL.revokeObjectURL(url) };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image: " + e.message));
    img.src = src;
  });
}