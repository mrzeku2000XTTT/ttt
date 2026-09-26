// GLYPH — mask helpers. A mask is a plain canvas the size of the working source:
// opaque where the effect should appear, transparent everywhere else. Nothing
// here touches the picture itself.

export function createMask(width, height) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
}

export function clearMask(canvas) {
  if (!canvas) return;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}