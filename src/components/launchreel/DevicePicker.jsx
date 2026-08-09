import React from "react";
import { Smartphone } from "lucide-react";

export const DEVICES = [
  { id: "iphone15", name: "iPhone 15 Pro", brand: "APPLE", width: 300, height: 620, thickness: 20 },
  { id: "iphone14", name: "iPhone 14", brand: "APPLE", width: 290, height: 600, thickness: 18 },
  { id: "pixel8", name: "Pixel 8 Pro", brand: "GOOGLE", width: 295, height: 610, thickness: 16 },
  { id: "s24", name: "Galaxy S24", brand: "SAMSUNG", width: 280, height: 600, thickness: 15 },
  { id: "ipad", name: "iPad Pro", brand: "APPLE", width: 400, height: 540, thickness: 12 },
];

export default function DevicePicker({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-purple-400" />
        <span className="text-white font-semibold text-sm">Device</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              selected?.id === d.id
                ? "bg-purple-500/15 border border-purple-500/40 text-white"
                : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
            }`}
          >
            <span>{d.name}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">{d.brand}</span>
          </button>
        ))}
      </div>
    </div>
  );
}