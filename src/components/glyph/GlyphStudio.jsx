import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Download,
  FileText,
  Home,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Settings2,
  Shuffle,
  Sparkles,
  Store,
  Wand2,
  X,
} from 'lucide-react';
import {
  autoTune,
  createVideoSource,
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
import GlyphChat from './GlyphChat';
import GlyphMark from './GlyphMark';

// Video is re-rendered every frame, so it is sampled at a steady rate rather
// than on every animation frame.
const VIDEO_FPS = 15;

export default function GlyphStudio({ onHome, initialFile }) {
  const [img, setImg] = useState(null);
  const [srcUrl, setSrcUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [view3d, setView3d] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [params, setParams] = useState(null);
  // Open on a split, so the source is always visible beside the render.
  const [compare, setCompare] = useState(0.5);

  // The studio fills the viewport, so the artwork has to fit the space that is
  // genuinely left over. That space is measured and the canvas is capped to it,
  // which is what keeps the page itself from ever scrolling.
  const scrollRef = useRef(null);
  const ribbonRef = useRef(null);
  const [stageH, setStageH] = useState(0);
  const hasParams = Boolean(params);

  useEffect(() => {
    const measure = () => {
      const c = scrollRef.current;
      if (!c) return;
      const avail = c.clientHeight - (ribbonRef.current?.offsetHeight || 0) - 30;
      setStageH(Math.max(110, avail));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (scrollRef.current) ro.observe(scrollRef.current);
    if (ribbonRef.current) ro.observe(ribbonRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [hasParams]);

  // The chat/controls panel is a split view: beside the artwork on desktop, and
  // sliding up from the bottom on phones. Either way the divider drags, so the
  // panel gets exactly the room it needs without ever covering the preview.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [panelW, setPanelW] = useState(380);
  const [dockPx, setDockPx] = useState(
    () => Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.42)
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const startResize = (e) => {
    e.preventDefault();
    const x0 = e.clientX;
    const y0 = e.clientY;
    const w0 = panelW;
    const h0 = dockPx;
    const move = (ev) => {
      if (isDesktop) {
        setPanelW(Math.min(680, Math.max(280, w0 - (ev.clientX - x0))));
      } else {
        setDockPx(Math.min(window.innerHeight - 200, Math.max(150, h0 - (ev.clientY - y0))));
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const panelOpen = chatOpen || (controlsOpen && params);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [reveal, setReveal] = useState(true);
  const revealRef = useRef(true);
  const checkedRef = useRef('');
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const videoUrlRef = useRef(null);
  const lastFrameRef = useRef(null);

  const animated = params ? isAnimated(params) : false;
  const source = useMemo(() => (img ? prepareSource(img, animated) : null), [img, animated]);

  /* ── upload: the picture transforms the moment it lands ── */
  const accept = useCallback(async (file) => {
    if (!file) return;
    const isVideo = (file.type || '').startsWith('video/');
    const isImage = (file.type || '').startsWith('image/');
    if (!isVideo && !isImage) {
      setError('That file is not an image or a video.');
      return;
    }
    setBusy(true);
    setError('');
    const reset = () => {
      setParams(randomizeParams(null, {}));
      setCompare(0.5);
      setControlsOpen(false);
      setNote('');
      lastFrameRef.current = null;
      revealRef.current = false;
      setReveal(false);
    };
    try {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      if (isVideo) {
        const url = URL.createObjectURL(file);
        videoUrlRef.current = url;
        setImg(null);
        setSrcUrl(null);
        setVideoSource(null);
        setVideoUrl(url);
        setPlaying(true);
        reset();
      } else {
        const { img: image, url } = await loadImageFromFile(file);
        videoUrlRef.current = null;
        setVideoUrl(null);
        setVideoSource(null);
        setImg(image);
        setSrcUrl(url);
        reset();
      }
    } catch (e) {
      setError(e.message || 'Could not read that file.');
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

  /* ── a video: the element plays in place and is sampled frame by frame ── */
  useEffect(() => {
    if (!videoUrl) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;
    v.muted = true;
    const begin = () => {
      v.play().catch(() => {});
      setVideoSource(createVideoSource(v));
    };
    if (v.readyState >= 2) begin();
    else v.addEventListener('loadeddata', begin, { once: true });
    return () => v.removeEventListener('loadeddata', begin);
  }, [videoUrl]);

  useEffect(() => {
    if (!videoSource || !params) return undefined;
    let raf = 0;
    let last = 0;
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 1000 / VIDEO_FPS) return;
      last = now;
      const frame = videoSource.sample();
      if (!frame) return;
      lastFrameRef.current = frame;
      renderTo(canvasRef.current, frame, params, now / 1000, `v${frame.frame}`);
    };
    raf = requestAnimationFrame(draw);
    if (!revealRef.current) {
      revealRef.current = true;
      requestAnimationFrame(() => setReveal(true));
    }
    return () => cancelAnimationFrame(raf);
  }, [videoSource, params]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

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

  // Changing the render never touches the view, so the source stays where the
  // user left it.
  const randomize = useCallback(() => {
    setParams((p) => randomizeParams(p));
  }, []);

  const surprise = useCallback(() => {
    setParams((p) => surpriseParams(p));
  }, []);

  const applyStyle = useCallback((id) => {
    setParams((p) => randomizeParams(p, { style: id, palette: p?.palette }));
  }, []);

  const patch = useCallback((key, value) => {
    setParams((p) => (p ? { ...p, [key]: value } : p));
  }, []);

  // What the chat hands back: a style change re-rolls the look, then the exact
  // values it asked for are layered on top of that.
  const applyChat = useCallback((changes) => {
    setParams((p) => {
      if (!p) return p;
      let next = p;
      if (changes.style && changes.style !== p.style) {
        next = randomizeParams(p, { style: changes.style, palette: changes.palette || p.palette });
      }
      next = { ...next, ...changes };
      if (changes.palette) next.paletteObj = paletteById(changes.palette);
      return next;
    });
  }, []);

  // What the chat hands back for the view itself — 3D, the compare view and
  // playback. These are not render settings, so they are applied separately.
  const applyView = useCallback((changes) => {
    if (typeof changes.view3d === 'boolean') setView3d(changes.view3d);
    if (changes.view === 'original') setCompare(1);
    else if (changes.view === 'split') setCompare(0.5);
    else if (changes.view === 'result') setCompare(0);
    if (typeof changes.playing === 'boolean') {
      const v = videoRef.current;
      if (v) {
        if (changes.playing) {
          v.play().catch(() => {});
          setPlaying(true);
        } else {
          v.pause();
          setPlaying(false);
        }
      }
    }
  }, []);

  /* ── auto: fit the render to the picture, then say how well it landed ── */
  const runAuto = useCallback(() => {
    const src = source || lastFrameRef.current;
    if (!src || !params || tuning) return;
    setTuning(true);
    setError('');
    setNote('');
    // let the button paint its busy state before the search blocks the thread
    window.setTimeout(() => {
      try {
        const { params: tuned, score } = autoTune(src, params);
        setParams(tuned);
        setNote(
          `Auto-tuned: ${Math.round(score * 100)}% structural match. Brightness is neutral and the cell size and contrast are fitted to this picture.`,
        );
      } catch (e) {
        setError('Could not auto-tune this picture.');
      }
      setTuning(false);
    }, 30);
  }, [source, params, tuning]);

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
        if (items[i].type && (items[i].type.startsWith('image/') || items[i].type.startsWith('video/'))) {
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
      else if (k === 'f') setFullscreen((v) => !v);
      else if (k === 'escape') {
        setControlsOpen(false);
        setExportOpen(false);
        setChatOpen(false);
        setFullscreen(false);
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
    if (!params) return;
    const moving = videoSource || null;
    const still = moving ? lastFrameRef.current : source;
    if (!moving && !still) return;
    setBusy(true);
    setError('');
    try {
      if (format === 'webm') {
        const blob = await recordWebm(moving || source, params, moving ? 5 : 4, moving ? 20 : 24);
        downloadBlob(blob, `glyph-${params.seed}.webm`);
      } else {
        const canvas = renderStill(still, params, scale);
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
    <div className="glyph-page glyph-shell flex flex-col overflow-hidden">
      <header className="z-40 shrink-0 glyph-glass" style={{ borderBottom: '1px solid var(--g-line)' }}>
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-2 min-h-14 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onHome} className="flex items-center gap-2 min-w-0" title="Back to landing">
              <GlyphMark size={28} />
              <span className="glyph-word text-[13px]">Glyph</span>
            </button>
            <span className="hidden xl:block glyph-muted text-[11px] ml-2">turn any image or video into visual code</span>
          </div>

          <div className="flex flex-nowrap items-center justify-end gap-1.5 overflow-x-auto scrollbar-hide">
            <label className="glyph-btn glyph-btn-ghost cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  accept(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <button onClick={randomize} disabled={!source && !videoSource} className="glyph-btn glyph-btn-primary">
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Randomize</span>
            </button>
            <button
              onClick={runAuto}
              disabled={(!source && !videoSource) || tuning}
              className="glyph-btn glyph-btn-ghost"
              title="Fit the settings to this picture"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tuning ? 'Tuning…' : 'Auto'}</span>
            </button>
            <button onClick={surprise} disabled={!source && !videoSource} className="glyph-btn glyph-btn-ghost">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Surprise me</span>
            </button>
            <div className="flex items-center gap-0.5 rounded-full p-0.5" style={{ border: '1px solid var(--g-line)' }}>
              {[false, true].map((mode) => (
                <button
                  key={String(mode)}
                  onClick={() => setView3d(mode)}
                  disabled={!source && !videoSource}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    view3d === mode ? 'glyph-btn-primary' : 'glyph-muted'
                  }`}
                  title={mode ? 'Tilt the artwork back in space' : 'Flat view'}
                >
                  {mode ? '3D' : '2D'}
                </button>
              ))}
            </div>
            <div className="relative">
              <button onClick={() => setExportOpen((v) => !v)} disabled={!source && !videoSource} className="glyph-btn glyph-btn-ghost">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export</span>
              </button>
              <GlyphExportMenu
                open={exportOpen}
                busy={busy}
                animated={animated || !!videoSource}
                webmSeconds={videoSource ? 5 : 4}
                onClose={() => setExportOpen(false)}
                onExport={doExport}
              />
            </div>
            <button
              onClick={() => {
                setControlsOpen((v) => !v);
                setChatOpen(false);
              }}
              disabled={!source && !videoSource}
              className="glyph-btn glyph-btn-ghost"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Controls</span>
            </button>
            <button
              onClick={() => {
                setChatOpen((v) => !v);
                setControlsOpen(false);
              }}
              className={`glyph-btn ${chatOpen ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
              title="Ask GLYPH for a look"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Chat</span>
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

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto px-3 sm:px-4 pt-3 pb-4"
        >
          <main className="min-w-0">
          <GlyphStage
            srcUrl={srcUrl}
            videoUrl={videoUrl}
            videoRef={videoRef}
            playing={playing}
            onTogglePlay={togglePlay}
            view3d={view3d}
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((v) => !v)}
            canvasRef={canvasRef}
            source={source || videoSource}
            compare={compare}
            setCompare={setCompare}
            onFile={accept}
            busy={busy}
            reveal={reveal}
            maxHeight={stageH}
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

          <div ref={ribbonRef}>
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
              <span className="hidden sm:inline">R randomize · S surprise · O original · F fullscreen · E export</span>
            </div>
          )}
          </div>
        </main>

        </div>

        {panelOpen && (
          <div
            onPointerDown={startResize}
            className={isDesktop ? 'glyph-split-v hidden lg:block' : 'glyph-split-h flex lg:hidden'}
            title="Drag to resize"
          />
        )}

        {panelOpen && (
          <section
            style={isDesktop ? { width: `${panelW}px` } : { height: `${dockPx}px` }}
            className={`shrink-0 flex flex-col overflow-hidden rounded-2xl glyph-card ${
              isDesktop ? 'my-3 mr-3' : 'mx-2 mb-2 lg:mx-3 lg:mb-3'
            }`}
          >
            <div className="flex shrink-0 items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid var(--g-line)' }}>
              <button
                onClick={() => {
                  if (chatOpen) {
                    setChatOpen(false);
                  } else {
                    setChatOpen(true);
                    setControlsOpen(false);
                  }
                }}
                className={`glyph-btn ${chatOpen ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => {
                  if (controlsOpen) {
                    setControlsOpen(false);
                  } else {
                    setControlsOpen(true);
                    setChatOpen(false);
                  }
                }}
                className={`glyph-btn ${controlsOpen ? 'glyph-btn-primary' : 'glyph-btn-ghost'}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Controls
              </button>
              <button
                onClick={() => {
                  setChatOpen(false);
                  setControlsOpen(false);
                }}
                className="glyph-pill ml-auto flex h-7 w-7 items-center justify-center rounded-full"
                title="Close the panel"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {chatOpen ? (
                <GlyphChat
                  params={params}
                  imageReady={!!(source || videoSource)}
                  view3d={view3d}
                  onApply={applyChat}
                  onView={applyView}
                  onRandomize={randomize}
                  onSurprise={surprise}
                />
              ) : (
                params && (
                  <GlyphControls
                    params={params}
                    patch={patch}
                    onClose={() => setControlsOpen(false)}
                    onReset={() => setParams(randomizeParams(null, {}))}
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}