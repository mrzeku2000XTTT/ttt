import React from "react";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";

export default function TimelineTrack({ layer, index, totalLayers, playheadPercent, onToggleVisibility, onToggleLock, onSelectLayer, isSelected }) {
  const trackColors = [
    { bg: "rgba(255, 204, 0, 0.25)", border: "rgba(255, 204, 0, 0.6)", label: "#ffcc00" },
    { bg: "rgba(255, 149, 0, 0.25)", border: "rgba(255, 149, 0, 0.6)", label: "#ff9500" },
    { bg: "rgba(0, 190, 140, 0.25)", border: "rgba(0, 190, 140, 0.6)", label: "#00be8c" },
    { bg: "rgba(0, 122, 255, 0.25)", border: "rgba(0, 122, 255, 0.6)", label: "#007aff" },
    { bg: "rgba(175, 82, 222, 0.25)", border: "rgba(175, 82, 222, 0.6)", label: "#af52de" },
    { bg: "rgba(255, 59, 48, 0.25)", border: "rgba(255, 59, 48, 0.6)", label: "#ff3b30" },
  ];
  const color = trackColors[index % trackColors.length];

  const layerTypeIcons = {
    text: "T",
    image: "🖼",
    shape: "⬡",
    logo: "◆",
    video: "▶",
  };

  const icon = layerTypeIcons[layer.type] || "●";

  return (
    <div
      onClick={() => onSelectLayer(index)}
      className={`flex items-stretch cursor-pointer transition-all rounded-lg overflow-hidden mb-0.5 ${
        isSelected ? "ring-1 ring-[#34c759]" : ""
      }`}
      style={{ height: 40 }}
    >
      {/* Visibility column */}
      <div className="flex flex-col items-center justify-center gap-1 px-2.5 py-1" style={{ minWidth: 44, background: "rgba(255,255,255,0.03)" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(index); }}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: layer.visible !== false ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}
        >
          {layer.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <span className="text-[9px] font-bold" style={{ color: color.label }}>{icon}</span>
      </div>

      {/* Track area */}
      <div className="flex-1 relative" style={{ background: "rgba(255,255,255,0.02)" }}>
        {/* Track bar */}
        <div className="absolute inset-y-2 left-1 right-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full rounded-full flex items-center px-3 transition-all"
            style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
              width: `${Math.max(8, 100 - Math.random() * 60)}%`,
            }}
          >
            <span className="text-[10px] font-semibold truncate" style={{ color: color.label }}>
              {layer.name || layer.text || `Layer ${index + 1}`}
            </span>
          </div>
        </div>

        {/* Keyframe diamonds */}
        {layer.keyframes?.map((kf, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
            style={{
              left: `${kf.time || 25 + i * 20}%`,
              background: color.label,
              boxShadow: `0 0 6px ${color.label}`,
            }}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
          style={{ left: `${playheadPercent}%`, background: "rgba(255,255,255,0.3)" }}
        />
      </div>
    </div>
  );
}