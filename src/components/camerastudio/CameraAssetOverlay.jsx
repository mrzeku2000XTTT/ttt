import React, { useRef, useState } from 'react';
import { CAMERA_SIZES } from '@/components/camerastudio/cameraStudioDefaults';
const frameBox = (asset, aspect, ratio) => {
  const frameAspect = CAMERA_SIZES[ratio][0] / CAMERA_SIZES[ratio][1], scale = asset.transform?.scale || 1;
  const height = Math.min(67, 76 * frameAspect / aspect) * scale, width = height * aspect / frameAspect;
  return { left: 50 + (asset.transform?.x || 0) * 100, top: 50 + (asset.transform?.y || 0) * 100, width, height, rotate: asset.transform?.rotation || 0 };
};
export default function CameraAssetOverlay({ assets, aspects, ratio, selected, select, preview, commit }) {
  const [drag, setDrag] = useState(null), last = useRef(null);
  const begin = (event, asset, resize = false) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); select(asset.id); setDrag({ id: asset.id, startX: event.clientX, startY: event.clientY, initial: { x: 0, y: 0, scale: 1, rotation: 0, ...asset.transform }, resize }); };
  const move = event => { if (!drag) return; const rect = event.currentTarget.closest('.camera-frame').getBoundingClientRect(), dx = (event.clientX - drag.startX) / rect.width, dy = (event.clientY - drag.startY) / rect.height; const next = drag.resize ? { ...drag.initial, scale: Math.max(.15, Math.min(4, drag.initial.scale + Math.max(dx, dy) * 3)) } : { ...drag.initial, x: Math.max(-.9, Math.min(.9, drag.initial.x + dx)), y: Math.max(-.9, Math.min(.9, drag.initial.y + dy)) }; last.current = next; preview(drag.id, next); };
  const end = event => { if (!drag) return; event.stopPropagation(); commit(drag.id, last.current || drag.initial); last.current = null; setDrag(null); };
  return <div className="camera-assets-overlay">{assets.map(asset => { const box = frameBox(asset, aspects[asset.id] || 16 / 9, ratio); return <div key={asset.id} className={`camera-layer-box ${selected === asset.id ? 'is-selected' : ''}`} style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`, transform: `translate(-50%,-50%) rotate(${box.rotate}deg)` }} onPointerDown={event => begin(event, asset)} onPointerMove={move} onPointerUp={end}>{selected === asset.id && <button aria-label="Resize layer" className="camera-layer-resize" onPointerDown={event => begin(event, asset, true)} onPointerMove={move} onPointerUp={end}/>}</div>; })}</div>;
}