import React, { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import createCameraRenderer from '@/components/camerastudio/cameraStudioRenderer';
import CameraFocusOverlay from '@/components/camerastudio/CameraFocusOverlay';
import CameraAssetOverlay from '@/components/camerastudio/CameraAssetOverlay';
import CameraMotionPenOverlay from '@/components/camerastudio/CameraMotionPenOverlay';
import { CAMERA_SIZES } from '@/components/camerastudio/cameraStudioDefaults';
import { layerTransformAt } from '@/components/camerastudio/cameraLayerAnimation';
import { cameraTransformAt } from '@/components/camerastudio/cameraTransformAnimation';
import CameraXYZOverlay from '@/components/camerastudio/CameraXYZOverlay';
export default function CameraStudioStage({ asset, assets, selected, settings, playing, engineRef, add, upload, busy, onReady, onError, interestPoints, overlayPoints, playhead, onTime, armed, activePointId, onSelectPoint, onPlacePoint, onPreviewPoint, onMovePoint, showFocus, layersEditable, selectAsset, previewAsset, commitAsset, drawMode, onDrawPath, cameraKeyframes, showXYZ }) {
  const canvas = useRef(null), box = useRef(null), latest = useRef({ settings, playing, interestPoints, playhead, assets, cameraKeyframes }), start = useRef(0), lastTimeUpdate = useRef(0);
  const [bounds, setBounds] = useState([800, 450]), [loading, setLoading] = useState(false), [dragging, setDragging] = useState(false);
  latest.current = { settings, playing, interestPoints, playhead, assets, cameraKeyframes };
  useEffect(() => { const observer = new ResizeObserver(([entry]) => setBounds([entry.contentRect.width, entry.contentRect.height])); observer.observe(box.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    let active = true, engine, frame;
    onReady(false); engineRef.current = null;
    if (!asset) { setLoading(false); return; }
    setLoading(true);
    createCameraRenderer(canvas.current, assets).then(result => {
      if (!active) { result.dispose(); return; }
      engine = result; engineRef.current = engine; setLoading(false); onReady(true); start.current = performance.now();
      const tick = now => {
        const config = latest.current;
        const currentTime = config.playing ? ((now - start.current) / 1000) % config.settings.duration : config.playhead;
        if (!engine.exporting) engine.draw(config.settings, currentTime, config.settings.mode === 'video', config.interestPoints, config.assets, config.cameraKeyframes);
        if (config.playing && now - lastTimeUpdate.current > 32) { lastTimeUpdate.current = now; onTime(currentTime); }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }).catch(error => { if (active) { setLoading(false); onError(error.message); } });
    return () => { active = false; cancelAnimationFrame(frame); engine?.dispose(); engineRef.current = null; };
  }, [assets.map(item => item.id).join(':')]);
  useEffect(() => {
    start.current = performance.now() - playhead * 1000; const engine = engineRef.current;
    if (!engine?.exporting) engine?.medias.forEach(media => { if (!media.video) return; if (playing) media.element.play().catch(error => onError(error.message)); else media.element.pause(); });
  }, [playing, loading]);
  useEffect(() => {
    const medias = engineRef.current?.medias || [];
    if (!playing) medias.forEach(media => { if (media.video && Number.isFinite(media.element.duration)) media.element.currentTime = Math.min(playhead, Math.max(0, media.element.duration - .01)); });
  }, [playhead, playing]);
  const size = CAMERA_SIZES[settings.ratio], ratio = size[0] / size[1], stageH = Math.max(120, bounds[1] - (showXYZ ? 42 : 0)), width = Math.min(bounds[0], stageH * ratio), overlayAssets = assets.map(item => ({ ...item, transform: item.previewing ? item.transform : layerTransformAt(item, playhead, settings.easing) }));
  return <div ref={box} className="relative flex h-full w-full items-center justify-center" onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) add(e.dataTransfer.files); }}>
    <div className="camera-stage-col">
    {showXYZ && <CameraXYZOverlay transform={cameraTransformAt(settings, cameraKeyframes, playhead, true)} time={playhead}/>}
    <div className="camera-frame" style={{ width, height: width / ratio }}>
      <canvas ref={canvas} aria-label="Live 3D media preview"/>
      {asset && <CameraMotionPenOverlay active={drawMode} onComplete={onDrawPath}/>}
      {asset && layersEditable && <CameraAssetOverlay assets={overlayAssets} aspects={engineRef.current?.aspects || {}} ratio={settings.ratio} selected={selected} select={selectAsset} preview={previewAsset} commit={commitAsset}/>} 
      {asset && showFocus && <CameraFocusOverlay points={overlayPoints} activeId={activePointId} armed={armed} onSelect={onSelectPoint} onPlace={onPlacePoint} onPreview={onPreviewPoint} onMove={onMovePoint}/>} 
      {(!asset || dragging) && <button onClick={upload} disabled={busy} className={`camera-empty w-full ${dragging ? 'dragging' : ''}`}><Upload size={26}/><strong>Add images or video</strong><small>Click to browse or drag and drop</small></button>}
      {loading && <div className="camera-stage-loading" role="status"><Loader2 size={22} className="animate-spin"/><span className="ml-2">Preparing media…</span></div>}
    </div>
    </div>
  </div>;
}