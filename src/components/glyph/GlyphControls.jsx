import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { CHAR_SETS, CHAR_SET_IDS, DITHER_ALGOS, SLIDERS } from './glyphStyles';

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] glyph-muted mb-1">
        <span>{label}</span>
        <span className="glyph-mono text-[10px]">{Number(value).toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <input
        type="range"
        className="glyph-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Chips({ label, options, value, onChange }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase tracking-[0.14em] glyph-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-semibold ${value === o.value ? 'glyph-btn-primary' : 'glyph-pill'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Live controls. Every slider feeds straight into the renderer — no Apply.
 * Right column on desktop, bottom sheet on mobile.
 */
export default function GlyphControls({ params, patch, onClose, onReset }) {
  if (!params) return null;
  const groups = ['Shape', 'Tone'];
  const glyphStyle = ['characters', 'animatedAscii', 'matrix'].includes(params.style);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl glyph-card p-4 lg:static lg:z-auto lg:max-h-none lg:w-[300px] lg:shrink-0 lg:rounded-2xl lg:overflow-visible">
      <div className="flex items-center justify-between mb-3">
        <p className="glyph-word text-[11px]">Controls</p>
        <div className="flex items-center gap-1.5">
          <button onClick={onReset} className="glyph-pill rounded-full p-1.5" title="Reset to a fresh random set">
            <RotateCcw className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="glyph-pill rounded-full p-1.5" title="Close">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {glyphStyle && (
        <Chips
          label="Character set"
          value={params.charSet}
          onChange={(v) => patch('charSet', v)}
          options={CHAR_SET_IDS.map((id) => ({ value: id, label: CHAR_SETS[id].label }))}
        />
      )}
      {params.style === 'dither' && (
        <Chips
          label="Dither algorithm"
          value={params.ditherAlgo}
          onChange={(v) => patch('ditherAlgo', v)}
          options={DITHER_ALGOS.map((a) => ({ value: a, label: a }))}
        />
      )}
      {params.style === 'dots' && (
        <Chips
          label="Dot shape"
          value={params.dotShape}
          onChange={(v) => patch('dotShape', v)}
          options={['circle', 'square', 'diamond'].map((s) => ({ value: s, label: s }))}
        />
      )}
      {params.style === 'halftone' && (
        <Chips
          label="Halftone mode"
          value={params.halftoneMode}
          onChange={(v) => patch('halftoneMode', v)}
          options={[
            { value: 'mono', label: 'Mono' },
            { value: 'rgb', label: 'RGB' },
          ]}
        />
      )}
      <Chips
        label="Plate"
        value={params.plate}
        onChange={(v) => patch('plate', v)}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ]}
      />

      {groups.map((g) => (
        <div key={g} className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.14em] glyph-muted mb-2 pt-2 border-t glyph-hairline">{g}</p>
          <div className="space-y-2.5">
            {SLIDERS.filter((s) => s.group === g).map((s) => (
              <Slider
                key={s.key}
                label={s.label}
                value={params[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => patch(s.key, v)}
              />
            ))}
          </div>
        </div>
      ))}

      <p className="glyph-muted text-[10px] leading-relaxed pt-2 border-t glyph-hairline">
        Every style rebuilds the image from the source pixels — the artwork is never replaced by a texture.
      </p>
    </aside>
  );
}