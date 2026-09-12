import { useRef, useState } from 'react';

export default function useCamNodeViewport() {
  const ref = useRef(null), drag = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const point = (e) => { const r = ref.current.getBoundingClientRect(); return { x: (e.clientX - r.left - view.x) / view.zoom, y: (e.clientY - r.top - view.y) / view.zoom }; };
  const zoom = (factor, anchor) => setView((v) => {
    const p = anchor || { x: ref.current.clientWidth / 2, y: ref.current.clientHeight / 2 };
    const z = Math.min(3, Math.max(0.15, v.zoom * factor));
    return { x: p.x - (p.x - v.x) * z / v.zoom, y: p.y - (p.y - v.y) * z / v.zoom, zoom: z };
  });
  const fit = (nodes) => {
    if (!nodes.length) return setView({ x: 0, y: 0, zoom: 1 });
    const left = Math.min(...nodes.map((n) => n.x)), top = Math.min(...nodes.map((n) => n.y));
    const w = Math.max(...nodes.map((n) => n.x + 160)) - left, h = Math.max(...nodes.map((n) => n.y + 75)) - top;
    const z = Math.min(1.5, Math.max(0.15, Math.min((ref.current.clientWidth - 50) / w, (ref.current.clientHeight - 40) / h)));
    setView({ x: (ref.current.clientWidth - w * z) / 2 - left * z, y: (ref.current.clientHeight - h * z) / 2 - top * z, zoom: z });
  };
  const handlers = {
    onWheel: (e) => { const r = ref.current.getBoundingClientRect(); zoom(Math.exp(-e.deltaY * 0.0015), { x: e.clientX - r.left, y: e.clientY - r.top }); },
    onPointerDown: (e) => { if (e.target.closest('.cm-node')) return; drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y }; e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e) => { const d = drag.current; if (d) setView((v) => ({ ...v, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py })); },
    onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; },
  };
  return { ref, view, point, zoom, fit, handlers };
}