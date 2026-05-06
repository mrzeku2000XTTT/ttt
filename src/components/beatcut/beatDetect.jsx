export async function detectBeats(audioBlobOrUrl, opts = {}) {
  const minSpacing = opts.minSpacing ?? 0.28;
  const threshold = opts.threshold ?? 1.35;
  const lowPassHz = opts.lowPassHz ?? 200;

  let arrayBuffer;
  if (audioBlobOrUrl instanceof Blob) {
    arrayBuffer = await audioBlobOrUrl.arrayBuffer();
  } else if (typeof audioBlobOrUrl === "string") {
    const res = await fetch(audioBlobOrUrl);
    arrayBuffer = await res.arrayBuffer();
  } else {
    throw new Error("detectBeats: expected Blob or URL string");
  }

  const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
  await tempCtx.close().catch(() => {});

  const offline = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const src = offline.createBufferSource();
  src.buffer = audioBuffer;
  const filter = offline.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = lowPassHz;
  src.connect(filter);
  filter.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();

  const data = rendered.getChannelData(0);
  const sampleRate = rendered.sampleRate;
  const frameSize = Math.floor(sampleRate * 0.01);
  const energies = [];
  for (let i = 0; i < data.length; i += frameSize) {
    let sum = 0;
    const end = Math.min(i + frameSize, data.length);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    energies.push(Math.sqrt(sum / (end - i)));
  }

  const windowSize = 100;
  const beats = [];
  let lastBeatTime = -Infinity;
  for (let i = windowSize; i < energies.length; i++) {
    let mean = 0;
    for (let j = i - windowSize; j < i; j++) mean += energies[j];
    mean /= windowSize;
    if (energies[i] > mean * threshold && energies[i] > 0.01) {
      const t = (i * frameSize) / sampleRate;
      if (t - lastBeatTime >= minSpacing) {
        beats.push(t);
        lastBeatTime = t;
      }
    }
  }

  let bpm = 120;
  if (beats.length > 4) {
    const spacings = [];
    for (let i = 1; i < beats.length; i++) spacings.push(beats[i] - beats[i - 1]);
    spacings.sort((a, b) => a - b);
    const median = spacings[Math.floor(spacings.length / 2)];
    if (median > 0) bpm = Math.round(60 / median);
  }

  return { beats, bpm, duration: audioBuffer.duration, sampleRate: audioBuffer.sampleRate };
}

export function buildCutPlan(beats, totalDuration, minClipDuration = 0.4) {
  const cuts = [0];
  let lastCut = 0;
  for (const b of beats) {
    if (b - lastCut >= minClipDuration && b < totalDuration - 0.1) {
      cuts.push(b);
      lastCut = b;
    }
  }
  cuts.push(totalDuration);
  return cuts;
}