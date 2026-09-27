import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import { MOTION_PRESETS, TREATMENTS, calculateBestGrid } from './spriteMotionEngine';

const FRAME_CHIPS = [8, 12, 16, 24, 32, 48, 64];
const FPS_CHIPS = [6, 8, 12, 15, 24, 30];
const SIZES = [128, 256, 512];
const CAMERA_PRESETS = [
  { id: 'front', label: 'Front', yaw: 0, pitch: 0 },
  { id: 'isometric', label: 'Isometric', yaw: 45, pitch: 30 },
  { id: 'side', label: 'Side', yaw: 90, pitch: 0 },
  { id: 'top', label: 'Top', yaw: 0, pitch: 75 },
  { id: 'rear', label: 'Rear', yaw: 145, pitch: 20 },
];

function Chips({ items, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.id ?? item}
          type="button"
          onClick={() => onPick(item.id ?? item)}
          className={`glyph-chip ${value === (item.id ?? item) ? 'glyph-chip-on' : ''}`}
        >
          {item.label ?? item}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b glyph-hairline px-4 py-4">
      <p className="gm-label mb-3">{title}</p>
      {children}
    </div>
  );
}

export default function GlyphMotionControls({
  cfg,
  patch,
  sourceName,
  sourceThumb,
  onUpload,
  onSample,
  onGenerate,
  generating,
  progress,
}) {
  const inputRef = useRef(null);
  const [dropActive, setDropActive] = useState(false);

  const grid = calculateBestGrid(cfg.frameCount);
  const sheetPx = grid.cols * cfg.frameSize;

  const handleDrop = (event) => {
    event.preventDefault();
    setDropActive(false);
    const file = Array.from(event.dataTransfer.files || []).find((f) => f.type.startsWith('image/'));
    if (file) onUpload(file);
  };

  return (
    <aside className="gm-panel border-r glyph-hairline" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <Section title="Source image">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}
          className={`glyph-drop flex items-center gap-3 p-3 ${dropActive ? 'glyph-drop-active' : ''}`}
        >
          <div className="gm-checker h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border glyph-hairline">
            {sourceThumb ? <img src={sourceThumb} alt="" className="h-full w-full object-contain" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] truncate" title={sourceName}>{sourceName || 'Drop an image'}</p>
            <p className="glyph-muted text-[10px] mt-1">any image · drag & drop or browse</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => inputRef.current?.click()} className="glyph-btn glyph-btn-ghost flex-1">
            <Upload className="w-3 h-3" /> Upload
          </button>
          <button type="button" onClick={onSample} className="glyph-btn glyph-btn-ghost flex-1">
            <ImageIcon className="w-3 h-3" /> Sample
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
      </Section>

      <Section title="Motion">
        <Chips items={MOTION_PRESETS} value={cfg.preset} onPick={(preset) => patch({ preset })} />
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="gm-label">Frames — any count</span>
            <input
              type="number"
              min={2}
              max={512}
              value={cfg.frameCount}
              onChange={(e) => {
                const next = Number(e.target.value);
                patch({ frameCount: Math.max(2, Math.min(512, Number.isFinite(next) ? next : 2)) });
              }}
              className="gm-field gm-mono w-20 text-[11px] py-1"
            />
          </div>
          <Chips items={FRAME_CHIPS} value={cfg.frameCount} onPick={(frameCount) => patch({ frameCount })} />
          <p className="glyph-muted text-[10px] mt-2 gm-mono">
            {grid.cols} × {grid.rows} grid · sheet {grid.cols * cfg.frameSize} × {grid.rows * cfg.frameSize}px
            {sheetPx > 16384 ? ' · too large for one canvas' : ''}
          </p>
        </div>

        <div className="mt-4">
          <span className="gm-label">Fps</span>
          <div className="mt-2">
            <Chips items={FPS_CHIPS} value={cfg.fps} onPick={(fps) => patch({ fps })} />
          </div>
        </div>

        <div className="mt-4">
          <span className="gm-label">Frame size</span>
          <div className="mt-2">
            <Chips items={SIZES} value={cfg.frameSize} onPick={(frameSize) => patch({ frameSize })} />
          </div>
        </div>

        <label className="flex items-center justify-between mt-4 cursor-pointer">
          <span className="gm-label">Loop</span>
          <input
            type="checkbox"
            checked={cfg.loop}
            onChange={(e) => patch({ loop: e.target.checked })}
            className="accent-[#6bcaff]"
          />
        </label>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="gm-label">Intensity</span>
            <span className="glyph-muted text-[10px] gm-mono">{cfg.intensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={cfg.intensity}
            onChange={(e) => patch({ intensity: Number(e.target.value) })}
            className="glyph-range mt-2"
          />
        </div>
      </Section>

      <Section title="Camera">
        <Chips
          items={CAMERA_PRESETS}
          value={cfg.cameraPreset}
          onPick={(id) => {
            const preset = CAMERA_PRESETS.find((p) => p.id === id);
            patch({ cameraPreset: id, yaw: preset.yaw, pitch: preset.pitch });
          }}
        />
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="gm-label">Yaw</span>
            <span className="glyph-muted text-[10px] gm-mono">{cfg.yaw}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={cfg.yaw}
            onChange={(e) => patch({ yaw: Number(e.target.value), cameraPreset: 'custom' })}
            className="glyph-range mt-2"
          />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="gm-label">Pitch</span>
            <span className="glyph-muted text-[10px] gm-mono">{cfg.pitch}°</span>
          </div>
          <input
            type="range"
            min={-80}
            max={85}
            value={cfg.pitch}
            onChange={(e) => patch({ pitch: Number(e.target.value), cameraPreset: 'custom' })}
            className="glyph-range mt-2"
          />
        </div>
      </Section>

      <Section title="Background key">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="gm-label">Remove flat background</span>
          <input
            type="checkbox"
            checked={cfg.chromaEnabled}
            onChange={(e) => patch({ chromaEnabled: e.target.checked })}
            className="accent-[#6bcaff]"
          />
        </label>
        <div className="flex items-center gap-3 mt-3">
          <input
            type="color"
            value={cfg.chromaColor}
            onChange={(e) => patch({ chromaColor: e.target.value })}
            className="h-8 w-10 rounded border glyph-hairline bg-transparent"
            aria-label="Background colour to remove"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="gm-label">Tolerance</span>
              <span className="glyph-muted text-[10px] gm-mono">{cfg.chromaTolerance}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={cfg.chromaTolerance}
              onChange={(e) => patch({ chromaTolerance: Number(e.target.value) })}
              className="glyph-range mt-1"
            />
          </div>
        </div>
      </Section>

      <Section title="Treatment">
        <Chips items={TREATMENTS} value={cfg.treatment} onPick={(treatment) => patch({ treatment })} />
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="gm-label">Strength</span>
            <span className="glyph-muted text-[10px] gm-mono">{cfg.treatmentIntensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={cfg.treatmentIntensity}
            onChange={(e) => patch({ treatmentIntensity: Number(e.target.value) })}
            className="glyph-range mt-2"
          />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <input
            type="color"
            value={cfg.treatmentColor}
            onChange={(e) => patch({ treatmentColor: e.target.value })}
            className="h-8 w-10 rounded border glyph-hairline bg-transparent"
            aria-label="Treatment colour"
          />
          <span className="glyph-muted text-[10px]">ink colour for ASCII / halftone</span>
        </div>
      </Section>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="glyph-btn glyph-btn-primary w-full"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Rendering…' : 'Generate sprite sheet'}
        </button>
        {generating && (
          <p className="glyph-muted text-[10px] gm-mono mt-2 text-center">
            frame {progress.done} / {progress.total}
          </p>
        )}
      </div>
    </aside>
  );
}