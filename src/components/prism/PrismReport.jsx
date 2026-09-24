import React from 'react';
import { AlertTriangle, ListOrdered, Move, Sparkles, Type } from 'lucide-react';
import { timecode } from './prismFrames';

const Field = ({ label, value }) => (
  <div className="rounded-lg border border-[#f0f0f0] px-2.5 py-2">
    <span className="block text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">{label}</span>
    <span className="block mt-0.5 text-[11px] text-[#2e2e2e] leading-relaxed">{value || 'not determinable'}</span>
  </div>
);

/**
 * The visual read: interpretation, clearly separated from the measurements.
 */
export default function PrismReport({ report, times }) {
  if (!report) return null;
  const t = report.typography || {};

  return (
    <div className="grid sm:grid-cols-2 gap-2.5 items-start">
      <div className="sm:col-span-2 rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 prism-frame">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#9775fa]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f6f6f]">The read</h3>
          <span className="ml-auto text-[9px] text-[#a3a3a3]">interpretation, not measurement</span>
        </div>
        <p className="mt-2.5 text-sm font-semibold">{report.what_it_is}</p>
        <p className="mt-1 text-[12px] text-[#5c5c5c] leading-relaxed">{report.summary}</p>
        {times?.length > 0 && (
          <p className="mt-2 text-[9px] text-[#a3a3a3]">Read from stills at {times.map((x) => `${x.toFixed(2)}s`).join(', ')}</p>
        )}
      </div>

      <div className="sm:col-span-2 rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
        <div className="flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-[#8a8a8a]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f6f6f]">Typography</h3>
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-1.5">
          <Field label="Faces" value={t.faces} />
          <Field label="Weight" value={t.weights} />
          <Field label="Case" value={t.casing} />
          <Field label="Letter-spacing" value={t.tracking} />
          <Field label="Placement" value={t.placement} />
          <Field label="Treatment" value={t.treatment} />
        </div>
        {t.notes && <p className="mt-2 text-[11px] text-[#6f6f6f] leading-relaxed">{t.notes}</p>}
      </div>

      {(report.animation || []).length > 0 && (
        <div className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-[#8a8a8a]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f6f6f]">Animation</h3>
            <span className="ml-auto text-[10px] text-[#a3a3a3]">{report.animation.length} elements</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {report.animation.map((a, i) => (
              <div key={i} className="rounded-lg border border-[#f0f0f0] px-2.5 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-semibold text-[#2e2e2e]">{a.element}</span>
                  <span className="ml-auto text-[9px] tabular-nums text-[#a3a3a3]">{a.when}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#5c5c5c] leading-relaxed">{a.motion}</p>
                <p className="mt-0.5 text-[10px] text-[#8a8a8a]">
                  easing · {a.easing}
                  {a.detail ? ` — ${a.detail}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(report.transitions || []).length > 0 && (
        <div className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5 text-[#8a8a8a]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f6f6f]">At the cuts</h3>
          </div>
          <div className="mt-3 space-y-1">
            {report.transitions.map((x, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] tabular-nums text-[#9775fa] w-[62px] shrink-0">{timecode(x.at)}</span>
                <span className="text-[11px] text-[#2e2e2e] font-medium w-[86px] shrink-0">{x.type}</span>
                <span className="text-[11px] text-[#5c5c5c] leading-relaxed">{x.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sm:col-span-2 grid sm:grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
          <span className="block text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">Lighting</span>
          <p className="mt-1 text-[11px] text-[#5c5c5c] leading-relaxed">{report.lighting || 'not determinable'}</p>
        </div>
        <div className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
          <span className="block text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">Composition</span>
          <p className="mt-1 text-[11px] text-[#5c5c5c] leading-relaxed">{report.composition || 'not determinable'}</p>
        </div>
        <div className="rounded-2xl border border-[#ececec] bg-white p-4 prism-frame">
          <span className="block text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">Palette in use</span>
          <p className="mt-1 text-[11px] text-[#5c5c5c] leading-relaxed">{report.palette_notes || 'not determinable'}</p>
        </div>
      </div>

      {(report.recipe || []).length > 0 && (
        <div className="sm:col-span-2 rounded-2xl border border-[#121212] bg-white p-4 prism-frame">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]">Rebuild recipe</h3>
            <span className="ml-auto text-[10px] text-[#a3a3a3]">{report.recipe.length} keyframe moments</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {report.recipe.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-[10px] tabular-nums text-[#9775fa] w-[62px] shrink-0 pt-0.5">{timecode(r.t)}</span>
                <span className="flex-1">
                  <span className="block text-[11px] font-semibold text-[#2e2e2e]">{r.what}</span>
                  <span className="block mt-0.5 text-[11px] text-[#5c5c5c] leading-relaxed">{r.how}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(report.rebuild_notes || report.confidence) && (
        <div className="sm:col-span-2 rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 prism-frame space-y-2">
          {report.rebuild_notes && (
            <div>
              <span className="block text-[9px] uppercase tracking-[0.14em] text-[#a3a3a3]">Easy to get wrong</span>
              <p className="mt-1 text-[11px] text-[#5c5c5c] leading-relaxed">{report.rebuild_notes}</p>
            </div>
          )}
          {report.confidence && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-[#a3a3a3] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#6f6f6f] leading-relaxed">{report.confidence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}