import React, { useState } from "react";
import { Play, Copy, Check } from "lucide-react";

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function KlipzClipCard({ clip, videoId, index }) {
  const [start, setStart] = useState(clip.start_s);
  const [end, setEnd] = useState(clip.end_s);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://youtu.be/${videoId}?t=${start}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950" style={{ fontFamily: "monospace" }}>
      <div className="aspect-video bg-black relative">
        {playing ? (
          <iframe
            key={`${start}-${end}`}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=1&rel=0`}
            title={clip.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="w-full h-full flex flex-col items-center justify-center group">
            <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative z-10 w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
            <span className="relative z-10 mt-2 text-[10px] text-cyan-300 tracking-[0.2em]">PREVIEW CLIP</span>
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] text-cyan-400 tracking-[0.25em] mb-1">DRAFT {String(index + 1).padStart(2, "0")} · SCORE {Math.round(clip.score || 0)}</p>
            <p className="text-white font-bold text-sm leading-snug">{clip.title}</p>
          </div>
          <span className="text-[10px] text-zinc-500 whitespace-nowrap">{fmt(end - start)}s</span>
        </div>
        <p className="text-zinc-500 text-[11px] mt-2 leading-relaxed">{clip.reason}</p>
        <div className="mt-3 flex items-center gap-2 text-[10px]">
          <label className="text-zinc-600">IN</label>
          <input type="number" value={start} min={0} onChange={(e) => setStart(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-20 bg-black border border-zinc-700 px-2 py-1.5 text-white focus:border-cyan-400 focus:outline-none" />
          <label className="text-zinc-600">OUT</label>
          <input type="number" value={end} min={start + 1} onChange={(e) => setEnd(Math.max(start + 1, parseInt(e.target.value) || start + 1))}
            className="w-20 bg-black border border-zinc-700 px-2 py-1.5 text-white focus:border-cyan-400 focus:outline-none" />
          <span className="text-zinc-600">{fmt(start)} → {fmt(end)}</span>
          <button onClick={copyLink} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 transition-colors tracking-widest">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </div>
    </div>
  );
}