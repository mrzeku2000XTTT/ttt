import React from 'react';
import { Lock, Upload } from 'lucide-react';

/**
 * The hero: the copy on the left, and the way in — a real drop zone that hands
 * the file straight to the studio.
 */
export default function PrismLandingHero({ onFile, onPick, connecting, error }) {
  const [dragging, setDragging] = React.useState(false);

  const take = (file) => {
    if (file) onFile(file);
  };

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#4b5563] text-[10px] font-semibold uppercase tracking-[0.16em]">
        Video intelligence / Frame analysis
      </span>

      <h1 className="mt-5 text-[34px] leading-[1.08] sm:text-[52px] sm:leading-[1.04] font-semibold tracking-[-0.02em] text-black">
        Read every frame.
        <br />
        Rebuild the{' '}
        <span className="bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-transparent">
          motion.
        </span>
      </h1>

      <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#666666]">
        Drop an MP4, inspect shot boundaries, pacing, typography, motion, and palette — and generate a
        rebuildable keyframe recipe for your next project.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer?.files?.[0]);
        }}
        onClick={onPick}
        className={`mt-6 max-w-xl rounded-2xl border-2 border-dashed bg-white px-6 py-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#0000FF] bg-[#f7f7ff]' : 'border-[#d1d1d1] hover:border-[#b9b9b9]'
        }`}
      >
        <span className="mx-auto w-9 h-9 rounded-full border border-[#e6e6e6] flex items-center justify-center">
          <Upload className="w-4 h-4 text-[#666666]" />
        </span>
        <span className="block mt-3 text-[13px] font-semibold text-black">
          {connecting ? 'Connecting your wallet…' : 'Drop MP4 here'}
        </span>
        <span className="block mt-0.5 text-[11px] text-[#8a8a8a]">or click to browse</span>
        <span className="block mt-2 text-[10px] text-[#a3a3a3]">
          MP4, MOV, WEBM · Local processing · Your video stays on your machine
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#666666]">
        <Lock className="w-3.5 h-3.5" />
        Decoded in your tab. Your video stays on your machine.
      </div>
      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}