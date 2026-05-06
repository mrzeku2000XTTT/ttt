import React from "react";
import { Move } from "lucide-react";
import { OVERLAY_PRESETS } from "./overlayPresets";
import ResizeHandles from "./ResizeHandles";
import CornerDeleteButtons from "./CornerDeleteButtons";

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
  surfaceRef, cameraZoom = 1, viewZoom = 1, onUpdateItem,
}) {
  const isPreset = item.overlayType === "preset";
  const preset = isPreset ? OVERLAY_PRESETS.find((p) => p.id === item.presetId) : null;
  const aspect = item.aspect || (preset ? preset.defaultW / preset.defaultH : 1);
  // Motion preset compatibility — same animation track as devices.
  const rotX = item.rotX || 0;
  const rotY = item.rotY || 0;
  const scale = item.scale ?? 1;
  const z = item.rotation || 0; // 2D rotation from OverlayControls

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
        transform: `translate(-50%, -50%) perspective(1600px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${z}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: selected ? 25 : 14,
        touchAction: "none",
        opacity: item.opacity ?? 1,
        transition: isDragging ? "none" : "transform 0.2s ease-out",
      }}
    >
      {selected && (
        <>
          <CornerDeleteButtons onRemove={() => onRemove(item.id)} title="Remove overlay" />
          <div className="absolute top-1/2 -left-7 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
            <Move className="w-3 h-3" />
          </div>
          <div
            className="absolute -inset-2 ring-2 ring-cyan-400/70 rounded-lg pointer-events-none"
            style={{ boxShadow: "0 0 0 4px rgba(34,211,238,0.1)" }}
          />
          {onUpdateItem && surfaceRef && (
            <ResizeHandles
              surfaceRef={surfaceRef}
              item={item}
              widthPct={item.widthPct ?? 30}
              aspect={aspect}
              cameraZoom={cameraZoom}
              viewZoom={viewZoom}
              onResize={({ widthPct }) => {
                onUpdateItem(item.id, {
                  widthPct: Math.max(4, Math.min(200, widthPct)),
                });
              }}
              minPct={4}
            />
          )}
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