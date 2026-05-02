import React from "react";
import { Smartphone, Monitor, Tablet, Globe, Square, Laptop, ChevronDown } from "lucide-react";
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

export default function MockControls({
  device, setDevice,
  background, setBackground,
  padding, setPadding,
  scale, setScale,
}) {
  return (
    <div className="space-y-5">
      {/* Device */}
      <Section title="Device">
        <div className="grid grid-cols-2 gap-1.5">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            const active = device === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
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

      {/* Padding */}
      <Section title={`Padding · ${padding}px`}>
        <input
          type="range"
          min="20"
          max="160"
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full accent-white"
        />
      </Section>

      {/* Scale */}
      <Section title={`Device Size · ${Math.round(scale * 100)}%`}>
        <input
          type="range"
          min="0.5"
          max="1.4"
          step="0.05"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-full accent-white"
        />
      </Section>
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