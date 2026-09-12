import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moveById, drawInto } from './camMoves';
import CamTopBar from './CamTopBar';
import CamViewerDeck from './CamViewerDeck';
import CamTransport from './CamTransport';
import CamInspector from './CamInspector';
import CamShotStrip from './CamShotStrip';
import CamNodeGraph from './CamNodeGraph';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/154c8ae70_generated_image.png';
const CW = 1280, CH = 720;

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
  const [seqIdx, setSeqIdx] = useState(0);
  const [shots, setShots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cam_shots_${address}`)) || []; } catch { return []; }
  });

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
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ni = new Image();
      ni.onload = () => { setImg(ni); pRef.current = 0; };
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

  const currentMove = moveById(mode === 'seq' && shots.length ? shots[seqIdx % shots.length]?.move || moveId : moveId);

  return (
    <div className="cm-page cm-fusion-shell">
      <CamTopBar logo={LOGO} address={address} onHome={onHome} onUpload={() => fileRef.current?.click()} onDownload={downloadStoryboard} onExit={() => navigate('/AppStoreV2')} canExport={!!img} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <div className="cm-fusion-work">
        <main className="cm-fusion-center">
          <CamViewerDeck canvasRef={canvasRef} image={img} getFrame={getFrame} label={`${currentMove.label} · ${Math.round(intensity * 100)}% · ${duration}s`} onUpload={() => fileRef.current?.click()} onFile={handleFile} />
          <CamTransport playing={playing} canPlay={!!img} onPlay={togglePlay} onRestart={restart} barRef={barRef} zoom={viewZoom} setZoom={setViewZoom} label={mode === 'seq' && shots.length ? `Shot ${seqIdx + 1}/${shots.length}` : `${duration}s`} />
          <div className="cm-fusion-lower">
            <CamShotStrip shots={shots} activeIndex={seqIdx} onAdd={addShot} onPlay={playSequence} onLoad={loadShot} onDelete={(id) => setShots((items) => items.filter((shot) => shot.id !== id))} canUse={!!img} />
            <CamNodeGraph image={img} moveLabel={currentMove.label} intensity={intensity} duration={duration} />
          </div>
        </main>
        <CamInspector moveId={moveId} setMoveId={setMoveId} setMode={setMode} intensity={intensity} setIntensity={setIntensity} duration={duration} setDuration={setDuration} />
      </div>
    </div>
  );
}