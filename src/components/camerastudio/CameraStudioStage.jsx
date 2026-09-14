import React, { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import createCameraRenderer from '@/components/camerastudio/cameraStudioRenderer';
import { CAMERA_SIZES } from '@/components/camerastudio/cameraStudioDefaults';
export default function CameraStudioStage({ asset, settings, playing, engineRef, add, upload, busy, onReady, onError }) {
  const canvas = useRef(null), box = useRef(null), latest = useRef({ settings, playing }), start = useRef(0);
  const [bounds, setBounds] = useState([800, 450]), [loading, setLoading] = useState(false), [dragging, setDragging] = useState(false);
  latest.current = { settings, playing };
  useEffect(() => { const observer = new ResizeObserver(([entry]) => setBounds([entry.contentRect.width, entry.contentRect.height])); observer.observe(box.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    let active = true, engine, frame;
    onReady(false); engineRef.current = null;
    if (!asset) { setLoading(false); return; }
    setLoading(true);
    createCameraRenderer(canvas.current, asset.file).then(result => {
      if (!active) { result.dispose(); return; }
      engine = result; engineRef.current = engine; setLoading(false); onReady(true); start.current = performance.now();
      const tick = now => {
        const config = latest.current;
        if (!engine.exporting) engine.draw(config.settings, config.playing ? ((now - start.current) / 1000) % config.settings.duration : 0, config.playing);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }).catch(error => { if (active) { setLoading(false); onError(error.message); } });
    return () => { active = false; cancelAnimationFrame(frame); engine?.dispose(); engineRef.current = null; };
  }, [asset?.id]);
  useEffect(() => {
    start.current = performance.now(); const engine = engineRef.current;
    if (engine?.media.video && !engine.exporting) { if (playing) engine.media.element.play().catch(error => onError(error.message)); else engine.media.element.pause(); }
  }, [playing, loading]);
  const size = CAMERA_SIZES[settings.ratio], ratio = size[0] / size[1], width = Math.min(bounds[0], bounds[1] * ratio);
  return <div ref={box} className="relative flex h-full w-full items-center justify-center" onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) add(e.dataTransfer.files); }}>
    <div className="camera-frame" style={{ width, height: width / ratio }}>
      <canvas ref={canvas} aria-label="Live 3D media preview"/>
      {(!asset || dragging) && <button onClick={upload} disabled={busy} className={`camera-empty w-full ${dragging ? 'dragging' : ''}`}><Upload size={26}/><strong>Add images or video</strong><small>Click to browse or drag and drop</small></button>}
      {loading && <div className="camera-stage-loading" role="status"><Loader2 size={22} className="animate-spin"/><span className="ml-2">Preparing media…</span></div>}
    </div>
  </div>;
}