// Drawing one frame of the character: the artwork, then the animated mouth on top.

/**
 * Sizes the canvas to the artwork so the whole drawing fits the stage, keeping
 * its aspect ratio. Returns the fitted size.
 */
export function fitCanvas(canvas, image, maxWidth, maxHeight) {
  if (!canvas || !image) return null;
  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  return { width: canvas.width, height: canvas.height };
}

/**
 * The colour to cover the original mouth with: sampled from a ring of pixels
 * just outside the mouth, so it matches the face or the paper behind it instead
 * of assuming a white background.
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

/** Draws the character and its mouth at the current voice level (0 → 1). */
export function drawFrame(ctx, canvas, image, mouth, settings, level) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (!mouth) return;

  const baseW = canvas.width * (settings.width / 100);
  const baseH = canvas.width * (settings.height / 100);
  const cy = mouth.y + canvas.height * (settings.offsetY / 100);
  const open = baseH * (0.18 + level * 1.35);
  const w = baseW * (0.88 + level * 0.12);

  ctx.save();
  ctx.translate(mouth.x, cy);

  ctx.fillStyle = patchColor(ctx, mouth.x, cy, baseW * 0.62, baseH * 0.78);
  ctx.beginPath();
  ctx.ellipse(0, 0, baseW * 0.62, baseH * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#111";
  ctx.lineWidth = Math.max(2, canvas.width / 170);

  if (settings.style === "line") {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
  } else if (settings.style === "smile") {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(0, open * 1.5, w / 2, 0);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, Math.max(2, open / 2), 0, 0, Math.PI * 2);
    if (level > 0.16) ctx.fill();
    else ctx.stroke();
  }

  ctx.restore();
}