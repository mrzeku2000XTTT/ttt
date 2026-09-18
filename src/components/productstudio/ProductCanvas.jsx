import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import ProductMotion from '@/components/productstudio/ProductMotion';

export default function ProductCanvas({ layers, selected, onSelect, onMove, playing, replay }) {
  const area = useRef(null);
  const startDrag = (event, layer) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = area.current.getBoundingClientRect(), dx = event.clientX - box.left - layer.x, dy = event.clientY - box.top - layer.y;
    const move = (e) => onMove(layer.id, Math.max(0, Math.min(box.width - 80, e.clientX - box.left - dx)), Math.max(0, Math.min(box.height - 80, e.clientY - box.top - dy)));
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end);
  };
  return <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/40 p-5"><div ref={area} className="product-canvas relative aspect-square w-full max-w-[680px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm" onPointerDown={() => onSelect(null)}>{!layers.length && <div className="absolute inset-0 grid place-items-center text-center text-muted-foreground"><div><ImageIcon className="mx-auto mb-3 h-7 w-7" /><p className="text-sm font-medium">Your product canvas</p><p className="mt-1 text-xs">Add an image from the collection</p></div></div>}{layers.map((layer) => <button key={layer.id} onPointerDown={(e) => { e.stopPropagation(); onSelect(layer.id); startDrag(e, layer); }} className={`product-layer absolute cursor-grab overflow-hidden border-2 ${selected === layer.id ? 'border-foreground' : 'border-transparent'}`} style={{ left: layer.x, top: layer.y, width: `${layer.scale}%`, borderRadius: `${layer.radius}px` }}><ProductMotion preset={layer.motion} playing={playing} replay={replay}><img draggable="false" src={layer.url} alt="Product canvas layer" className="block w-full select-none" /></ProductMotion></button>)}</div></div>;
}