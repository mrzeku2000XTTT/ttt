import React from "react";
import { Compass, ImagePlus, ZoomIn, Sun, Paintbrush } from "lucide-react";

const NAV_ITEMS = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "generate", label: "Images", icon: ImagePlus },
  { id: "upscaler", label: "Upscaler", icon: ZoomIn },
  { id: "relight", label: "Relight", icon: Sun },
  { id: "edit", label: "Edit Image", icon: Paintbrush },
];

export default function HikaruSidebar({ activeTool, onToolChange, logoUrl }) {
  return (
    <div className="w-52 h-full bg-[#0d0d14] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2.5 border-b border-white/[0.04]">
        <img src={logoUrl} alt="Hikaru" className="w-8 h-8 rounded-xl object-cover" />
        <div>
          <span className="text-white font-bold text-sm block leading-none">Hikaru</span>
          <span className="text-white/25 text-[9px]">光 · AI Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onToolChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/15">
          <p className="text-white/60 text-[10px] font-medium">Powered by AI</p>
          <p className="text-white/25 text-[8px] mt-0.5">Upload · Transform · Create</p>
        </div>
      </div>
    </div>
  );
}