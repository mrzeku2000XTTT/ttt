import React, { useEffect, useRef, useState } from 'react';

// The overlay's own opacity does the softening, so strokes are laid down solid:
// overlapping dabs then read as one even wash instead of building up to an
// opaque block over the artwork.
const PAINT = '#6bcaff';

// The mask is white — recolour it through its own alpha so a repaint matches the
// strokes exactly.
function paintOverlay(overlay, mask) {
  const g = overlay.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, overlay.width, overlay.height);
  if (!mask || !mask.width) return;
  g.save();
  g.drawImage(mask, 0, 0, overlay.width, overlay.height);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = PAINT;
  g.fillRect(0, 0, overlay.width, overlay.height);
  g.restore();
}

/**
 * The paint surface. It sits inside the artwork's own plane and CSS stretches it
 * over the canvas exactly, so there is no measured position to go stale when the
 * stage, the panels or the scroll position move — the wash can never drift off
 * the picture. The pointer is read straight off the artwork at the moment of the
 * stroke, so the brush lands under the cursor wherever the picture happens to be.
 * Strokes go into the mask canvas (working-source pixels); the picture itself is
 * never touched.
 */
export default function GlyphMaskPainter({ canvasRef, maskRef, brush, erase, onCommit, active }) {
  const overlayRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const [ready, setReady] = useState(false);

  // The overlay carries the mask at the mask's own resolution, so a stroke lands
  // on the same pixel of both and the wash is a true preview of the effect.
  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    if (!overlay || !mask) return;
    if (overlay.width !== mask.width || overlay.height !== mask.height) {
      overlay.width = mask.width;
      overlay.height = mask.height;
    }
    paintOverlay(overlay, mask);
    setReady(true);
  }, [active, maskRef]);

  // Measured at the moment of the stroke: scrolling the stage, dragging the
  // split, going fullscreen or resizing the window all stay exact.
  const pointAt = (e) => {
    const art = canvasRef.current;
    if (!art) return null;
    const r = art.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  // One dab or segment, drawn at each canvas' own scale so the brush reads the
  // same size on the mask and on screen.
  const stroke = (from, to) => {
    const mask = maskRef.current;
    const overlay = overlayRef.current;
    if (!mask || !overlay) return;
    const dab = (ctx, w, h, color) => {
      const size = Math.max(1, (brush / 100) * w);
      ctx.save();
      ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size;
      if (!erase) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }
      const a = { x: from.x * w, y: from.y * h };
      const b = { x: to.x * w, y: to.y * h };
      ctx.beginPath();
      if (Math.hypot(b.x - a.x, b.y - a.y) < 0.5) {
        ctx.arc(b.x, b.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    };
    dab(mask.getContext('2d'), mask.width, mask.height, '#ffffff');
    dab(overlay.getContext('2d'), overlay.width, overlay.height, PAINT);
  };

  // A stroke only ever starts on the picture itself. Taps that land anywhere
  // else are left alone, so the chrome around the artwork stays usable.
  const onArtwork = (e) => {
    const art = canvasRef.current;
    if (!art) return false;
    const r = art.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };

  const down = (e) => {
    if (!active) return;
    if (!onArtwork(e)) return;
    // the stage below listens for pointers too — painting owns them while it is on
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture is a nicety, not a requirement */
    }
    const p = pointAt(e);
    if (!p) return;
    drawingRef.current = true;
    lastRef.current = p;
    stroke(p, p);
  };

  const move = (e) => {
    if (!drawingRef.current) return;
    e.stopPropagation();
    const p = pointAt(e);
    if (!p) return;
    stroke(lastRef.current || p, p);
    lastRef.current = p;
  };

  const up = (e) => {
    if (!drawingRef.current) return;
    e.stopPropagation();
    drawingRef.current = false;
    lastRef.current = null;
    onCommit?.();
  };

  if (!active) return null;
  return (
    <canvas
      ref={overlayRef}
      className={`glyph-mask ${ready ? '' : 'opacity-0'}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      title="Brush where the ASCII should land — the rest of the picture stays as it is"
    />
  );
}