import React, { useEffect, useRef, useState } from 'react';
import { STAGE_DIMS, textBounds } from './lumiflyRender';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Move and resize the type straight on the preview. The box mirrors the frame
 * the renderer settles on: drag its body to place the words, the corner to
 * resize them. Distances are converted back to stage pixels, so the drag feels
 * the same at any preview size.
 */
export default function LumiflyTextDragLayer({ scene, aspect = '16:9', onMove, onScale, onGrab }) {
  const boxRef = useRef(null);
  const drag = useRef(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState(null);

  const dims = STAGE_DIMS[aspect] || STAGE_DIMS['16:9'];
  const bounds = textBounds(scene, dims.w, dims.h);
  const pos = scene.textPos || { x: 0.5, y: 0.5 };

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setScale(el.clientWidth / dims.w || 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [dims.w]);

  useEffect(() => {
    if (!mode) return undefined;
    const onPointerMove = (event) => {
      const d = drag.current;
      if (!d) return;
      if (d.mode === 'move') {
        onMove?.({
          x: clamp(d.pos.x + (event.clientX - d.startX) / (d.dims.w * d.scale), 0.04, 0.96),
          y: clamp(d.pos.y + (event.clientY - d.startY) / (d.dims.h * d.scale), 0.04, 0.96),
        });
      } else {
        const reach = Math.hypot(event.clientX - d.centerX, event.clientY - d.centerY);
        onScale?.(clamp(Math.round(d.fontSize * (reach / d.startDist)), 20, 1200));
      }
    };
    const end = () => {
      drag.current = null;
      setMode(null);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [mode, onMove, onScale]);

  const start = (nextMode) => (event) => {
    if (event.button) return;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    const centerX = rect.left + (bounds.x + bounds.w / 2) * scale;
    const centerY = rect.top + (bounds.y + bounds.h / 2) * scale;
    drag.current = {
      mode: nextMode,
      startX: event.clientX,
      startY: event.clientY,
      pos: { ...pos },
      fontSize: Number(scene.fontSize) || 300,
      centerX,
      centerY,
      startDist: Math.max(24, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      dims,
      scale,
    };
    onGrab?.();
    setMode(nextMode);
  };

  if (!String(scene.text || '').trim()) return null;

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0">
      <div
        className={`absolute rounded border border-dashed transition-colors ${
          mode ? 'border-white/70' : 'border-white/25 hover:border-white/45'
        }`}
        style={{
          left: bounds.x * scale,
          top: bounds.y * scale,
          width: bounds.w * scale,
          height: bounds.h * scale,
        }}
      >
        <div
          onPointerDown={start('move')}
          title="Drag to move the type"
          className="pointer-events-auto absolute inset-0 cursor-move"
        />
        <span
          onPointerDown={start('resize')}
          title="Drag to resize the type"
          className="pointer-events-auto absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-black/50 bg-white/90"
        />
      </div>
    </div>
  );
}