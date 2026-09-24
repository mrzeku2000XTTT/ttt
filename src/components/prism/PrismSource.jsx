import React, { useState } from 'react';
import { FileVideo, Upload } from 'lucide-react';

/** The way in: a dropped file, a chosen file, or a direct link. */
export default function PrismSource({ onPick, onFile, onLink, error }) {
  const [link, setLink] = useState('');
  const [dragging, setDragging] = useState(false);

  return (
    <div className="rounded-3xl border border-[#ececec] bg-[#fafafa] p-6 sm:p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center mx-auto">
        <FileVideo className="w-5 h-5" />
      </div>
      <h1 className="mt-4 text-xl sm:text-2xl font-semibold">Inspect a video</h1>
      <p className="mt-1.5 text-xs text-[#6f6f6f] max-w-md mx-auto leading-relaxed">
        Drop an MP4, choose one from this device, or paste a direct link. The file is decoded right here —
        nothing is uploaded until you ask for the visual read.
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
          onFile(e.dataTransfer?.files?.[0]);
        }}
        onClick={onPick}
        className={`prism-drop mt-5 rounded-2xl px-4 py-8 cursor-pointer transition-shadow bg-white ${
          dragging ? 'ring-2 ring-[#121212]' : ''
        }`}
      >
        <Upload className="w-4 h-4 mx-auto text-[#8a8a8a]" />
        <span className="block mt-2 text-[11px] text-[#6f6f6f]">Drop a file or click to choose</span>
        <span className="block mt-0.5 text-[10px] text-[#a3a3a3]">MP4 · WebM · MOV</span>
      </div>

      <div className="mt-4 flex items-center gap-1.5 max-w-md mx-auto">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onLink(link);
          }}
          placeholder="…or paste a direct video link"
          className="flex-1 rounded-lg border border-[#e6e6e6] px-3 py-2 text-[11px] outline-none focus:border-[#c9c9c9]"
        />
        <button
          onClick={() => onLink(link)}
          className="rounded-lg bg-[#121212] text-white text-[11px] font-bold px-3 py-2 hover:opacity-90 transition-opacity"
        >
          Inspect
        </button>
      </div>
      {error && <p className="mt-3 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}