import React, { useEffect, useRef } from 'react';
import { drawScene, gizmoHandles, hitLayer, sampleLayer } from './morphEngine';

const W = 1280;
const H = 720;

/**
 * One render surface. The same component draws both panes — the only difference
 * is the mode: 'edit' adds the grid, selection box and RGB transform gizmo,
 * 'final' renders exactly what the compositor would output.
 */
export default function MorphStage({
  scene,
  time,
  mode = 'final',
  selectedId = null,
  onSelect,
  onTransform,
  zoom = 1,
  grid = false,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);
    drawScene(ctx, { scene, time, W, H, mode, selectedId, grid });
    ctx.restore();
  }, [scene, time, mode, selectedId, zoom, grid]);

  const toCanvas = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const cy = ((clientY - rect.top) / rect.height) * H;
    return { x: (cx - W / 2) / zoom + W / 2, y: (cy - H / 2) / zoom + H / 2 };
  };

  const startDrag = (id, handle, pt, p) => {
    dragRef.current = {
      id,
      handle,
      start: pt,
      base: { x: p.x, y: p.y, scale: p.scale, cx: p.x * W, cy: p.y * H },
    };
  };

  const onPointerDown = (e) => {
    if (mode !== 'edit') return;
    const pt = toCanvas(e.clientX, e.clientY);
    const layer = scene.layers.find((l) => l.id === selectedId);
    if (layer && layer.visible !== false) {
      const nearest = gizmoHandles(layer, time, W, H)
        .map((h) => ({ ...h, d: Math.hypot(h.x - pt.x, h.y - pt.y) }))
        .sort((a, b) => a.d - b.d)[0];
      if (nearest && nearest.d < 24 / zoom) {
        startDrag(layer.id, nearest.id, pt, sampleLayer(layer, time));
        e.currentTarget.setPointerCapture?.(e.pointerId);
        return;
      }
    }
    const hit = hitLayer(scene, time, pt.x, pt.y, W, H);
    if (hit) {
      onSelect?.(hit);
      startDrag(hit, 'move', pt, sampleLayer(scene.layers.find((l) => l.id === hit), time));
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } else {
      onSelect?.(null);
    }
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const pt = toCanvas(e.clientX, e.clientY);
    const dx = (pt.x - d.start.x) / W;
    const dy = (pt.y - d.start.y) / H;
    if (d.handle === 'move') onTransform?.(d.id, { x: d.base.x + dx, y: d.base.y + dy });
    else if (d.handle === 'x') onTransform?.(d.id, { x: d.base.x + dx });
    else if (d.handle === 'y') onTransform?.(d.id, { y: d.base.y + dy });
    else if (d.handle === 'z') {
      const from = Math.max(40, Math.hypot(d.start.x - d.base.cx, d.start.y - d.base.cy));
      const to = Math.hypot(pt.x - d.base.cx, pt.y - d.base.cy);
      onTransform?.(d.id, { scale: Math.max(0.05, d.base.scale * (to / from)) });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`w-full h-full block touch-none ${mode === 'edit' ? 'cursor-crosshair' : ''}`}
    />
  );
}