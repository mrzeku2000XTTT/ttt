import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';

/**
 * The live canvas: the artwork dominates, with a draggable before/after
 * slider over it. Dropping or pasting an image anywhere here transforms it.
 */
export default function GlyphStage({
  srcUrl,
  canvasRef,
  source,
  compare,
  setCompare,
  onFile,
  busy,
  reveal = true,
  styleLabelText,
}) {
  const frameRef = useRef(null);
  const dragging = useRef(false);
  const [over, setOver] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={drop}
    >
      {!srcUrl ? (
        <label
          className={`glyph-drop flex flex-col items-center justify-center text-center cursor-pointer px-6 py-20 ${dragOver ? 'glyph-drop-active' : ''}`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(100deg,#6BCAFF,#4A90E2)' }}>
            <ImagePlus className="w-6 h-6 text-white" />
          </div>
          <p className="glyph-word text-[13px] mb-2">Drop an image</p>
          <p className="glyph-muted text-[13px] mb-1">or click to upload</p>
          <p className="glyph-muted text-[11px] mt-3 max-w-xs">
            Turn any image into visual code. It transforms the moment it lands — everything runs locally in your browser.
          </p>
        </label>
      ) : (
        <div
          className={`relative flex items-center justify-center rounded-2xl p-3 sm:p-4 ${dragOver ? 'glyph-drop-active' : ''} glyph-card`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={drop}
        >
          <div
            ref={frameRef}
            className="glyph-frame"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <img src={srcUrl} alt="Original" className="glyph-under" draggable={false} />
            <canvas
              ref={canvasRef}
              className="relative"
              style={{
                clipPath: `inset(0 0 0 ${compare * 100}%)`,
                opacity: reveal ? 1 : 0,
                transition: 'opacity 650ms ease',
              }}
            />
            {compare > 0.001 && <div className="glyph-handle" style={{ left: `${compare * 100}%` }} />}
          </div>

          <div className="absolute left-5 top-5 flex items-center gap-1.5">
            <span className="glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold">
              {styleLabelText}
            </span>
          </div>
          <div className="absolute right-5 top-5 flex items-center gap-1.5">
            <button
              onClick={() => setCompare(1)}
              className={`glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${compare > 0.5 ? 'opacity-100' : 'opacity-60'}`}
            >
              Original
            </button>
            <button
              onClick={() => setCompare(0)}
              className={`glyph-glass rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold ${compare < 0.5 ? 'opacity-100' : 'opacity-60'}`}
            >
              Result
            </button>
          </div>
          <p className="glyph-muted absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide">
            drag the slider to compare · drop or paste a new image to transform it
          </p>
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#070b12]/70 backdrop-blur-sm">
          <Loader2 className="glyph-spin w-6 h-6" style={{ color: '#4A90E2' }} />
        </div>
      )}

      {!srcUrl && (
        <div className="mt-3 flex items-center justify-center gap-2 glyph-muted text-[11px]">
          <Upload className="w-3 h-3" />
          <span>JPG · PNG · WEBP · GIF — nothing is uploaded to a server</span>
        </div>
      )}
      {source && (
        <p className="glyph-muted text-center text-[10px] mt-2 tracking-wide">
          working resolution {source.width}×{source.height}
        </p>
      )}
    </div>
  );
}