export const NCS_BEAT_PRESETS = [
  {
    id: "ncs_energy",
    name: "NCS Energy Drop",
    bpm: 128,
    duration: 18,
    color: "from-cyan-400 via-blue-500 to-fuchsia-500",
    description: "Fast EDM cuts with a big drop feel",
  },
  {
    id: "ncs_future",
    name: "Future Bass Pulse",
    bpm: 150,
    duration: 16,
    color: "from-pink-400 via-purple-500 to-indigo-500",
    description: "Quick photo sync, bright synth hits",
  },
  {
    id: "ncs_chill",
    name: "Chill Gaming Beat",
    bpm: 92,
    duration: 20,
    color: "from-emerald-300 via-cyan-400 to-blue-500",
    description: "Smooth cinematic pacing with soft beats",
  },
];

export function createPresetTrack(preset) {
  const beats = buildBeatMarkers(preset.bpm, preset.duration);
  const url = createSyntheticLoopUrl(preset, beats);
  return {
    url,
    name: preset.name,
    presetId: preset.id,
    beatsData: {
      beats,
      bpm: preset.bpm,
      duration: preset.duration,
      sampleRate: 44100,
    },
  };
}

function buildBeatMarkers(bpm, duration) {
  const beatLength = 60 / bpm;
  const beats = [];
  for (let t = 0; t < duration; t += beatLength) {
    beats.push(Number(t.toFixed(3)));
  }
  return beats;
}

function createSyntheticLoopUrl(preset, beats) {
  const sampleRate = 44100;
  const totalSamples = Math.floor(preset.duration * sampleRate);
  const samples = new Float32Array(totalSamples);
  const bassFreq = preset.id === "ncs_chill" ? 55 : 48;
  const leadFreq = preset.id === "ncs_future" ? 392 : preset.id === "ncs_chill" ? 220 : 330;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatPhase = (t * preset.bpm) / 60;
    const beatPosition = beatPhase % 1;
    const kick = Math.exp(-beatPosition * 18) * Math.sin(2 * Math.PI * bassFreq * t);
    const hat = beatPosition > 0.48 && beatPosition < 0.56 ? (Math.random() * 2 - 1) * 0.08 : 0;
    const leadGate = beatPosition < 0.42 ? 1 : 0;
    const lead = Math.sin(2 * Math.PI * leadFreq * t) * 0.07 * leadGate;
    const sub = Math.sin(2 * Math.PI * (bassFreq / 2) * t) * 0.08;
    samples[i] = Math.max(-0.85, Math.min(0.85, kick * 0.45 + lead + sub + hat));
  }

  beats.forEach((beat, index) => {
    if (index % 8 !== 0) return;
    const start = Math.floor(beat * sampleRate);
    for (let i = 0; i < sampleRate * 0.12 && start + i < samples.length; i++) {
      const fade = 1 - i / (sampleRate * 0.12);
      samples[start + i] += Math.sin(2 * Math.PI * 880 * (i / sampleRate)) * 0.18 * fade;
    }
  });

  const wav = encodeWav(samples, sampleRate);
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}