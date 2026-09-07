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

// iMessage send "swoosh"-ish double blip
export const playSend = (ctx, dest, at) => {
  blip(ctx, dest, 1318.51, at, 0.16, 0.18);
  blip(ctx, dest, 1567.98, at + 0.07, 0.2, 0.14);
};

// iMessage receive tri-tone
export const playReceive = (ctx, dest, at) => {
  [622.25, 830.61, 1046.5].forEach((f, i) => blip(ctx, dest, f, at + i * 0.13, 0.3, 0.16, 'triangle'));
};

// quiet keyboard tick
export const playTick = (ctx, dest, at) => {
  blip(ctx, dest, 3400, at, 0.03, 0.04, 'square');
};