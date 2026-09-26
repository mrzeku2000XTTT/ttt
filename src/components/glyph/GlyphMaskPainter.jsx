import React, { useEffect, useRef, useState } from 'react';

/**
 * The paint surface. Strokes land in the mask canvas (working-source pixels) and
 * are mirrored onto a translucent overlay that sits exactly on top of the
 * artwork, so what you paint is what the effect will cover.
 */
export default function GlyphMaskPainter({ canvasRef, maskRef, brush, erase, onCommit, active }) {
  const overlayRef = useRef(null);
  const rectRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Keep the overlay glued to the artwork, whatever size the stage gives it.
  useEffect(() => {
    if (!active) {
      setReady(false);
      return undefined;
    }
    const overlay = overlayRef.current;
    const art = canvasRef.current;
    if (!overlay || !art) return undefined;
    const host = overlay.offsetParent || overlay.parentElement;
    const sync = () => {
      const a = art.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      if (!a.width || !a.height) return;
      const next = { left: a.left - h.left, top: a.top - h.top, width: a.width, height: a.height };
      rectRef.current = next;
      overlay.style.left = `${next.left}px`;
      overlay.style.top = `${next.top}px`;
      overlay.style.width = `${next.width}px`;
      overlay.style.height = `${next.height}px`;
      const w = Math.round(next.width);
      const hh = Math.round(next.height);
      if (overlay.width !== w || overlay.height !== hh) {
        overlay.width = w;
        overlay.height = hh;
      }
      // repaint the visible mask (a resize wipes the overlay)
      const g = overlay.getContext('2d');
      g.clearRect(0, 0, overlay.width, overlay.height);
      const mask = maskRef.current;
      if (mask && mask.width) {
        g.globalAlpha = 0.5;
        g.drawImage(mask, 0, 0, overlay.width, overlay.height);
        g.globalAlpha = 1;
      }
      setReady(true);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(art);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [active, canvasRef, maskRef]);

  const pointAt = (e) => {
    const r = rectRef.current;
    if (!r || !r.width) return null;
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
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
    dab(overlay.getContext('2d'), overlay.width, overlay.height, 'rgba(107,202,255,0.9)');
  };

  const down = (e) => {
    if (!active) return;
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
      title="Drag to paint where the effect should appear"
    />
  );
}