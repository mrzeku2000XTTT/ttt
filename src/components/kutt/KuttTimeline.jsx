import React, { useRef, useState } from "react";
import { Scissors, Trash2, ZoomIn, ZoomOut, Film, Music, Layers } from "lucide-react";

const TRACKS = [
  { id: 0, label: "V1", icon: Film, color: "from-cyan-600/70 to-blue-600/70", border: "border-cyan-400" },
  { id: 1, label: "V2", icon: Layers, color: "from-purple-600/70 to-fuchsia-600/70", border: "border-fuchsia-400" },
  { id: 2, label: "A1", icon: Music, color: "from-emerald-600/70 to-teal-600/70", border: "border-emerald-400" },
];

export default function KuttTimeline({ assets, clips, setClips, playhead, setPlayhead, selectedId, setSelectedId, duration }) {
  const [pps, setPps] = useState(40); // pixels per second
  const scrollRef = useRef(null);
  const dragRef = useRef(null);

  const assetById = (id) => assets.find((a) => a.id === id);
  const totalW = Math.max(duration + 10, 30) * pps;

  const seekFromEvent = (e) => {
    const rect = scrollRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollRef.current.scrollLeft - 48; // 48px track labels
    setPlayhead(Math.max(0, x / pps));
  };

  const onClipPointerDown = (e, clip, mode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(clip.id);
    dragRef.current = { clipId: clip.id, mode, startX: e.clientX, orig: { ...clip } };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  };

  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / pps;
    setClips((prev) => prev.map((c) => {
      if (c.id !== d.clipId) return c;
      if (d.mode === "move") return { ...c, start: Math.max(0, d.orig.start + dx) };
      if (d.mode === "resize") return { ...c, duration: Math.max(0.5, d.orig.duration + dx) };
      if (d.mode === "trim") {
        const shift = Math.max(-(d.orig.trimIn || 0), Math.min(dx, d.orig.duration - 0.5));
        return { ...c, start: d.orig.start + shift, duration: d.orig.duration - shift, trimIn: (d.orig.trimIn || 0) + shift };
      }
      return c;
    }));
  };

  const onDragEnd = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  };

  const splitAtPlayhead = () => {
    const clip = clips.find((c) => c.id === selectedId);
    if (!clip || playhead <= clip.start || playhead >= clip.start + clip.duration) return;
    const offset = playhead - clip.start;
    const right = {
      ...clip,
      id: `k_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      start: playhead,
      duration: clip.duration - offset,
      trimIn: (clip.trimIn || 0) + offset,
    };
    setClips((prev) => prev.flatMap((c) => (c.id === clip.id ? [{ ...c, duration: offset }, right] : [c])));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setClips((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const ticks = [];
  for (let s = 0; s <= Math.max(duration + 10, 30); s += pps >= 60 ? 1 : 5) ticks.push(s);

  return (
    <div className="h-full flex flex-col bg-zinc-950/90 border-t border-white/10 select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10">
        <span className="text-white/80 text-[11px] font-black tracking-widest uppercase mr-2">Timeline</span>
        <button data-agent-id="kutt-split" onClick={splitAtPlayhead} disabled={!selectedId} title="Split at playhead"
          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-30"><Scissors className="w-3.5 h-3.5" /></button>
        <button data-agent-id="kutt-delete" onClick={deleteSelected} disabled={!selectedId} title="Delete clip"
          className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setPps((z) => Math.max(12, z - 12))} className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={() => setPps((z) => Math.min(160, z + 12))} className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Tracks */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative" onPointerDown={seekFromEvent}>
        <div style={{ width: totalW + 48 }} className="relative min-h-full">
          {/* Ruler */}
          <div className="sticky top-0 z-10 h-6 bg-black/80 border-b border-white/10 ml-12 relative">
            {ticks.map((s) => (
              <div key={s} className="absolute top-0 h-full border-l border-white/15" style={{ left: s * pps }}>
                <span className="absolute top-0.5 left-1 text-white/35 text-[8px] font-mono">{`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`}</span>
              </div>
            ))}
          </div>

          {TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <div key={track.id} className="flex h-14 border-b border-white/[0.06]">
                <div className="sticky left-0 z-10 w-12 flex-shrink-0 bg-black/80 border-r border-white/10 flex flex-col items-center justify-center gap-0.5">
                  <Icon className="w-3 h-3 text-white/40" />
                  <span className="text-white/40 text-[8px] font-bold">{track.label}</span>
                </div>
                <div className="relative flex-1">
                  {clips.filter((c) => c.track === track.id).map((clip) => {
                    const asset = assetById(clip.assetId);
                    const selected = clip.id === selectedId;
                    return (
                      <div
                        key={clip.id}
                        onPointerDown={(e) => onClipPointerDown(e, clip, "move")}
                        className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r ${track.color} border ${selected ? `${track.border} ring-1 ring-white/50` : "border-white/15"} cursor-grab active:cursor-grabbing overflow-hidden`}
                        style={{ left: clip.start * pps, width: Math.max(8, clip.duration * pps) }}
                        title={asset?.name}
                      >
                        {asset?.type === "image" && <img src={asset.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" draggable={false} />}
                        <span className="absolute left-1.5 top-1 text-white text-[8px] font-bold drop-shadow truncate max-w-[90%]">{asset?.name || "clip"}</span>
                        <span className="absolute left-1.5 bottom-0.5 text-white/60 text-[7px] font-mono">{clip.duration.toFixed(1)}s</span>
                        {/* Trim-in handle */}
                        <div onPointerDown={(e) => onClipPointerDown(e, clip, "trim")}
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/70 cursor-ew-resize" />
                        {/* Resize handle */}
                        <div onPointerDown={(e) => onClipPointerDown(e, clip, "resize")}
                          className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/30 hover:bg-white/70 cursor-ew-resize" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none" style={{ left: 48 + playhead * pps }}>
            <div className="absolute -top-0 -left-[5px] w-[11px] h-3 bg-red-500" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}