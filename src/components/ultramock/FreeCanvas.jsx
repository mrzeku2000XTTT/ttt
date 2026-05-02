import React, { useRef, useState, useCallback, useEffect } from "react";
import DeviceFrame from "./DeviceFrame";
import { Trash2, Plus, Move, X } from "lucide-react";

/**
 * Free-form canvas where users can:
 *   - Click anywhere on empty space to drop a new device at that point
 *   - Drag any device to reposition it
 *   - Click the × on a device to remove it
 *   - Click a device to select it (border highlight) and edit it via the sidebar
 *
 * Props:
 *   - items: [{id, device, media, x, y, scale, rotX, rotY}]
 *   - selectedId, setSelectedId
 *   - onUpdateItem(id, partial), onAddAt(x, y), onRemove(id)
 *   - background, padding, aspectRatio (passed to outer wrap)
 *   - placementMode: when true, next click adds a device (otherwise: deselect)
 *   - canvasRef: forwarded ref so the parent can html2canvas it
 */
const FreeCanvas = React.forwardRef(function FreeCanvas(
  {
    items, selectedId, setSelectedId,
    onUpdateItem, onAddAt, onRemove,
    background, padding, placementMode,
    backgroundCss,
  },
  ref
) {
  const surfaceRef = useRef(null);
  const dragState = useRef(null);

  const onSurfaceClick = (e) => {
    // Only fire if clicking the surface itself (not a child device)
    if (e.target !== surfaceRef.current) return;
    if (placementMode) {
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onAddAt(x, y);
    } else {
      setSelectedId(null);
    }
  };

  const startDrag = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    const rect = surfaceRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    dragState.current = {
      id: item.id,
      surfaceW: rect.width,
      surfaceH: rect.height,
      startX: point.clientX,
      startY: point.clientY,
      origX: item.x,
      origY: item.y,
      moved: false,
    };
  };

  const onMove = useCallback(
    (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const point = e.touches ? e.touches[0] : e;
      const dx = ((point.clientX - ds.startX) / ds.surfaceW) * 100;
      const dy = ((point.clientY - ds.startY) / ds.surfaceH) * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.3) ds.moved = true;
      onUpdateItem(ds.id, {
        x: Math.max(0, Math.min(100, ds.origX + dx)),
        y: Math.max(0, Math.min(100, ds.origY + dy)),
      });
    },
    [onUpdateItem]
  );

  const endDrag = useCallback(() => { dragState.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", endDrag);
    };
  }, [onMove, endDrag]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        background: backgroundCss,
        padding,
        aspectRatio: "16/10",
      }}
    >
      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        className={`relative w-full h-full ${placementMode ? "cursor-copy" : "cursor-default"}`}
        style={{ minHeight: 200 }}
      >
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <div
              key={item.id}
              onMouseDown={(e) => startDrag(e, item)}
              onTouchStart={(e) => startDrag(e, item)}
              onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              className="absolute select-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%, -50%)",
                cursor: dragState.current?.id === item.id ? "grabbing" : "grab",
                zIndex: selected ? 20 : 10,
                touchAction: "none",
              }}
            >
              {/* Selection ring + handles */}
              {selected && (
                <>
                  <div
                    className="absolute inset-0 ring-2 ring-cyan-400 rounded-[2.5rem] pointer-events-none"
                    style={{ boxShadow: "0 0 0 4px rgba(34,211,238,0.15)" }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                    className="absolute -top-3 -right-3 z-30 w-7 h-7 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg"
                    title="Remove device"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute -top-3 -left-3 z-30 w-7 h-7 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
                    <Move className="w-3.5 h-3.5" />
                  </div>
                </>
              )}
              {/* 3D rotation per item */}
              <div
                style={{
                  perspective: "1600px",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    transform: `rotateX(${item.rotX}deg) rotateY(${item.rotY}deg)`,
                    transformStyle: "preserve-3d",
                    transition: dragState.current?.id === item.id ? "none" : "transform 0.2s ease-out",
                  }}
                >
                  <DeviceFrame device={item.device} media={item.media} scale={item.scale} />
                </div>
              </div>
            </div>
          );
        })}

        {placementMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-cyan-500/90 text-black text-[11px] font-bold shadow-lg flex items-center gap-1.5 pointer-events-none">
            <Plus className="w-3 h-3" /> Click anywhere to place a device
          </div>
        )}

        {items.length === 0 && !placementMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white/50 text-sm font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
              Click "+ Add Device" to start composing
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default FreeCanvas;