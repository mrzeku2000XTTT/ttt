// Lightweight Web Audio synthesis for proximity-based ambient soundscapes.
// No external assets — generated procedurally so it works offline and doesn't
// require uploading audio files. Two distinct soundscapes:
//   - "imagine":  ethereal shimmer pad (purple/dreamy)
//   - "kasshi":   broadcast static + low broadcast hum (red/live)
//
// Each emitter returns { setVolume, stop }. Volume is driven by 3D distance
// from the camera and shaped through a smoothed gain ramp.

export function createImagineEmitter(audioCtx, masterGain) {
  // Two detuned sine oscillators + slow LFO panner for an ethereal pad
  const out = audioCtx.createGain();
  out.gain.value = 0;
  out.connect(masterGain);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.Q.value = 4;
  filter.connect(out);

  const osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 220; // A3
  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 277.18; // C#4 — major third shimmer
  const osc3 = audioCtx.createOscillator();
  osc3.type = "triangle";
  osc3.frequency.value = 110; // sub layer

  // LFO for slow shimmer
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 60;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const mix = audioCtx.createGain();
  mix.gain.value = 0.3;
  osc1.connect(mix);
  osc2.connect(mix);
  osc3.connect(mix);
  mix.connect(filter);

  osc1.start();
  osc2.start();
  osc3.start();
  lfo.start();

  return {
    setVolume(v, when) {
      const target = Math.max(0, Math.min(0.6, v));
      out.gain.cancelScheduledValues(when);
      out.gain.setTargetAtTime(target, when, 0.25);
    },
    stop() {
      try { osc1.stop(); osc2.stop(); osc3.stop(); lfo.stop(); } catch {}
      out.disconnect();
    },
  };
}

export function createKasshiEmitter(audioCtx, masterGain) {
  // Broadcast: filtered white noise (radio static) + low hum
  const out = audioCtx.createGain();
  out.gain.value = 0;
  out.connect(masterGain);

  // Noise source
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1800;
  noiseFilter.Q.value = 0.7;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.18;

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(out);

  // Low broadcast hum
  const hum = audioCtx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 60;
  const humFilter = audioCtx.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 200;
  const humGain = audioCtx.createGain();
  humGain.gain.value = 0.12;
  hum.connect(humFilter);
  humFilter.connect(humGain);
  humGain.connect(out);

  // LFO that wobbles the static like a tuning radio
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.4;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 600;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseFilter.frequency);

  noise.start();
  hum.start();
  lfo.start();

  return {
    setVolume(v, when) {
      const target = Math.max(0, Math.min(0.5, v));
      out.gain.cancelScheduledValues(when);
      out.gain.setTargetAtTime(target, when, 0.3);
    },
    stop() {
      try { noise.stop(); hum.stop(); lfo.stop(); } catch {}
      out.disconnect();
    },
  };
}

// Maps a 3D distance to a 0..1 volume curve.
// near (full volume), far (silent), with smooth quadratic falloff.
export function distanceToVolume(distance, near = 8, far = 45) {
  if (distance <= near) return 1;
  if (distance >= far) return 0;
  const t = 1 - (distance - near) / (far - near);
  return t * t; // quadratic — feels more natural
}