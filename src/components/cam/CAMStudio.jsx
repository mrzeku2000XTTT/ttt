import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moveById, drawInto } from './camMoves';
import { base44 } from '@/api/base44Client';
import CamFusionScene from './CamFusionScene';
import CamFusionPanel from './CamFusionPanel';
import { extractLayers } from './fusionExtract';
import CamTopBar from './CamTopBar';
import CamViewerDeck from './CamViewerDeck';
import CamTransport from './CamTransport';
import CamInspector from './CamInspector';
import CamShotStrip from './CamShotStrip';
import CamNodeGraph from './CamNodeGraph';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/154c8ae70_generated_image.png';
const CW = 1280, CH = 720;
const FUSION_W = 4.8;

export default function CAMStudio({ address, onHome }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const barRef = useRef(null);
  const [img, setImg] = useState(null);
  const [moveId, setMoveId] = useState('dolly');
  const [intensity, setIntensity] = useState(0.6);
  const [duration, setDuration] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('move'); // 'move' | 'seq'
  const [viewZoom, setViewZoom] = useState(0.85); // framing zoom — zoomed out a touch by default
  const [splitPct, setSplitPct] = useState(50); // viewer split — 2D vs 3D pane sizes
  const [maxPane, setMaxPane] = useState(null); // 'media' | 'camera' | 'nodes' | null
  const [seqIdx, setSeqIdx] = useState(0);
  const [shots, setShots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_shots_${address}`)) || []; } catch { return []; }
  });
  const [fusionOn, setFusionOn] = useState(false);
  const [fusionBusy, setFusionBusy] = useState(false);
  const [fusionElapsed, setFusionElapsed] = useState(0);
  const [fusionError, setFusionError] = useState('');
  const [fusionSel, setFusionSel] = useState(null);
  const [fusionLayers, setFusionLayers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_fusion_${address}`)) || []; } catch { return []; }
  });
  const fusionFileRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 1280, h: 720 });

  // refs mirrored for the animation loop
  const playingRef = useRef(false); playingRef.current = playing;
  const modeRef = useRef(mode); modeRef.current = mode;
  const shotsRef = useRef(shots); shotsRef.current = shots;
  const seqIdxRef = useRef(0);
  const pRef = useRef(0);
  const curRef = useRef({}); curRef.current = { moveId, intensity, duration };
  const viewZoomRef = useRef(0.85); viewZoomRef.current = viewZoom;

  // shared frame reader — the 3D rig view animates from the exact same virtual camera state
  const getFrame = useCallback(() => {
    const seqMode = modeRef.current === 'seq' && shotsRef.current.length > 0;
    const active = seqMode
      ? shotsRef.current[seqIdxRef.current % shotsRef.current.length]
      : curRef.current;
    return { move: moveById(active.move || active.moveId), intensity: active.intensity, p: pRef.current };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(`cam_shots_${address}`, JSON.stringify(shots)); } catch {}
  }, [shots, address]);
  useEffect(() => {
    try { localStorage.setItem(`cam_fusion_${address}`, JSON.stringify(fusionLayers)); } catch {}
  }, [fusionLayers, address]);

  const drawStill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    if (modeRef.current === 'seq' && shotsRef.current.length) {
      const shot = shotsRef.current[seqIdxRef.current % shotsRef.current.length];
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(shot.move), pRef.current, shot.intensity, viewZoomRef.current);
    } else {
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(curRef.current.moveId), pRef.current, curRef.current.intensity, viewZoomRef.current);
    }
  }, [img]);

  useEffect(() => { if (!playing) { pRef.current = 0; drawStill(); } }, [img, moveId, intensity, mode, seqIdx, playing, drawStill, viewZoom]);

  // animation loop — advances the virtual camera through the active move / sequence
  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      if (!playingRef.current || !img) return;
      const seqMode = modeRef.current === 'seq' && shotsRef.current.length > 0;
      const active = seqMode
        ? shotsRef.current[seqIdxRef.current % shotsRef.current.length]
        : { move: curRef.current.moveId, intensity: curRef.current.intensity, duration: curRef.current.duration };
      pRef.current += dt / Math.max(0.5, active.duration || 4);
      if (pRef.current >= 1) {
        pRef.current = 0;
        if (seqMode) { seqIdxRef.current = (seqIdxRef.current + 1) % shotsRef.current.length; setSeqIdx(seqIdxRef.current); }
      }
      const canvas = canvasRef.current;
      if (canvas) drawInto(canvas.getContext('2d'), CW, CH, img, moveById(active.move), pRef.current, active.intensity, viewZoomRef.current);
      if (barRef.current) barRef.current.style.width = `${pRef.current * 100}%`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [img]);

  const handleFile = (file) => {
    if (!file) return;
    fusionFileRef.current = file;
    setFusionLayers([]); setFusionSel(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ni = new Image();
      ni.onload = () => { setImg(ni); setImgSize({ w: ni.naturalWidth, h: ni.naturalHeight }); pRef.current = 0; };
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

  const togglePlay = () => { if (img) setPlaying((v) => !v); };
  const restart = () => {
    pRef.current = 0; seqIdxRef.current = 0; setSeqIdx(0);
    if (!playing) drawStill();
    if (barRef.current) barRef.current.style.width = '0%';
  };
  const playSequence = () => {
    if (!img || !shots.length) return;
    setMode('seq'); pRef.current = 0; seqIdxRef.current = 0; setSeqIdx(0); setPlaying(true);
  };
  const addShot = () => setShots((prev) => [...prev, { id: Date.now(), move: moveId, intensity, duration }]);
  const loadShot = (shot) => {
    setMode('move'); setMoveId(shot.move); setIntensity(shot.intensity); setDuration(shot.duration);
  };
  const downloadStoryboard = () => {
    if (!img) return;
    const fw = 480, fh = 270;
    const off = document.createElement('canvas');
    off.width = fw * 4; off.height = fh;
    const ctx = off.getContext('2d');
    const move = moveById(moveId);
    [0, 1, 2, 3].forEach((k) => {
      ctx.save();
      ctx.translate(fw * k, 0);
      ctx.beginPath(); ctx.rect(0, 0, fw, fh); ctx.clip();
      drawInto(ctx, fw, fh, img, move, k / 3, intensity, viewZoomRef.current);
      ctx.restore();
    });
    const a = document.createElement('a');
    a.download = `cam-${moveId}-storyboard.png`;
    a.href = off.toDataURL('image/png');
    a.click();
  };

  // Fusion mode — explode the uploaded image into individual 3D layers
  const toggleFusion = () => { setMaxPane(null); if (!fusionOn) setPlaying(false); setFusionOn(!fusionOn); };
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMaxPane(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const decompose = async () => {
    const file = fusionFileRef.current;
    if (!file || fusionBusy) return;
    setFusionError(''); setFusionBusy(true); setFusionElapsed(0);
    const tick = setInterval(() => setFusionElapsed((s) => s + 1), 1000);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 86400 });
      const res = await base44.functions.invoke('metaMimicClone', { imageUrl: signed_url, cloneMode: true, imageWidth: imgSize.w, imageHeight: imgSize.h });
      const html = res?.data?.html;
      if (!html) throw new Error(res?.data?.error || 'Could not decompose this image.');
      const raw = await extractLayers(html, imgSize.w, imgSize.h);
      const scale = FUSION_W / imgSize.w;
      const layers = raw.map((l, i) => {
        const pos = { x: (l.x + l.w / 2 - imgSize.w / 2) * scale, y: -(l.y + l.h / 2 - imgSize.h / 2) * scale, z: 0.014 * i };
        return { ...l, id: `f${i}`, scale, pos, base: pos };
      });
      setFusionLayers(layers); setFusionSel(null);
    } catch (err) {
      setFusionError(err?.message || 'Decomposition failed. Please try again.');
    }
    clearInterval(tick); setFusionBusy(false);
  };
  const commitFusionPos = (id, pos) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos } : l)));
  const setFusionPos = (id, axis, value) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos: { ...l.pos, [axis]: value } } : l)));
  const resetFusionPos = (id) => setFusionLayers((items) => items.map((l) => (l.id === id ? { ...l, pos: { ...l.base } } : l)));

  const currentMove = moveById(mode === 'seq' && shots.length ? shots[seqIdx % shots.length]?.move || moveId : moveId);

  if (fusionOn) {
    return (
      <div className="cm-page cm-fusion-shell">
        <CamTopBar logo={LOGO} address={address} onHome={onHome} onUpload={() => fileRef.current?.click()} onDownload={downloadStoryboard} onExit={() => navigate('/AppStoreV2')} canExport={!!img} fusionOn={fusionOn} onToggleFusion={toggleFusion} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="cm-fusion-work">
          <main className="cm-fusion-center">
            <section className="cm-viewer" style={{ flex: 1 }}>
              <div className="cm-viewer-title"><span>Fusion1</span><span>3D Composite</span></div>
              <div className="cm-viewer-body">
                <CamFusionScene image={img} layers={fusionLayers} selectedId={fusionSel} onSelect={setFusionSel} onCommit={commitFusionPos} />
              </div>
            </section>
          </main>
          <CamFusionPanel hasImage={!!img} busy={fusionBusy} elapsed={fusionElapsed} error={fusionError} layers={fusionLayers} selectedId={fusionSel} onSelect={setFusionSel} onDecompose={decompose} onPos={setFusionPos} onReset={resetFusionPos} />
        </div>
      </div>
    );
  }

  return (
    <div className={`cm-page cm-fusion-shell ${maxPane === 'nodes' ? 'is-max-nodes' : ''}`}>
      <CamTopBar logo={LOGO} address={address} onHome={onHome} onUpload={() => fileRef.current?.click()} onDownload={downloadStoryboard} onExit={() => navigate('/AppStoreV2')} canExport={!!img} fusionOn={fusionOn} onToggleFusion={toggleFusion} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <div className="cm-fusion-work">
        <main className="cm-fusion-center">
          <CamViewerDeck canvasRef={canvasRef} image={img} getFrame={getFrame} label={`${currentMove.label} · ${Math.round(intensity * 100)}% · ${duration}s`} onUpload={() => fileRef.current?.click()} onFile={handleFile} split={splitPct} onSplit={setSplitPct} max={maxPane === 'media' || maxPane === 'camera' ? maxPane : null} onMax={setMaxPane} />
          <CamTransport playing={playing} canPlay={!!img} onPlay={togglePlay} onRestart={restart} barRef={barRef} zoom={viewZoom} setZoom={setViewZoom} label={mode === 'seq' && shots.length ? `Shot ${seqIdx + 1}/${shots.length}` : `${duration}s`} />
          <div className="cm-fusion-lower">
            <CamShotStrip shots={shots} activeIndex={seqIdx} onAdd={addShot} onPlay={playSequence} onLoad={loadShot} onDelete={(id) => setShots((items) => items.filter((shot) => shot.id !== id))} canUse={!!img} />
            <CamNodeGraph image={img} moveLabel={currentMove.label} intensity={intensity} duration={duration} isMax={maxPane === 'nodes'} onMax={() => setMaxPane(maxPane === 'nodes' ? null : 'nodes')} />
          </div>
        </main>
        <CamInspector moveId={moveId} setMoveId={setMoveId} setMode={setMode} intensity={intensity} setIntensity={setIntensity} duration={duration} setDuration={setDuration} />
      </div>
    </div>
  );
}