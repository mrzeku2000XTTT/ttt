import React, { useEffect, useRef, useState } from 'react';
import { Download, RotateCw, Loader2 } from 'lucide-react';
import { exportFilm } from '../framezExport';

// The live film stage — coded film playing in a same-origin srcdoc iframe,
// plus replay and MP4/WebM export.
export default function FramezStage({ doc, film }) {
  const iframeRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Render the iframe at full internal resolution (W×H) and CSS-scale it to
  // fit the column — keeps the preview crisp on any width AND lets html2canvas
  // capture full-res frames for a real MP4 export.
  useEffect(() => {
    if (!wrapRef.current || !film?.W) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setScale(w / film.W);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [film?.W]);

  const replay = () => iframeRef.current?.contentWindow?.FzReplay?.();

  const download = async () => {
    if (!iframeRef.current || exporting) return;
    setExporting(true);
    setError('');
    setProgress(0);
    try {
      const { blob, ext } = await exportFilm(iframeRef.current, (p, frac) => {
        setPhase(p === 'capture' ? 'Capturing frames' : 'Encoding video');
        setProgress(frac);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(film?.title || 'framez-film').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-framez.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      setError('Export failed — keep this tab in the foreground and try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!doc) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] aspect-video flex flex-col items-center justify-center text-center px-8">
        <div className="text-sm font-bold text-white/60 mb-1">The stage is dark</div>
        <div className="text-xs text-white/35">Describe a film on the left — the agent will code it shot by shot.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{film.title}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/35">
            {film.aspect} · {film.shots.length} coded shots
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={replay}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-all text-xs font-medium"
          >
            <RotateCw className="w-3.5 h-3.5" /> Replay
          </button>
          <button
            onClick={download}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-50 transition-all text-xs font-semibold"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? 'Exporting…' : 'Export video'}
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="rounded-xl overflow-hidden bg-black mx-auto border border-white/10"
        style={film.aspect === '9:16' ? { height: '56vh', aspectRatio: '9 / 16' } : { width: '100%', aspectRatio: '16 / 9' }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={doc}
          title="Framez film"
          style={{ border: 0, width: film.W, height: film.H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        />
      </div>

      {exporting && (
        <div>
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-1">
            <span>{phase} — keep this tab in the foreground</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      {error && <div className="text-[11px] text-red-400">{error}</div>}
    </div>
  );
}