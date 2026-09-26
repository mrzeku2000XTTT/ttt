import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Download,
  FileText,
  Home,
  Image as ImageIcon,
  RefreshCw,
  Settings2,
  Shuffle,
  Sparkles,
  Store,
} from 'lucide-react';
import {
  downloadBlob,
  isAnimated,
  loadImageFromFile,
  prepareSource,
  reconstructionFidelity,
  recordWebm,
  renderStill,
  renderTo,
  stillBlob,
} from './glyphEngine';
import { randomizeParams, STYLES, styleLabel, surpriseParams } from './glyphStyles';
import { paletteById } from './glyphPalettes';
import GlyphStage from './GlyphStage';
import GlyphStyleBar from './GlyphStyleBar';
import GlyphControls from './GlyphControls';
import GlyphExportMenu from './GlyphExportMenu';

const LOGO = 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ecfaf781d_generated_image.png';

export default function GlyphStudio({ onHome, initialFile }) {
  const [img, setImg] = useState(null);
  const [srcUrl, setSrcUrl] = useState(null);
  const [params, setParams] = useState(null);
  const [compare, setCompare] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [reveal, setReveal] = useState(true);
  const revealRef = useRef(true);
  const checkedRef = useRef('');
  const canvasRef = useRef(null);

  const animated = params ? isAnimated(params) : false;
  const source = useMemo(() => (img ? prepareSource(img, animated) : null), [img, animated]);

  /* ── upload: the image transforms the moment it lands ── */
  const accept = useCallback(async (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { img: image, url } = await loadImageFromFile(file);
      setImg(image);
      setSrcUrl(url);
      setParams(randomizeParams(null, {}));
      setCompare(0);
      setControlsOpen(false);
      setNote('');
      revealRef.current = false;
      setReveal(false);
    } catch (e) {
      setError(e.message || 'Could not read that image.');
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    if (initialFile) accept(initialFile);
  }, [initialFile, accept]);

  /* ── render loop ── */
  useEffect(() => {
    if (!source || !params) return undefined;
    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const t = animated ? (performance.now() - start) / 1000 : 0;
      renderTo(canvasRef.current, source, params, t);
      if (animated) raf = requestAnimationFrame(draw);
    };
    draw();
    if (!revealRef.current) {
      revealRef.current = true;
      requestAnimationFrame(() => setReveal(true));
    }
    return () => cancelAnimationFrame(raf);
  }, [source, params, animated]);

  // A render that has lost the picture is worse than a simple one: if the
  // result no longer correlates with the source, fall back to Pixel Art.
  useEffect(() => {
    if (!source || !params || !canvasRef.current || params.style === 'pixel') return;
    const key = `${params.seed}|${params.style}|${params.cellSize}`;
    if (checkedRef.current === key) return;
    checkedRef.current = key;
    if (reconstructionFidelity(source, canvasRef.current, params) < 0.5) {
      setParams((prev) => (prev ? { ...prev, style: 'pixel', palette: 'original', plate: 'auto' } : prev));
      setNote('That style lost the picture, so GLYPH fell back to Pixel Art.');
    }
  }, [source, params]);

  const randomize = useCallback(() => {
    setParams((p) => randomizeParams(p));
    setCompare(0);
  }, []);

  const surprise = useCallback(() => {
    setParams((p) => surpriseParams(p));
    setCompare(0);
  }, []);

  const applyStyle = useCallback((id) => {
    setParams((p) => randomizeParams(p, { style: id, palette: p?.palette }));
    setCompare(0);
  }, []);

  const patch = useCallback((key, value) => {
    setParams((p) => (p ? { ...p, [key]: value } : p));
  }, []);

  const setPalette = useCallback((id) => {
    setParams((p) => (p ? { ...p, palette: id, paletteObj: paletteById(id) } : p));
  }, []);

  const reseed = useCallback(() => {
    setParams((p) => randomizeParams(p, { style: p?.style, palette: p?.palette }));
  }, []);

  /* ── paste from the clipboard ── */
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) {
            accept(f);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [accept]);

  /* ── keyboard: R randomize, S surprise, O original, E export, 1-9 styles ── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'r' || e.key === ' ') {
        e.preventDefault();
        randomize();
      } else if (k === 's') surprise();
      else if (k === 'o') setCompare((c) => (c > 0.5 ? 0 : 1));
      else if (k === 'e') setExportOpen(true);
      else if (k === 'escape') {
        setControlsOpen(false);
        setExportOpen(false);
      } else if (/^[1-9]$/.test(k)) {
        const st = STYLES[Number(k) - 1];
        if (st) applyStyle(st.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [randomize, surprise, applyStyle]);

  /* ── export ── */
  const doExport = async (format, scale) => {
    if (!source || !params) return;
    setBusy(true);
    setError('');
    try {
      if (format === 'webm') {
        const blob = await recordWebm(source, params, 4, 24);
        downloadBlob(blob, `glyph-${params.seed}.webm`);
      } else {
        const canvas = renderStill(source, params, scale);
        const blob = await stillBlob(canvas, format);
        if (blob) downloadBlob(blob, `glyph-${params.seed}-${scale}x.${format}`);
      }
    } catch (e) {
      setError(e.message || 'Export failed.');
    }
    setBusy(false);
    setExportOpen(false);
  };

  const copySeed = () => {
    if (!params) return;
    navigator.clipboard?.writeText(String(params.seed));
  };

  return (
    <div className="glyph-page">
      <header className="sticky top-0 z-40 glyph-glass" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onHome} className="flex items-center gap-2 min-w-0" title="Back to landing">
              <img src={LOGO} alt="GLYPH" className="w-7 h-7 rounded-lg object-cover" />
              <span className="glyph-word text-[13px]">Glyph</span>
            </button>
            <span className="hidden xl:block glyph-muted text-[11px] ml-2">turn any image into visual code</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="glyph-btn glyph-btn-ghost cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  accept(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <button onClick={randomize} disabled={!source} className="glyph-btn glyph-btn-primary">
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Randomize</span>
            </button>
            <button onClick={surprise} disabled={!source} className="glyph-btn glyph-btn-ghost">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Surprise me</span>
            </button>
            <div className="relative">
              <button onClick={() => setExportOpen((v) => !v)} disabled={!source} className="glyph-btn glyph-btn-ghost">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export</span>
              </button>
              <GlyphExportMenu
                open={exportOpen}
                busy={busy}
                animated={animated}
                onClose={() => setExportOpen(false)}
                onExport={doExport}
              />
            </div>
            <button onClick={() => setControlsOpen((v) => !v)} disabled={!source} className="glyph-btn glyph-btn-ghost">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Controls</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 ml-1 pl-2" style={{ borderLeft: '1px solid var(--g-line)' }}>
              <Link to="/AppDocs/Glyph" className="glyph-pill rounded-full px-3 h-8 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
                <FileText className="w-3 h-3" />
                docs
              </Link>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('came_from_categories');
                  } catch (e) {
                    /* ignore */
                  }
                  window.location.href = '/AppStoreV2';
                }}
                className="glyph-pill rounded-full px-3 h-8 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]"
              >
                <Store className="w-3 h-3" />
                exit to store
              </button>
              <button onClick={onHome} className="glyph-pill rounded-full px-3 h-8 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
                <Home className="w-3 h-3" />
                home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-4 lg:py-6 flex flex-col lg:flex-row gap-5">
        <main className="flex-1 min-w-0">
          <GlyphStage
            srcUrl={srcUrl}
            canvasRef={canvasRef}
            source={source}
            compare={compare}
            setCompare={setCompare}
            onFile={accept}
            busy={busy}
            reveal={reveal}
            styleLabelText={params ? styleLabel(params) : 'GLYPH'}
          />

          {error && (
            <p className="mt-3 text-[12px] rounded-xl px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#b91c1c' }}>
              {error}
            </p>
          )}

          {note && (
            <p className="mt-3 text-[12px] rounded-xl px-3 py-2" style={{ background: 'rgba(107,202,255,0.1)', color: '#9fd4ff' }}>
              {note}
            </p>
          )}

          {params && <GlyphStyleBar params={params} onStyle={applyStyle} onPalette={setPalette} />}

          {params && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 glyph-muted text-[10px] uppercase tracking-[0.16em]">
              <span className="glyph-mono normal-case tracking-normal">seed {params.seed}</span>
              <button onClick={copySeed} className="inline-flex items-center gap-1 hover:text-[#E8F1F9]">
                <Copy className="w-3 h-3" /> copy seed
              </button>
              <button onClick={reseed} className="inline-flex items-center gap-1 hover:text-[#E8F1F9]">
                <RefreshCw className="w-3 h-3" /> regenerate
              </button>
              <span className="hidden sm:inline">R randomize · S surprise · O original · E export</span>
            </div>
          )}
        </main>

        {controlsOpen && params && (
          <GlyphControls
            params={params}
            patch={patch}
            onClose={() => setControlsOpen(false)}
            onReset={() => {
              setParams(randomizeParams(null, {}));
              setCompare(0);
            }}
          />
        )}
      </div>
    </div>
  );
}