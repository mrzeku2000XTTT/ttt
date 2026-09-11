import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Play, Pause, RotateCcw, Plus, Trash2, Store, Film } from 'lucide-react';
import { shortKaspaAddress } from '@/lib/useKcc20Wallet';
import { MOVES, moveById, drawInto } from './camMoves';

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

  useEffect(() => {
    try { localStorage.setItem(`cam_shots_${address}`, JSON.stringify(shots)); } catch {}
  }, [shots, address]);

  const drawStill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    if (modeRef.current === 'seq' && shotsRef.current.length) {
      const shot = shotsRef.current[seqIdxRef.current % shotsRef.current.length];
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(shot.move), pRef.current, shot.intensity);
    } else {
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(curRef.current.moveId), pRef.current, curRef.current.intensity);
    }
  }, [img]);

  useEffect(() => { if (!playing) { pRef.current = 0; drawStill(); } }, [img, moveId, intensity, mode, seqIdx, playing, drawStill]);

  // animation loop — advances the virtual camera through the active move / sequence
  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      const canvas = canvasRef.current;
      if (!playingRef.current || !img || !canvas) return;
      const seqMode = modeRef.current === 'seq' && shotsRef.current.length > 0;
      const active = seqMode
        ? shotsRef.current[seqIdxRef.current % shotsRef.current.length]
        : { move: curRef.current.moveId, intensity: curRef.current.intensity, duration: curRef.current.duration };
      pRef.current += dt / Math.max(0.5, active.duration || 4);
      if (pRef.current >= 1) {
        pRef.current = 0;
        if (seqMode) { seqIdxRef.current = (seqIdxRef.current + 1) % shotsRef.current.length; setSeqIdx(seqIdxRef.current); }
      }
      drawInto(canvas.getContext('2d'), CW, CH, img, moveById(active.move), pRef.current, active.intensity);
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
      drawInto(ctx, fw, fh, img, move, k / 3, intensity);
      ctx.restore();
    });
    const a = document.createElement('a');
    a.download = `cam-${moveId}-storyboard.png`;
    a.href = off.toDataURL('image/png');
    a.click();
  };

  const currentMove = moveById(mode === 'seq' && shots.length ? shots[seqIdx % shots.length]?.move || moveId : moveId);

  return (
    <div className="cm-page flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
        <button onClick={onHome} className="flex items-center gap-2" title="Back to landing">
          <img src={LOGO} alt="CAM" className="h-7 w-7 rounded-md" />
          <span className="text-base font-bold tracking-tight">C<span className="text-[hsl(var(--cm-accent))]">AM</span></span>
        </button>
        <div className="cm-glass flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cm-accent))]" />
          <span className="font-mono text-[hsl(var(--cm-muted))]">{shortKaspaAddress(address)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="cm-btn"><Upload className="w-4 h-4" /> Upload</button>
          <button onClick={downloadStoryboard} disabled={!img} className="cm-btn cm-btn-primary disabled:opacity-40"><Download className="w-4 h-4" /> Storyboard PNG</button>
          <button onClick={() => navigate('/AppStoreV2')} className="cm-btn" title="Exit to Store"><Store className="w-4 h-4" /> Exit</button>
        </div>
      </header>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ── stage ── */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
          <canvas ref={canvasRef} width={CW} height={CH} className="max-h-full max-w-full rounded-xl border border-white/10 shadow-2xl" />
          {!img && (
            <button onClick={() => fileRef.current?.click()} className="absolute flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-black/60 px-12 py-16 text-center transition hover:border-[hsl(var(--cm-accent))]/60 hover:bg-black/70">
              <span className="text-3xl">🎬</span>
              <span className="text-sm font-medium">Drop, paste, or upload an image to direct</span>
              <span className="text-xs text-[hsl(var(--cm-muted))]">The camera moves once your image is on set</span>
            </button>
          )}
          {/* controls */}
          <div className="flex w-full max-w-[960px] flex-wrap items-center gap-3">
            <button onClick={togglePlay} disabled={!img} className="cm-btn cm-btn-primary disabled:opacity-40">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={restart} disabled={!img} className="cm-btn disabled:opacity-40"><RotateCcw className="w-4 h-4" /> Restart</button>
            <div className="cm-glass min-w-[140px] flex-1 overflow-hidden rounded-full">
              <div ref={barRef} className="h-1.5 rounded-full bg-[hsl(var(--cm-accent))] transition-none" style={{ width: '0%' }} />
            </div>
            <span className="text-xs text-[hsl(var(--cm-muted))]">{currentMove.label} · {mode === 'seq' && shots.length ? `Shot ${seqIdx + 1}/${shots.length}` : `${duration}s`}</span>
          </div>
        </div>

        {/* ── control room ── */}
        <aside className="flex min-h-0 w-full flex-col gap-4 overflow-y-auto border-white/10 p-4 lg:w-80 lg:border-l">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--cm-muted))]">Camera moves</p>
            <div className="grid grid-cols-2 gap-2">
              {MOVES.map((m) => (
                <button key={m.id} onClick={() => { setMoveId(m.id); setMode('move'); }} title={m.feel}
                  className={`cm-tool ${moveId === m.id && mode === 'move' ? 'cm-tool-active' : ''}`}>
                  <span className="text-xs font-medium">{m.label}</span>
                  <span className="text-[10px] text-[hsl(var(--cm-muted))]">{m.feel}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--cm-muted))]"><span>Intensity</span><span className="text-[hsl(var(--cm-fg))]">{Math.round(intensity * 100)}%</span></div>
              <input type="range" min="0.1" max="1" step="0.05" value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-[hsl(var(--cm-accent))]" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--cm-muted))]"><span>Duration</span><span className="text-[hsl(var(--cm-fg))]">{duration}s</span></div>
              <input type="range" min="1" max="10" step="0.5" value={duration} onChange={(e) => setDuration(+e.target.value)} className="w-full accent-[hsl(var(--cm-accent))]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--cm-muted))]">Shot sequence</p>
              {shots.length > 0 && <button onClick={playSequence} disabled={!img} className="cm-btn px-3 py-1 disabled:opacity-40"><Film className="w-3.5 h-3.5" /> Play all</button>}
            </div>
            <button onClick={addShot} disabled={!img} className="cm-btn cm-btn-primary w-full justify-center disabled:opacity-40"><Plus className="w-4 h-4" /> Add current move as shot</button>
            {shots.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-[hsl(var(--cm-muted))]">No shots yet — dial in a move and add it. Shots play back-to-back and loop.</p>
            ) : (
              <ul className="space-y-1.5">
                {shots.map((s, idx) => (
                  <li key={s.id}>
                    <button onClick={() => loadShot(s)} title="Load into controls"
                      className={`cm-tool w-full flex-row items-center ${mode === 'seq' && idx === seqIdx ? 'cm-tool-active' : ''}`}>
                      <span className="flex w-full items-center gap-2 text-xs">
                        <span className="text-[10px] text-[hsl(var(--cm-accent))]">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="font-medium">{moveById(s.move).label}</span>
                        <span className="text-[10px] text-[hsl(var(--cm-muted))]">{s.duration}s · {Math.round(s.intensity * 100)}%</span>
                        <span
                          onClick={(e) => { e.stopPropagation(); setShots((prev) => prev.filter((x) => x.id !== s.id)); }}
                          className="ml-auto rounded p-1 text-[hsl(var(--cm-muted))] hover:text-red-400" title="Delete shot">
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}