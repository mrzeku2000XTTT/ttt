import React, { useEffect, useRef, useState } from 'react';
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
  selectedMorphId = null,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  // Image layers decode asynchronously — this ticks once a bitmap is ready so
  // the canvas repaints with the real pixels.
  const [assetTick, bumpAssets] = useState(0);

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
    drawScene(ctx, {
      scene, time, W, H, mode, selectedId, grid, selectedMorphId,
      onAssetReady: () => bumpAssets((n) => n + 1),
    });
    ctx.restore();
  }, [scene, time, mode, selectedId, zoom, grid, assetTick, selectedMorphId]);

  const toCanvas = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // The canvas is painted with object-fit: contain, so the frame is
    // letterboxed inside the element — map through the real content box.
    const s = Math.min(rect.width / W, rect.height / H) || 1;
    const dw = W * s;
    const dh = H * s;
    const cx = ((clientX - rect.left - (rect.width - dw) / 2) / dw) * W;
    const cy = ((clientY - rect.top - (rect.height - dh) / 2) / dh) * H;
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
      return;
    }
    if (layer && layer.visible !== false) {
      // A layer that has faded out or drifted off the frame at this point on the
      // timeline can never be grabbed on the canvas — drag it anyway, otherwise
      // no keyframe could be recorded past its own animation.
      const at = sampleLayer(layer, time);
      const grabbable = at.opacity >= 0.05 && at.x >= 0 && at.x <= 1 && at.y >= 0 && at.y <= 1;
      if (!grabbable) {
        startDrag(layer.id, 'move', pt, at);
        e.currentTarget.setPointerCapture?.(e.pointerId);
        return;
      }
    }
    onSelect?.(null);
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
      className={`w-full h-full block object-contain touch-none ${mode === 'edit' ? 'cursor-crosshair' : ''}`}
    />
  );
}