import React from "react";
import { X, Move } from "lucide-react";
import { OVERLAY_PRESETS } from "./overlayPresets";

/**
 * Renders an overlay item (preset SVG or AI-generated image) on the canvas.
 * Item shape:
 *   { id, kind:'overlay', overlayType:'preset'|'image',
 *     presetId?, imageUrl?, color?,
 *     x, y,            // 0-100 % of canvas
 *     widthPct,        // width as % of canvas (height auto via aspect)
 *     aspect,          // w/h ratio so it stays proportional while resizing
 *     rotation,        // degrees
 *     opacity }        // 0-1
 */
export default function OverlayLayer({
  item, selected, onSelect, onRemove, onPointerDown, isDragging,
}) {
  const isPreset = item.overlayType === "preset";
  const preset = isPreset ? OVERLAY_PRESETS.find((p) => p.id === item.presetId) : null;
  const aspect = item.aspect || (preset ? preset.defaultW / preset.defaultH : 1);

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item)}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      className="absolute select-none"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.widthPct}%`,
        aspectRatio: `${aspect}`,
        transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: selected ? 25 : 14,
        touchAction: "none",
        opacity: item.opacity ?? 1,
      }}
    >
      {selected && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="absolute -top-3 -right-3 z-30 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg"
            title="Remove overlay"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute -top-3 -left-3 z-30 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
            <Move className="w-3 h-3" />
          </div>
          <div
            className="absolute -inset-2 ring-2 ring-cyan-400/70 rounded-lg pointer-events-none"
            style={{ boxShadow: "0 0 0 4px rgba(34,211,238,0.1)" }}
          />
        </>
      )}

      {isPreset && preset ? (
        <div
          className="w-full h-full pointer-events-none"
          dangerouslySetInnerHTML={{ __html: preset.svg(item.color || preset.color) }}
        />
      ) : item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))" }}
        />
      ) : null}
    </div>
  );
}