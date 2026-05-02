import React, { useRef, useState, useCallback, useEffect } from "react";
import DeviceFrame from "./DeviceFrame";
import TextLayer from "./TextLayer";
import { Trash2, Plus, Move, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
  const panState = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const clampZoom = (z) => Math.max(0.25, Math.min(2, z));
  const zoomIn = () => setZoom((z) => clampZoom(z + 0.1));
  const zoomOut = () => setZoom((z) => clampZoom(z - 0.1));
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Plain scroll-to-zoom — no modifier key needed
  const onWheel = (e) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * 0.08;
    setZoom((z) => clampZoom(z - delta));
  };

  const onSurfaceClick = (e) => {
    // Only fire if clicking the surface itself (not a child device)
    if (e.target !== surfaceRef.current) return;
    // If user just panned, swallow the click so we don't deselect/place
    if (panState.current?.moved) {
      panState.current = null;
      return;
    }
    if (placementMode) {
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onAddAt(x, y);
    } else {
      setSelectedId(null);
    }
  };

  // Left-click-drag on empty surface = pan the canvas
  const onSurfacePointerDown = (e) => {
    if (e.target !== surfaceRef.current) return;
    if (placementMode) return; // placement click handles this
    if (e.button !== 0) return; // left button only
    if (e.currentTarget?.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
    panState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
      moved: false,
      pointerId: e.pointerId,
      target: e.currentTarget,
    };
    setIsPanning(true);
  };

  const startDrag = (e, item) => {
    e.stopPropagation();
    // Only respond to left-mouse / touch / pen — ignore right-click etc.
    if (e.button !== undefined && e.button !== 0) return;
    // Cancel any stale pan in progress
    panState.current = null;
    setIsPanning(false);
    setSelectedId(item.id);
    const rect = surfaceRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;

    // Capture the pointer so move + up events always come back to this element,
    // even if the mouse leaves it or hovers a child <video>.
    if (e.pointerId !== undefined && e.currentTarget?.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }

    dragState.current = {
      id: item.id,
      pointerId: e.pointerId,
      target: e.currentTarget,
      // rect.width/height are already the visually-scaled dimensions.
      surfaceW: rect.width,
      surfaceH: rect.height,
      startX: point.clientX,
      startY: point.clientY,
      origX: item.x,
      origY: item.y,
      moved: false,
      pendingX: item.x,
      pendingY: item.y,
      raf: null,
    };
  };

  const onMove = useCallback(
    (e) => {
      // Pan path
      const ps = panState.current;
      if (ps) {
        if (e.cancelable) e.preventDefault?.();
        const point = e.touches ? e.touches[0] : e;
        const dx = point.clientX - ps.startX;
        const dy = point.clientY - ps.startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) ps.moved = true;
        setPan({ x: ps.origX + dx, y: ps.origY + dy });
        return;
      }
      // Item drag path
      const ds = dragState.current;
      if (!ds) return;
      if (e.cancelable) e.preventDefault?.();
      const point = e.touches ? e.touches[0] : e;
      // rect.width/height already include zoom scaling, so % delta is direct.
      const dx = ((point.clientX - ds.startX) / ds.surfaceW) * 100;
      const dy = ((point.clientY - ds.startY) / ds.surfaceH) * 100;
      if (Math.abs(dx) + Math.abs(dy) > 0.3) ds.moved = true;
      ds.pendingX = Math.max(0, Math.min(100, ds.origX + dx));
      ds.pendingY = Math.max(0, Math.min(100, ds.origY + dy));
      // RAF-throttle parent updates so we never re-render more than 60fps
      if (!ds.raf) {
        ds.raf = requestAnimationFrame(() => {
          if (!dragState.current) return;
          onUpdateItem(dragState.current.id, {
            x: dragState.current.pendingX,
            y: dragState.current.pendingY,
          });
          dragState.current.raf = null;
        });
      }
    },
    [onUpdateItem]
  );

  const endDrag = useCallback(() => {
    const ds = dragState.current;
    if (ds?.raf) cancelAnimationFrame(ds.raf);
    if (ds?.target && ds.pointerId !== undefined) {
      try { ds.target.releasePointerCapture?.(ds.pointerId); } catch {}
    }
    dragState.current = null;
    panState.current = null;
    setIsPanning(false);
  }, []);

  useEffect(() => {
    // Listen on the document so we always get the up event no matter what
    // child element captured the pointer (e.g. a <video> inside a device frame).
    const onUp = () => endDrag();
    const onCancel = () => endDrag();
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
    document.addEventListener("mouseleave", onUp);
    // Touch fallback for older Safari
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onCancel);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
      document.removeEventListener("mouseleave", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [onMove, endDrag]);

  // Native wheel listener with { passive: false } so we can preventDefault page scroll
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * 0.08;
      setZoom((z) => clampZoom(z - delta));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

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
      {/* Zoom controls — overlay, not part of the exported canvas (sits outside surface) */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 ring-1 ring-white/15 shadow-lg">
        <button
          onClick={zoomOut}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80"
          title="Zoom out (Ctrl/Cmd + scroll)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomReset}
          className="px-2 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80 text-[10px] font-bold tabular-nums min-w-[44px]"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15 mx-0.5" />
        <button
          onClick={zoomReset}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80"
          title="Fit"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        onPointerDown={onSurfacePointerDown}
        className={`relative w-full h-full ${
          placementMode ? "cursor-copy" : isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          minHeight: 200,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: dragState.current || isPanning ? "none" : "transform 0.15s ease-out",
        }}
      >
        {items.map((item) => {
          const selected = item.id === selectedId;
          // Render text items via TextLayer
          if (item.kind === "text") {
            return (
              <TextLayer
                key={item.id}
                item={item}
                selected={selected}
                onSelect={setSelectedId}
                onRemove={onRemove}
                onPointerDown={startDrag}
                isDragging={dragState.current?.id === item.id}
              />
            );
          }
          return (
            <div
              key={item.id}
              onPointerDown={(e) => startDrag(e, item)}
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