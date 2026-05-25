export async function createKineVideoFromImage(imageUrl, prompt) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const image = await loadImage(imageUrl);
  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };

  const done = new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(URL.createObjectURL(blob));
    };
  });

  recorder.start();

  const duration = 6000;
  const start = performance.now();

  await new Promise((resolve) => {
    const draw = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      drawFrame(ctx, canvas, image, prompt, progress);

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(draw);
  });

  recorder.stop();
  return done;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawFrame(ctx, canvas, image, prompt, progress) {
  const { width, height } = canvas;
  const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
  const scale = 1.08 + ease * 0.1;
  const driftX = Math.sin(progress * Math.PI * 2) * 22;
  const driftY = Math.cos(progress * Math.PI) * 16;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2 + driftX, height / 2 + driftY);
  ctx.scale(scale, scale);
  drawCoverImage(ctx, image, -width / 2, -height / 2, width, height);
  ctx.restore();

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 80, width * 0.5, height * 0.55, width * 0.75);
  glow.addColorStop(0, "rgba(255,255,255,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.fillRect(0, height - 118, width, 118);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.textBaseline = "top";
  wrapText(ctx, prompt, 54, height - 88, width - 108, 38, 2);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "700 16px Inter, system-ui, sans-serif";
  ctx.fillText("Kine · fresh generated motion", 54, 38);
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
  }

  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(" ");
  let line = "";
  let lines = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(lines === maxLines - 1 ? `${line}…` : line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (line && lines < maxLines) ctx.fillText(line, x, y);
}