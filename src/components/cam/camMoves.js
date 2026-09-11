// CAM camera-move library — derived from the After Effects cinematic camera guide
// (see src/docs/cam-camera-knowledge.md). Each move maps a progress p (0→1,
// eased) + intensity i (0→1) to a virtual camera state:
//   zoom  — scale multiplier (1 = framed)
//   x, y  — pan offsets as fractions of frame width/height
//   rot   — roll in degrees (dutch tilt)

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const MOVES = [
  { id: 'pan', label: 'Pan', feel: 'Scan left ↔ right',
    kf: (p, i) => ({ zoom: 1 + 0.1 * i, x: (0.5 - p) * 0.25 * i, y: 0, rot: 0 }) },
  { id: 'tilt', label: 'Tilt', feel: 'Reveal up / down',
    kf: (p, i) => ({ zoom: 1 + 0.1 * i, x: 0, y: (0.5 - p) * 0.25 * i, rot: 0 }) },
  { id: 'roll', label: 'Roll', feel: 'Dutch tilt tension',
    kf: (p, i) => ({ zoom: 1.05 + 0.1 * i, x: 0, y: 0, rot: (p - 0.5) * 18 * i }) },
  { id: 'dolly', label: 'Dolly', feel: 'Draw the viewer in',
    kf: (p, i) => ({ zoom: 1 + p * (0.25 + 0.55 * i), x: 0, y: 0, rot: 0 }) },
  { id: 'zoom', label: 'Zoom', feel: 'Lens compression',
    kf: (p, i) => ({ zoom: 1 + p * p * (0.35 + 0.75 * i), x: 0, y: 0, rot: 0 }) },
  { id: 'dollyzoom', label: 'Dolly Zoom', feel: 'Vertigo warp',
    kf: (p, i) => ({ zoom: 1 + p * (0.3 + 0.6 * i), x: 0, y: p * 0.06 * i, rot: -p * 5 * i }) },
  { id: 'truck', label: 'Truck', feel: 'Travel alongside',
    kf: (p, i) => ({ zoom: 1.08 + 0.08 * i, x: (p - 0.5) * 0.3 * i, y: 0, rot: 0 }) },
  { id: 'pedestal', label: 'Pedestal', feel: 'Rise / descend',
    kf: (p, i) => ({ zoom: 1.08 + 0.08 * i, x: 0, y: (p - 0.5) * 0.3 * i, rot: 0 }) },
  { id: 'orbit', label: 'Orbit', feel: 'Circle the subject',
    kf: (p, i) => ({ zoom: 1.12 + 0.1 * i, x: Math.sin(p * Math.PI * 2) * 0.16 * i, y: Math.cos(p * Math.PI * 2) * 0.06 * i, rot: 0 }) },
  { id: 'crane', label: 'Crane', feel: 'Sweeping combo',
    kf: (p, i) => ({ zoom: 1 + p * 0.2 * i, x: (p - 0.5) * 0.2 * i, y: (p - 0.5) * 0.2 * i, rot: (p - 0.5) * 6 * i }) },
];

export const moveById = (id) => MOVES.find((m) => m.id === id) || MOVES[0];

export function moveAt(move, progress, intensity) {
  return move.kf(easeInOut(Math.min(Math.max(progress, 0), 1)), intensity);
}

// Render one frame of a move into any 2D context (preview canvas or storyboard strip).
export function drawInto(ctx, W, H, image, move, p, intensity) {
  const c = moveAt(move, p, intensity);
  // cover-fit with headroom proportional to intensity so pans never show edges
  const base = Math.max(W / image.naturalWidth, H / image.naturalHeight) * (1 + 0.45 * intensity);
  const s = base * c.zoom;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 + c.x * W, H / 2 + c.y * H);
  ctx.rotate((c.rot * Math.PI) / 180);
  ctx.scale(s, s);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.restore();
}