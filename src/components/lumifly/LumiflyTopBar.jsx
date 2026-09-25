import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Download } from 'lucide-react';
import { RESOLUTIONS } from './lumiflyPresets';

const pill = 'rounded-full border border-white/10 px-3 py-1.5 text-[11px] transition-colors';

export default function LumiflyTopBar({
  name,
  onName,
  aspect,
  onAspect,
  resolution,
  onResolution,
  onDuplicate,
  onDownload,
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0b0b0c]/95 px-3 py-2 backdrop-blur">
      <Link
        to="/Lumifly"
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projects
      </Link>

      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[#00c29f] to-[#1e88e5]" />
        <span className="text-[13px] font-semibold tracking-tight">Lumifly</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/40">
          Beta
        </span>
      </span>

      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        className="min-w-[110px] max-w-[200px] flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-[12px] text-white/80 outline-none transition-colors hover:border-white/10 focus:border-white/25"
      />

      <div className="ml-auto flex flex-wrap items-center gap-1.5 pr-24 sm:pr-28">
        {['16:9', '9:16'].map((a) => (
          <button
            key={a}
            onClick={() => onAspect(a)}
            className={`${pill} ${
              aspect === a ? 'border-[#00c29f]/60 bg-[#00c29f]/15 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {a}
          </button>
        ))}

        <select
          value={resolution}
          onChange={(e) => onResolution(e.target.value)}
          className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-[11px] text-white/70 outline-none"
        >
          {RESOLUTIONS.map((r) => (
            <option key={r} value={r} className="bg-[#131314]">
              {r}
            </option>
          ))}
        </select>

        <button onClick={onDuplicate} className={`${pill} flex items-center gap-1.5 text-white/60 hover:text-white`}>
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>

        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </header>
  );
}