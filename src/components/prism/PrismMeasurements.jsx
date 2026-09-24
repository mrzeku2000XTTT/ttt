import React from 'react';
import { Clock, Film, Palette as PaletteIcon, Activity } from 'lucide-react';
import { timecode } from './prismFrames';

function Bars({ values, max, cuts = [], duration, height = 54 }) {
  const w = 100 / Math.max(1, values.length);
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      {values.map((v, i) => {
        const h = Math.max(1, (v / (max || 1)) * height);
        return (
          <rect
            key={i}
            x={i * w}
            y={height - h}
            width={Math.max(0.2, w - 0.3)}
            height={h}
            fill="#121212"
            opacity="0.72"
          />
        );
      })}
      {cuts.map((t, i) => (
        <line
          key={`c${i}`}
          x1={(t / (duration || 1)) * 100}
          x2={(t / (duration || 1)) * 100}
          y1="0"
          y2={height}
          stroke="#9775fa"
          strokeWidth="0.7"
        />
      ))}
    </svg>
  );
}

function Line({ values, height = 44, stroke = '#121212' }) {
  const n = Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i / n) * 100},${height - (v / 100) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Card({ icon: Icon, title, children, right, className = '' }) {
  return (
    <div className={`rounded-2xl border border-[#ececec] bg-white p-4 prism-frame ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#8a8a8a]" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f6f6f]">{title}</h3>
        {right && <span className="ml-auto text-[10px] text-[#a3a3a3]">{right}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * Everything PRISM measured from the file's own pixels. No interpretation here —
 * this is the evidence the visual read is built on.
 */
export default function PrismMeasurements({ result, sheet, onSeek, activeTime }) {
  if (!result) return null;
  const { motion, brightness, white, shots, cuts, palette, summary } = result;
  const maxMotion = Math.max(1, ...motion);

  return (
    <div className="space-y-2.5">
      <Card
        icon={Film}
        title="Contact sheet"
        right={`${sheet.length} frames · drawn from the file`}
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5">
          {sheet.map((f) => (
            <button
              key={f.t}
              onClick={() => onSeek(f.t)}
              className={`group relative rounded-lg overflow-hidden border transition-colors ${
                Math.abs(activeTime - f.t) < 0.2 ? 'border-[#121212]' : 'border-[#ececec] hover:border-[#c9c9c9]'
              }`}
            >
              <img src={f.url} alt={`Frame at ${f.t.toFixed(2)}s`} className="w-full block" />
              <span className="absolute bottom-0 left-0 right-0 bg-white/85 backdrop-blur-sm text-[9px] tabular-nums text-[#4a4a4a] py-0.5 text-center">
                {timecode(f.t)}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card
        icon={Activity}
        title="Motion between samples"
        right={`peak ${summary.peakMotion} · mean ${summary.avgMotion}`}
      >
        <Bars values={motion} max={maxMotion} cuts={cuts} duration={shots[shots.length - 1]?.end || 1} />
        <div className="flex items-center justify-between mt-1.5 text-[9px] text-[#a3a3a3]">
          <span>0s</span>
          <span className="text-[#9775fa]">{cuts.length} cut{cuts.length === 1 ? '' : 's'} detected</span>
          <span>{timecode(shots[shots.length - 1]?.end || 0)}</span>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-2.5">
        <Card icon={Activity} title="Brightness" right={`avg ${summary.avgBrightness}%`}>
          <Line values={brightness} stroke="#121212" />
          <p className="mt-1.5 text-[9px] text-[#a3a3a3]">Luma across the piece, 0–100%.</p>
        </Card>
        <Card icon={Activity} title="White coverage" right={`avg ${summary.avgWhite}%`}>
          <Line values={white} stroke="#4dabf7" />
          <p className="mt-1.5 text-[9px] text-[#a3a3a3]">Share of pixels above 236 in every channel.</p>
        </Card>
      </div>

      <Card
        icon={PaletteIcon}
        title="Palette by area"
        right="measured, most-used first"
      >
        <div className="flex rounded-lg overflow-hidden h-8">
          {palette.map((c) => (
            <div key={c.hex} style={{ background: c.hex, width: `${c.share}%` }} title={`${c.hex} · ${c.share}%`} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {palette.map((c) => (
            <div key={c.hex} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-[#e6e6e6] shrink-0" style={{ background: c.hex }} />
              <span className="min-w-0">
                <span className="block text-[10px] tabular-nums text-[#4a4a4a]">{c.hex}</span>
                <span className="block text-[9px] text-[#a3a3a3] truncate">{c.name} · {c.share}%</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card
        icon={Clock}
        title="Shot list"
        right={`${summary.shots} shots · avg ${summary.avgShot}s · ${summary.pacing} pacing`}
      >
        <div className="space-y-1">
          {shots.map((s) => (
            <button
              key={s.index}
              onClick={() => onSeek(s.start)}
              className="w-full flex items-center gap-2 rounded-lg border border-[#f0f0f0] hover:border-[#dcdcdc] px-2 py-1.5 text-left transition-colors"
            >
              <span className="w-5 text-[10px] tabular-nums text-[#a3a3a3]">{s.index}</span>
              <span className="text-[10px] tabular-nums text-[#4a4a4a] w-[74px]">
                {timecode(s.start)}–{timecode(s.end)}
              </span>
              <span className="text-[10px] tabular-nums text-[#8a8a8a] w-10">{s.length.toFixed(2)}s</span>
              <span className="flex-1 h-1.5 rounded-full bg-[#f2f2f2] overflow-hidden">
                <span
                  className="block h-full bg-[#121212]"
                  style={{ width: `${Math.min(100, (s.motion / Math.max(1, summary.peakMotion)) * 100)}%` }}
                />
              </span>
              <span className="flex gap-0.5">
                {s.palette.map((c) => (
                  <span key={c.hex} className="w-2.5 h-2.5 rounded-sm border border-[#ececec]" style={{ background: c.hex }} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}