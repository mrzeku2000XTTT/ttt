export async function createKineVideoFromImage(imageUrl, prompt) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const image = await loadImage(imageUrl);
  const stream = canvas.captureStream(30);
  const audio = createAudioTrack();
  const recordedStream = new MediaStream([
    ...stream.getVideoTracks(),
    ...audio.destination.stream.getAudioTracks(),
  ]);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  const recorder = new MediaRecorder(recordedStream, { mimeType });
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data?.size) chunks.push(event.data);
  };

  const done = new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
  });

  audio.start();
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

  audio.stop();
  recorder.stop();
  const videoBlob = await done;
  await audio.close();
  return {
    videoBlob,
    videoUrl: URL.createObjectURL(videoBlob),
  };
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
  const scale = 0.92 + ease * 0.05;
  const driftX = Math.sin(progress * Math.PI * 2) * 10;
  const driftY = Math.cos(progress * Math.PI) * 8;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.filter = "blur(28px) saturate(1.2) brightness(0.75)";
  drawCoverImage(ctx, image, -40, -40, width + 80, height + 80);
  ctx.restore();

  ctx.save();
  ctx.translate(width / 2 + driftX, height / 2 + driftY);
  ctx.scale(scale, scale);
  drawContainImage(ctx, image, -width / 2, -height / 2, width, height);
  ctx.restore();

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 80, width * 0.5, height * 0.55, width * 0.75);
  glow.addColorStop(0, "rgba(255,255,255,0.04)");
  glow.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Kine · fresh generated motion + audio", 32, 28);
}

function createAudioTrack() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextClass();
  const destination = context.createMediaStreamDestination();
  const master = context.createGain();
  const bass = context.createOscillator();
  const shimmer = context.createOscillator();

  bass.type = "sine";
  bass.frequency.value = 82;
  shimmer.type = "triangle";
  shimmer.frequency.value = 246;
  master.gain.value = 0.045;

  bass.connect(master);
  shimmer.connect(master);
  master.connect(destination);

  return {
    destination,
    start() {
      bass.start();
      shimmer.start();
    },
    stop() {
      master.gain.setTargetAtTime(0, context.currentTime, 0.08);
      bass.stop(context.currentTime + 0.2);
      shimmer.stop(context.currentTime + 0.2);
    },
    close() {
      return context.close();
    },
  };
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

function drawContainImage(ctx, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > canvasRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
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