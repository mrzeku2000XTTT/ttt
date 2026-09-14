// Renders a Camera Studio text layer into a wide plate with the oversize
// tight-crop look from the reference: white geometric type, letters larger
// than the plate (ascenders crop at the top), baseline hugging the bottom
// edge, and the tail letter cropped off the right side.
export function renderCameraTextCanvas(asset) {
  const canvas = document.createElement('canvas');
  canvas.width = 2560;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const text = String(asset?.text || 'Text').slice(0, 60) || 'Text';
  const family = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  let size = 1500;
  ctx.font = `900 ${size}px ${family}`;
  const width = ctx.measureText(text).width || 1;
  if (width < canvas.width * 1.06) size = Math.round(size * canvas.width * 1.06 / width);
  ctx.font = `900 ${size}px ${family}`;
  ctx.fillText(text, -Math.round(canvas.width * 0.03), canvas.height - 48);
  return canvas;
}

// Matches the loadCameraMedia contract so text layers run through the same renderer.
export function loadTextMedia(asset) {
  const canvas = renderCameraTextCanvas(asset);
  return { element: canvas, video: false, width: canvas.width, height: canvas.height, dispose() {} };
}