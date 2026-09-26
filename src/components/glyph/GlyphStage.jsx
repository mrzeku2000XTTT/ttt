import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Maximize2, Minimize2, Move, MoveDiagonal2, Pause, Play, Upload } from 'lucide-react';
import GlyphTimeline from './GlyphTimeline';

// The three ways to look at a render. Split is the default, so the source is
// always visible next to what GLYPH made of it.
const VIEWS = [
  { label: 'Original', value: 1 },
  { label: 'Split', value: 0.5 },
  { label: 'Result', value: 0 },
];

/**
 * The live canvas: the artwork dominates, with a draggable before/after
 * slider over it. Dropping or pasting an image or a video anywhere here
 * transforms it. In 3D the artwork leans back on a plane that sways — the
 * pointer surface stays flat so the slider keeps exact math. Fullscreen only
 * restyles this element; the canvas node is never moved, so it keeps its pixels.
 */
export default function GlyphStage({
  srcUrl,
  videoUrl,
  videoRef,
  playing,
  onTogglePlay,
  view3d,
  fullscreen,
  onToggleFullscreen,
  canvasRef,
  source,
  compare,
  setCompare,
  onFile,
  busy,
  reveal = true,
  maxHeight,
  styleLabelText,
}) {
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  // 3D only: the artwork can be dragged around and scaled, so the card can be
  // posed however the user wants it. The transform sits on the frame, leaving
  // the plane free to keep its sway.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panStart = useRef(null);
  const zoomStart = useRef(null);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [srcUrl, videoUrl]);

  const reset3d = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const startPan = (e) => {
    e.stopPropagation();
    panStart.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const movePan = (e) => {
    const s = panStart.current;
    if (!s) return;
    setPan({ x: s.ox + (e.clientX - s.x), y: s.oy + (e.clientY - s.y) });
  };
  const endPan = () => {
    panStart.current = null;
  };

  const startZoom = (e) => {
    e.stopPropagation();
    zoomStart.current = { x: e.clientX, s: zoom };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const moveZoom = (e) => {
    const s = zoomStart.current;
    if (!s) return;
    setZoom(Math.max(0.6, Math.min(1.9, s.s + (e.clientX - s.x) / 220)));
  };
  const endZoom = () => {
    zoomStart.current = null;
  };

  const loaded = !!(srcUrl || videoUrl);

  // In the studio shell the artwork is capped to the space actually left over,
  // so the page never has to scroll. Fullscreen keeps its own viewport rule.
  const cap =
    !fullscreen && maxHeight ? Math.max(120, maxHeight - (videoUrl ? 122 : 78)) : 0;

  const moveTo = (clientX) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setCompare(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };

  const onDown = (e) => {
    dragging.current = true;
    if (frameRef.current) frameRef.current.setPointerCapture?.(e.pointerId);
    moveTo(e.clientX);
  };
  const onMove = (e) => {
    if (dragging.current) moveTo(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const drop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={
        fullscreen
          ? 'glyph-stage-full fixed inset-0 z-[100] flex flex-col justify-center overflow-auto bg-[#05080d]/95 p-3 backdrop-blur-md sm:p-6'
          : 'relative min-h-0'
      }
      style={!fullscreen && maxHeight && !loaded ? { height: `${maxHeight}px` } : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={drop}
    >
      {!loaded ? (
        <label
          className={`glyph-drop flex h-full min-h-0 flex-col items-center justify-center overflow-hidden text-center cursor-pointer px-6 py-6 ${dragOver ? 'glyph-drop-active' : ''}`}
        >
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' }}>
            <ImagePlus className="w-6 h-6 text-white" />
          </div>
          <p className="glyph-word text-[13px] mb-2">Drop an image or video</p>
          <p className="glyph-muted text-[13px] mb-1">or click to upload</p>
          <p className="glyph-muted text-[11px] mt-3 max-w-xs">
            Turn any image or video into visual code. It transforms the moment it lands — everything runs locally in your browser.
          </p>
        </label>
      ) : (
        <div
          className={`relative flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 ${dragOver ? 'glyph-drop-active' : ''} glyph-card`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={drop}
        >
          <div
            ref={frameRef}
            className={`glyph-frame ${view3d ? 'glyph-frame-3d' : ''} ${fullscreen ? 'glyph-frame-full' : ''}`}
            style={view3d ? { transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` } : undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className={`glyph-plane ${view3d ? 'glyph-plane-3d glyph-plane-live' : ''}`}>
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="glyph-under"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img src={srcUrl} alt="Original" className="glyph-under" draggable={false} />
              )}
              <canvas
                ref={canvasRef}
                className="relative"
                style={{
                  clipPath: `inset(0 0 0 ${compare * 100}%)`,
                  opacity: reveal ? 1 : 0,
                  transition: 'opacity 650ms ease',
                  maxHeight: cap ? `${cap}px` : undefined,
                }}
              />
              {compare > 0.001 && <div className="glyph-handle" style={{ left: `${compare * 100}%` }} />}
            </div>
            {view3d && (
              <button
                type="button"
                className="glyph-resize"
                onPointerDown={startZoom}
                onPointerMove={moveZoom}
                onPointerUp={endZoom}
                onPointerCancel={endZoom}
                onDoubleClick={reset3d}
                title="Drag to resize · double-click to reset"
              >
                <MoveDiagonal2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {view3d && (
            <button
              type="button"
              className="glyph-grab"
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onDoubleClick={reset3d}
              title="Drag to move · double-click to reset"
            >
              <Move className="w-3 h-3" />
              <span className="hidden sm:inline">drag to move</span>
              {Math.round(zoom * 100) !== 100 && (
                <span className="glyph-mono">{Math.round(zoom * 100)}%</span>
              )}
            </button>
          )}

          <div className="absolute left-5 top-5 flex items-center gap-1.5">
            <span className="glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold">
              {styleLabelText}
            </span>
            {videoUrl && (
              <button
                onClick={onTogglePlay}
                className="glyph-glass flex h-7 w-7 items-center justify-center rounded-full"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="absolute right-5 top-5 flex items-center gap-1.5">
            {VIEWS.map((v) => (
              <button
                key={v.label}
                onClick={() => setCompare(v.value)}
                className={`glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${
                  Math.abs(compare - v.value) < 0.26 ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={onToggleFullscreen}
              className="glyph-glass flex h-7 w-7 items-center justify-center rounded-full"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>

          {videoUrl && <GlyphTimeline videoRef={videoRef} playing={playing} onTogglePlay={onTogglePlay} />}

          <p className="glyph-muted mt-2 text-center text-[10px] tracking-wide">
            {view3d
              ? 'drag the bar to move the card · the corner grip resizes it · the slider still compares'
              : videoUrl
                ? 'drag the slider to compare · the video keeps playing underneath'
                : 'drag the slider to compare · drop or paste a new image to transform it'}
          </p>
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#070b12]/70 backdrop-blur-sm">
          <Loader2 className="glyph-spin w-6 h-6" style={{ color: '#4A90E2' }} />
        </div>
      )}

      {!loaded && (
        <div className="mt-3 flex items-center justify-center gap-2 glyph-muted text-[11px]">
          <Upload className="w-3 h-3" />
          <span>JPG · PNG · WEBP · GIF · MP4 · WEBM — nothing is uploaded to a server</span>
        </div>
      )}
      {source && (
        <p className="glyph-muted text-center text-[10px] mt-2 tracking-wide">
          working resolution {source.width}×{source.height}
          {videoUrl ? ' · sampled live' : ''}
        </p>
      )}
    </div>
  );
}