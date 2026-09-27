import React, { useState } from 'react';
import { Check, Copy, Download, FileJson, Film, Grid, Pause, Play, SkipBack, SkipForward } from 'lucide-react';

const TABS = [
  { id: 'preview', label: 'Playback', icon: Film },
  { id: 'sheet', label: 'Sheet', icon: Grid },
  { id: 'json', label: 'Metadata', icon: FileJson },
];

function download(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

export default function GlyphMotionPreview({
  result,
  sheetUrl,
  generating,
  playing,
  setPlaying,
  frameIndex,
  setFrameIndex,
}) {
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  const frame = result?.frames[frameIndex];
  const meta = result?.metadata;

  const exportSheet = () => {
    if (!sheetUrl || !meta) return;
    download(sheetUrl, `${meta.name}_spritesheet_${meta.columns}x${meta.rows}.png`);
  };

  const exportFrame = () => {
    if (!frame || !meta) return;
    download(frame.dataUrl, `${meta.name}_frame_${String(frame.index).padStart(3, '0')}.png`);
  };

  const exportJson = () => {
    if (!meta) return;
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download(url, `${meta.name}_spritesheet.json`);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const copyJson = () => {
    if (!meta) return;
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b glyph-hairline px-4 py-3">
        <div className="gm-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`gm-tab ${tab === id ? 'gm-tab-on' : ''}`}>
              <span className="inline-flex items-center gap-1.5">
                <Icon className="w-3 h-3" /> {label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={exportFrame} disabled={!frame} className="glyph-btn glyph-btn-ghost">
            <Download className="w-3 h-3" /> Frame
          </button>
          <button type="button" onClick={exportSheet} disabled={!sheetUrl} className="glyph-btn glyph-btn-ghost">
            <Download className="w-3 h-3" /> Sheet PNG
          </button>
          <button type="button" onClick={exportJson} disabled={!meta} className="glyph-btn glyph-btn-ghost">
            <Download className="w-3 h-3" /> JSON
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4">
        {!result && (
          <div className="glyph-card h-full rounded-2xl flex items-center justify-center">
            <p className="glyph-muted text-[12px]">
              {generating ? 'Rendering frames…' : 'Upload an image, then generate a sprite sheet.'}
            </p>
          </div>
        )}

        {result && tab === 'preview' && (
          <div className="h-full flex flex-col min-h-0">
            <div className="gm-stage gm-checker flex-1 min-h-0 rounded-2xl border glyph-hairline p-4">
              {frame ? <img src={frame.dataUrl} alt={`Frame ${frame.index}`} /> : null}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                className="glyph-btn glyph-btn-ghost"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => setFrameIndex((frameIndex - 1 + result.frames.length) % result.frames.length)}
                className="glyph-btn glyph-btn-ghost"
                title="Previous frame"
              >
                <SkipBack className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setFrameIndex((frameIndex + 1) % result.frames.length)}
                className="glyph-btn glyph-btn-ghost"
                title="Next frame"
              >
                <SkipForward className="w-3 h-3" />
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, result.frames.length - 1)}
                value={frameIndex}
                onChange={(e) => setFrameIndex(Number(e.target.value))}
                className="glyph-range flex-1"
              />
              <span className="glyph-muted text-[10px] gm-mono whitespace-nowrap">
                {frameIndex + 1} / {result.frames.length}
              </span>
            </div>

            <div className="gm-frame-strip mt-3">
              {result.frames.map((item) => (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setFrameIndex(item.index);
                  }}
                  className={`gm-thumb gm-checker ${item.index === frameIndex ? 'gm-thumb-on' : ''}`}
                  title={`Frame ${item.index + 1}`}
                >
                  <img src={item.dataUrl} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}

        {result && tab === 'sheet' && (
          <div className="h-full flex flex-col min-h-0">
            <div className="gm-stage gm-stage-sheet gm-checker flex-1 min-h-0 rounded-2xl border glyph-hairline p-4 overflow-auto">
              <img src={sheetUrl} alt="Sprite sheet" />
            </div>
            <p className="glyph-muted text-[10px] gm-mono mt-3">
              {meta.columns} × {meta.rows} grid · {meta.frames} frames · {meta.sheetWidth} × {meta.sheetHeight}px
              {meta.loop ? ' · loops' : ''}
            </p>
          </div>
        )}

        {result && tab === 'json' && (
          <div className="h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="gm-label">Sheet metadata</span>
              <button type="button" onClick={copyJson} className="glyph-btn glyph-btn-ghost">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="gm-panel glyph-card flex-1 min-h-0 rounded-2xl p-4 gm-mono text-[11px] whitespace-pre-wrap">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}