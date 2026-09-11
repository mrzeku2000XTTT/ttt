import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KanvasToolbar from './KanvasToolbar';

export default function KanvasStudio({ address, onHome }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [img, setImg] = useState(null);          // HTMLImageElement
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#00ff99');
  const [size, setSize] = useState(5);
  const [drawing, setDrawing] = useState(null);   // current in-progress annotation
  const [cropping, setCropping] = useState(false);

  // Load image onto canvas
  const drawAll = useCallback((image, anns, current) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    [...anns, current].filter(Boolean).forEach((a) => drawAnnotation(ctx, a));
    if (current && current.type === 'crop') drawCropGuide(ctx, current);
  }, []);

  useEffect(() => { drawAll(img, annotations, drawing); }, [img, annotations, drawing, drawAll]);

  // Pointer → image coords
  const toImg = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const onDown = (e) => {
    if (!img) return;
    e.preventDefault();
    const p = toImg(e);
    setRedoStack([]);
    if (tool === 'text') {
      const text = window.prompt('Annotation text:');
      if (text) commit({ type: 'text', color, size, x: p.x, y: p.y, text });
      return;
    }
    setDrawing(startStroke(tool, p, color, size));
    if (tool === 'crop') setCropping(true);
  };
  const onMove = (e) => {
    if (!drawing) return;
    const p = toImg(e);
    setDrawing((d) => updateStroke(d, p));
  };
  const onUp = () => {
    if (!drawing) return;
    if (drawing.type === 'crop') { setDrawing(null); return; } // wait for Apply
    commit(drawing);
    setDrawing(null);
  };
  const commit = (a) => { setAnnotations((prev) => [...prev, a]); };
  const undo = () => { setAnnotations((prev) => { if (!prev.length) return prev; setRedoStack((r) => [...r, prev[prev.length - 1]]); return prev.slice(0, -1); }); };
  const redo = () => { setRedoStack((r) => { if (!r.length) return r; const last = r[r.length - 1]; setAnnotations((p) => [...p, last]); return r.slice(0, -1); }); };
  const clearAll = () => { setAnnotations([]); setRedoStack([]); };

  const applyCrop = () => {
    if (!drawing || drawing.type !== 'crop') { setCropping(false); return; }
    const x = Math.min(drawing.x, drawing.x2), y = Math.min(drawing.y, drawing.y2);
    const w = Math.abs(drawing.x2 - drawing.x), h = Math.abs(drawing.y2 - drawing.y);
    if (w < 8 || h < 8) { setDrawing(null); setCropping(false); return; }
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    off.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
    const ni = new Image();
    ni.onload = () => { setImg(ni); setAnnotations([]); setRedoStack([]); setDrawing(null); setCropping(false); };
    ni.src = off.toDataURL('image/png');
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ni = new Image();
      ni.onload = () => { setImg(ni); setAnnotations([]); setRedoStack([]); };
      ni.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (const it of items) if (it.type.startsWith('image/')) { handleFile(it.getAsFile()); break; }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const exportPng = () => {
    if (!img) return;
    drawAll(img, annotations, null);
    const a = document.createElement('a');
    a.download = 'kanvas-edit.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      <KanvasToolbar
        tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize}
        onUndo={undo} onRedo={redo} onClear={clearAll} onExport={exportPng}
        onUpload={() => fileRef.current?.click()} onApplyCrop={applyCrop} cropping={cropping}
        canUndo={annotations.length > 0} canRedo={redoStack.length > 0} hasImage={!!img}
        address={address} onHome={onHome} onExit={() => navigate('/AppStoreV2')} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
        {img ? (
          <canvas
            ref={canvasRef}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={(e) => onDown(e.touches[0])} onTouchMove={(e) => onMove(e.touches[0])} onTouchEnd={onUp}
            className="max-h-full max-w-full rounded-xl border border-white/10 shadow-2xl"
            style={{ cursor: tool === 'crop' ? 'crosshair' : 'crosshair', touchAction: 'none' }}
          />
        ) : (
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/15 px-12 py-16 text-center transition hover:border-[hsl(var(--kv-accent))]/60 hover:bg-white/5">
            <span className="text-3xl">🖼️</span>
            <span className="text-sm font-medium">Drop, paste, or upload an image to start</span>
            <span className="text-xs text-white/40">PNG · JPG · WebP — markup, crop & export</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── drawing helpers ── */
function startStroke(tool, p, color, size) {
  if (tool === 'brush') return { type: 'brush', color, width: size, points: [p] };
  if (tool === 'crop') return { type: 'crop', color, x: p.x, y: p.y, x2: p.x, y2: p.y };
  return { type: tool, color, width: size, x: p.x, y: p.y, x2: p.x, y2: p.y };
}
function updateStroke(d, p) {
  if (d.type === 'brush') return { ...d, points: [...d.points, p] };
  return { ...d, x2: p.x, y2: p.y };
}
function drawAnnotation(ctx, a) {
  if (!a) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = a.width || 4;
  if (a.type === 'brush') {
    ctx.beginPath();
    a.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  } else if (a.type === 'rect') {
    ctx.strokeRect(Math.min(a.x, a.x2), Math.min(a.y, a.y2), Math.abs(a.x2 - a.x), Math.abs(a.y2 - a.y));
  } else if (a.type === 'ellipse') {
    const cx = (a.x + a.x2) / 2, cy = (a.y + a.y2) / 2, rx = Math.abs(a.x2 - a.x) / 2, ry = Math.abs(a.y2 - a.y) / 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (a.type === 'arrow') {
    drawArrow(ctx, a.x, a.y, a.x2, a.y2, a.width);
  } else if (a.type === 'text') {
    ctx.font = `600 ${a.size * 4}px Space Grotesk, sans-serif`;
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(a.text, a.x, a.y);
    ctx.fillText(a.text, a.x, a.y);
  }
}
function drawArrow(ctx, x1, y1, x2, y2, w) {
  const head = Math.max(10, (w || 4) * 3);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
  ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
  ctx.stroke();
}
function drawCropGuide(ctx, a) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clearRect(Math.min(a.x, a.x2), Math.min(a.y, a.y2), Math.abs(a.x2 - a.x), Math.abs(a.y2 - a.y));
  ctx.strokeStyle = '#00ff99'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
  ctx.strokeRect(Math.min(a.x, a.x2), Math.min(a.y, a.y2), Math.abs(a.x2 - a.x), Math.abs(a.y2 - a.y));
  ctx.restore();
}