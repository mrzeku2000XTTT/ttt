export async function analyzeVideoFrames(videoFileOrUrl, maxDuration = 10) {
  const url = typeof videoFileOrUrl === "string" ? videoFileOrUrl : URL.createObjectURL(videoFileOrUrl);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("Could not load video"));
  });

  const duration = Math.min(maxDuration, video.duration || maxDuration);
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const samples = [];
  let previous = null;

  for (let t = 0; t < duration; t += 0.25) {
    video.currentTime = Math.min(t, duration - 0.05);
    await new Promise((resolve) => { video.onseeked = resolve; });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let brightness = 0;
    let motion = 0;

    for (let i = 0; i < data.length; i += 16) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightness += avg;
      if (previous) motion += Math.abs(avg - previous[i / 4]);
    }

    const count = data.length / 16;
    const gray = new Float32Array(data.length / 4);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) gray[j] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    samples.push({
      t: Number(t.toFixed(2)),
      brightness: brightness / count,
      motion: previous ? motion / count : 0,
    });
    previous = gray;
  }

  if (typeof videoFileOrUrl !== "string") URL.revokeObjectURL(url);
  return buildEffectPlan(samples, duration);
}

function buildEffectPlan(samples, duration) {
  const effects = [];
  for (let t = 0; t < duration; t += 1) {
    const window = samples.filter((s) => s.t >= t && s.t < t + 1);
    const motion = avg(window.map((s) => s.motion));
    const brightness = avg(window.map((s) => s.brightness));
    const effect = motion > 24 ? "shake" : brightness < 78 ? "neon" : brightness > 165 ? "flash" : t % 3 === 0 ? "punch" : "zoom";
    effects.push({ start: Number(t.toFixed(2)), end: Number(Math.min(duration, t + 1).toFixed(2)), effect, motion, brightness });
  }
  return { duration, samples, effects };
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}