// iOS-style sounds, synthesized with Web Audio — identical in preview and
// in the exported MP4 (Pixabay has no public audio API, so we synthesize).

let _ctx = null;
export function getAudioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

const blip = (ctx, dest, freq, at, dur, gain, type = 'sine') => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(dest);
  o.start(at);
  o.stop(at + dur + 0.05);
};

// short percussive noise burst — the raw material for key clicks / swishes
const noiseBuf = (ctx) => {
  if (!ctx._nb) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    ctx._nb = b;
  }
  return ctx._nb;
};

// iMessage send — soft airy "swish" (downward noise sweep), not a chime
export const playSend = (ctx, dest, at) => {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(3200, at);
  bp.frequency.exponentialRampToValueAtTime(900, at + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.35, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(at);
};

// iMessage receive tri-tone
export const playReceive = (ctx, dest, at) => {
  [622.25, 830.61, 1046.5].forEach((f, i) => blip(ctx, dest, f, at + i * 0.13, 0.3, 0.16, 'triangle'));
};

// keyboard key click — a tiny bandpassed noise tick, like real phone typing
export const playTick = (ctx, dest, at) => {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2100 + Math.random() * 800;
  bp.Q.value = 1.4;
  const g = ctx.createGain();
  g.gain.value = 0.18;
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(at);
};