import React, { useRef } from "react";
import { Smartphone, Monitor, Tablet, Globe, Square, Laptop, RotateCcw, Move3d, Upload, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { BACKGROUND_PRESETS } from "./MockBackground";

const DEVICES = [
  { id: "iphone",  label: "iPhone",   icon: Smartphone },
  { id: "android", label: "Android",  icon: Smartphone },
  { id: "ipad",    label: "iPad",     icon: Tablet },
  { id: "macbook", label: "MacBook",  icon: Laptop },
  { id: "imac",    label: "iMac",     icon: Monitor },
  { id: "browser", label: "Browser",  icon: Globe },
  { id: "none",    label: "Bare",     icon: Square },
];

/**
 * Per-selected-item controls + global background/padding.
 * If no item is selected, only the global section is shown.
 */
export default function MockControls({
  // Global
  background, setBackground,
  padding, setPadding,
  // Selected item (may be null)
  selected,
  onUpdate,
  onRemove,
  onUploadMedia, // (file) => void
}) {
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadMedia(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      {/* Background */}
      <Section title="Background">
        <div className="grid grid-cols-5 gap-2">
          {BACKGROUND_PRESETS.map((bg) => {
            const active = background === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => setBackground(bg.id)}
                title={bg.label}
                className={`aspect-square rounded-lg transition-all ${
                  active ? "ring-2 ring-white scale-105" : "ring-1 ring-white/10 hover:ring-white/30"
                }`}
                style={{ background: bg.css }}
              />
            );
          })}
        </div>
      </Section>

      <Section title={`Canvas Padding · ${padding}px`}>
        <input
          type="range"
          min="20"
          max="160"
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full accent-white"
        />
      </Section>

      {!selected ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center text-white/40 text-xs">
          Select a device on the canvas to edit its frame, scale, rotation, and media.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-400">Selected Device</div>
            <button
              onClick={onRemove}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[10px] font-bold"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>

          {/* Media upload per item */}
          <Section title="Screen Content">
            <div className="space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-500/30"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image or MP4
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={onFile}
                className="hidden"
              />
              {selected.media && (
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 px-2 py-1 rounded bg-white/5 border border-white/10">
                  {selected.media.type === "video" ? <Video className="w-3 h-3 text-pink-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                  <span className="truncate">{selected.media.name || selected.media.type}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Device type */}
          <Section title="Device Frame">
            <div className="grid grid-cols-2 gap-1.5">
              {DEVICES.map((d) => {
                const Icon = d.icon;
                const active = selected.device === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onUpdate({ device: d.id })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? "bg-white text-black shadow-md"
                        : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title={`Size · ${Math.round(selected.scale * 100)}%`}>
            <input
              type="range"
              min="0.3"
              max="1.4"
              step="0.05"
              value={selected.scale}
              onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
              className="w-full accent-white"
            />
          </Section>

          <Section title={`Corner Radius · ${Math.round((selected.cornerRadius ?? 1) * 100)}%`}>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selected.cornerRadius ?? 1}
              onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
              className="w-full accent-white"
            />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { l: "Sharp", v: 0 },
                { l: "Subtle", v: 0.5 },
                { l: "Default", v: 1 },
                { l: "Pillow", v: 1.6 },
              ].map((p) => (
                <button
                  key={p.l}
                  onClick={() => onUpdate({ cornerRadius: p.v })}
                  className="px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
                >
                  {p.l}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Position Presets">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "tl", l: "Top L",   x: 25, y: 30 },
                { id: "tc", l: "Top",     x: 50, y: 30 },
                { id: "tr", l: "Top R",   x: 75, y: 30 },
                { id: "ml", l: "Left",    x: 25, y: 50 },
                { id: "mc", l: "Center",  x: 50, y: 50 },
                { id: "mr", l: "Right",   x: 75, y: 50 },
                { id: "bl", l: "Bot L",   x: 25, y: 70 },
                { id: "bc", l: "Bottom",  x: 50, y: 70 },
                { id: "br", l: "Bot R",   x: 75, y: 70 },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onUpdate({ x: p.x, y: p.y })}
                  className="px-2 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
                >
                  {p.l}
                </button>
              ))}
            </div>
          </Section>

          <Section title={<span className="flex items-center gap-1.5"><Move3d className="w-3 h-3" /> 3D Rotation</span>}>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                  <span>Tilt (X)</span>
                  <span className="tabular-nums font-mono">{Math.round(selected.rotX)}°</span>
                </div>
                <input
                  type="range" min="-180" max="180"
                  value={selected.rotX}
                  onChange={(e) => onUpdate({ rotX: Number(e.target.value) })}
                  className="w-full accent-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                  <span>Spin (Y)</span>
                  <span className="tabular-nums font-mono">{Math.round(selected.rotY)}°</span>
                </div>
                <input
                  type="range" min="-180" max="180"
                  value={selected.rotY}
                  onChange={(e) => onUpdate({ rotY: Number(e.target.value) })}
                  className="w-full accent-white"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Front", x: 0, y: 0 },
                  { label: "Left",  x: 0, y: -25 },
                  { label: "Right", x: 0, y: 25 },
                  { label: "Hero",  x: -8, y: -18 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => onUpdate({ rotX: p.x, rotY: p.y })}
                    className="px-2 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onUpdate({ rotX: 0, rotY: 0 })}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-bold"
              >
                <RotateCcw className="w-3 h-3" /> Reset Rotation
              </button>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2">{title}</div>
      {children}
    </div>
  );
}