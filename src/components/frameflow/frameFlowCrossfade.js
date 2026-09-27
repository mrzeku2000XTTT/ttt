/**
 * Demo strip — crossfades the two references into a visual frame strip.
 *
 * This is NOT AI interpolation: it exists so the interface still works when
 * generation is unavailable. Every real frame comes from the generator.
 */
export async function buildCrossfadeFrames(startSrc, endSrc, inBetweens) {
  const [startImg, endImg] = await Promise.all([loadImage(startSrc), loadImage(endSrc)]);
  const width = Math.max(startImg.naturalWidth, endImg.naturalWidth, 1024);
  const height = Math.max(startImg.naturalHeight, endImg.naturalHeight, 1024);
  const total = inBetweens + 2;
  const frames = [];

  for (let index = 0; index < total; index += 1) {
    const t = index / (total - 1);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1 - t;
    drawContain(ctx, startImg, width, height);
    ctx.globalAlpha = t;
    drawContain(ctx, endImg, width, height);
    ctx.globalAlpha = 1;
    frames.push({ index, image: canvas.toDataURL("image/png"), status: "ready", demo: true });
    await new Promise((resolve) => setTimeout(resolve, 18));
  }

  return frames;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function drawContain(ctx, image, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}