// Renders a slide to a canvas with text overlay, returns a PNG blob.
// 9:16 (1080x1920) — TikTok slideshow spec.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderSlide({ image_url, text, role }, { width = 1080, height = 1920 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background image (cover)
  try {
    const img = await loadImage(image_url);
    const scale = Math.max(width / img.width, height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  } catch {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);
  }

  // Darkening gradient overlay for text readability
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Text
  const padding = 80;
  const maxTextWidth = width - padding * 2;
  const fontSize = role === "hook" ? 92 : role === "cta" ? 78 : 72;
  ctx.font = `900 ${fontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";

  const lines = wrapText(ctx, text || "", maxTextWidth);
  const lineHeight = fontSize * 1.15;
  const totalHeight = lines.length * lineHeight;
  // Hook = top third, body = center, CTA = bottom third
  const anchorY = role === "hook" ? height * 0.28 : role === "cta" ? height * 0.72 : height / 2;
  const startY = anchorY - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    ctx.strokeText(line, width / 2, y);
    ctx.fillText(line, width / 2, y);
  });

  // Subtle slide number tag for hook/cta
  if (role === "cta") {
    ctx.font = `700 32px -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("— follow for more —", width / 2, height - 120);
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}