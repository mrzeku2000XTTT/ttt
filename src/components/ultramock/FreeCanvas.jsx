import React, { useRef, useState, useCallback, useEffect } from "react";
import DeviceFrame from "./DeviceFrame";
import TextLayer from "./TextLayer";
import OverlayLayer from "./OverlayLayer";
import ResizeHandles from "./ResizeHandles";
import CornerDeleteButtons from "./CornerDeleteButtons";
import { Trash2, Plus, Move, X, ZoomIn, ZoomOut, Maximize2, Lock, Expand, Minimize, Play, Pause, EyeOff, Eye } from "lucide-react";

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
    locked = false,        // Lock preview: freezes pan/zoom/interactions for MP4 framing
    pinchEnabled = false,  // Mobile 2-finger pinch-to-zoom
    camera,                // { zoom, x, y } — animated by the timeline camera track
    isPlaying = false,     // bool — preview animation playing state (from timeline)
    onTogglePlay,          // () => void — toggle play/pause via the timeline ref
    renderMode = false,    // when true: hide selection rings, × buttons, zoom controls — clean recording
    playhead = 0,          // current timeline time (sec) — drives per-beat text visibility
    trackWindows = {},     // { [itemId]: { first, last } } — per-item kf windows for text gating
  },
  ref
) {
  const surfaceRef = useRef(null);
  const dragState = useRef(null);
  const panState = useRef(null);
  const pinchState = useRef(null);
  // On mobile, start zoomed out so the full phone is visible (device sits at y:58 with scale 1)
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return 0.5;
    return 1;
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsHidden, setControlsHidden] = useState(false);

  // Track native fullscreen state so the icon stays in sync (Esc, F11, etc.)
  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(!!fsEl || document.body.classList.contains("ultramock-pseudo-fs"));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const isMobile = () => typeof window !== "undefined" && (window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ""));

  const toggleFullscreen = () => {
    const el = typeof ref === "function" ? null : ref?.current;
    const target = el || surfaceRef.current?.parentElement;
    if (!target) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    const isPseudo = document.body.classList.contains("ultramock-pseudo-fs");

    if (!fsEl && !isPseudo) {
      // On mobile, ALWAYS use pseudo-fullscreen — native FS API on divs is
      // either unavailable (iOS Safari) or unreliable (Android in-app browsers).
      // Pseudo-FS is guaranteed to work and gives true edge-to-edge canvas.
      if (isMobile()) {
        enterPseudoFullscreen(target);
        return;
      }
      // Desktop: try native fullscreen, fall back to pseudo on rejection.
      const req = target.requestFullscreen || target.webkitRequestFullscreen;
      if (req) {
        try {
          const p = req.call(target);
          if (p && p.catch) p.catch(() => enterPseudoFullscreen(target));
          return;
        } catch {
          enterPseudoFullscreen(target);
          return;
        }
      }
      enterPseudoFullscreen(target);
    } else {
      if (fsEl) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        try { exit?.call(document); } catch {}
      }
      if (isPseudo) exitPseudoFullscreen(target);
    }
  };

  const enterPseudoFullscreen = (target) => {
    document.body.classList.add("ultramock-pseudo-fs");
    target.classList.add("ultramock-pseudo-fs-target");
    // Try to lock screen orientation to landscape on mobile (best effort —
    // many browsers reject this without a fullscreen element, so we ignore failures).
    try { window.screen?.orientation?.lock?.("landscape").catch(() => {}); } catch {}
    setIsFullscreen(true);
  };

  const exitPseudoFullscreen = (target) => {
    document.body.classList.remove("ultramock-pseudo-fs");
    target?.classList.remove("ultramock-pseudo-fs-target");
    try { window.screen?.orientation?.unlock?.(); } catch {}
    setIsFullscreen(false);
  };

  // Allow Esc key to exit pseudo-fullscreen on iOS
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && document.body.classList.contains("ultramock-pseudo-fs")) {
        const el = typeof ref === "function" ? null : ref?.current;
        const target = el || surfaceRef.current?.parentElement;
        exitPseudoFullscreen(target);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ref]);

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
    if (locked) return;
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
    if (locked) return;
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
    if (locked) { e.stopPropagation(); return; }
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

    // Use offsetWidth/Height which ignores CSS transforms — gives the true
    // unscaled surface size. Then divide finger pixel delta by it directly.
    // This works correctly regardless of zoom OR camera scale.
    const camZoom = camera?.zoom || 1;
    dragState.current = {
      id: item.id,
      pointerId: e.pointerId,
      target: e.currentTarget,
      // Effective pixel-to-percent ratio accounts for both surface zoom and camera zoom.
      surfaceW: (surfaceRef.current.offsetWidth || rect.width / (zoom * camZoom)),
      surfaceH: (surfaceRef.current.offsetHeight || rect.height / (zoom * camZoom)),
      // Total visual scale to compensate finger movement
      visualScale: zoom * camZoom,
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
      // surfaceW/H are unscaled; divide finger pixel delta by visualScale
      // to convert screen-pixels back into surface-pixels, then to %.
      const vs = ds.visualScale || 1;
      const dx = (((point.clientX - ds.startX) / vs) / ds.surfaceW) * 100;
      const dy = (((point.clientY - ds.startY) / vs) / ds.surfaceH) * 100;
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
      if (locked) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * 0.08;
      setZoom((z) => clampZoom(z - delta));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [locked]);

  // Pinch-to-zoom (mobile, 2 fingers) — only when explicitly enabled
  useEffect(() => {
    if (!pinchEnabled || locked) return;
    const el = surfaceRef.current;
    if (!el) return;

    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Cancel any pan/drag — pinch takes over
        panState.current = null;
        dragState.current = null;
        setIsPanning(false);
        pinchState.current = {
          startDist: dist(e.touches[0], e.touches[1]),
          startZoom: zoom,
        };
        e.preventDefault();
      }
    };
    const onTouchMove = (e) => {
      if (pinchState.current && e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1]);
        const ratio = d / pinchState.current.startDist;
        setZoom(clampZoom(pinchState.current.startZoom * ratio));
        e.preventDefault();
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchState.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pinchEnabled, locked, zoom]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        background: backgroundCss,
        padding,
        aspectRatio: "16/10",
        touchAction: "none",
      }}
    >
      {/* Pseudo-fullscreen styles — primary on mobile (iOS Safari + Android),
          fallback on desktop. Locks body scroll, fills viewport edge-to-edge,
          and uses 100dvh so iOS browser chrome bars don't crop the canvas. */}
      <style>{`
        body.ultramock-pseudo-fs {
          overflow: hidden !important;
          position: fixed !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
        }
        .ultramock-pseudo-fs-target {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-width: none !important;
          max-height: none !important;
          z-index: 99999 !important;
          aspect-ratio: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          background: black !important;
        }
        /* Hide any sibling chrome the parent wraps the canvas with */
        body.ultramock-pseudo-fs nav,
        body.ultramock-pseudo-fs > div > nav { display: none !important; }
      `}</style>
      {/* Locked indicator (replaces zoom controls when preview is locked) */}
      {locked && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 bg-orange-500/90 text-black px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg">
          <Lock className="w-3 h-3" /> Locked · Render Mode
        </div>
      )}

      {/* Zoom controls — overlay, not part of the exported canvas (sits outside surface) */}
      {!locked && !controlsHidden && !renderMode && (
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-1 ring-1 ring-white/15 shadow-lg">
        {onTogglePlay && (
          <>
            <button
              onClick={onTogglePlay}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                isPlaying
                  ? "bg-cyan-400 text-black hover:bg-cyan-300"
                  : "hover:bg-white/10 text-white/80"
              }`}
              title={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <div className="w-px h-4 bg-white/15 mx-0.5" />
          </>
        )}
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
        <button
          onClick={toggleFullscreen}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80"
          title={isFullscreen ? "Exit fullscreen" : "View fullscreen preview"}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
        </button>
        <div className="w-px h-4 bg-white/15 mx-0.5" />
        <button
          onClick={() => setControlsHidden(true)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60"
          title="Hide controls"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
      )}

      {/* Restore button when controls are hidden */}
      {!locked && controlsHidden && !renderMode && (
        <button
          onClick={() => setControlsHidden(false)}
          className="absolute top-3 right-3 z-40 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md hover:bg-black/70 text-white/50 hover:text-white ring-1 ring-white/10 shadow-lg transition-colors"
          title="Show controls"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Camera viewport — wraps the surface and applies the timeline camera transform */}
      <div
        className="relative w-full h-full"
        style={{
          transform: camera
            ? `scale(${camera.zoom}) translate(${(50 - camera.x)}%, ${(50 - camera.y)}%)`
            : undefined,
          transformOrigin: "center center",
          transition: "none",
          willChange: "transform",
        }}
      >
      <div
        ref={surfaceRef}
        onClick={onSurfaceClick}
        onPointerDown={onSurfacePointerDown}
        className={`relative w-full h-full ${
          locked ? "cursor-default" : placementMode ? "cursor-copy" : isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          minHeight: 200,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: dragState.current || isPanning ? "none" : "transform 0.15s ease-out",
          touchAction: "none", // disable browser pan/zoom so we handle gestures ourselves
          pointerEvents: locked ? "none" : "auto",
        }}
      >
        {items.map((item) => {
          const selected = item.id === selectedId;

          // Per-beat visibility windows — if an item declares appearAt/disappearAt,
          // hide it outside that window during playback. Always show while the
          // user has it selected (so they can edit it). Text items handle their
          // own window inside TextLayer; we apply the same rule to devices and
          // overlays here so per-beat device swaps + text-only beats work.
          if (item.kind !== "text" && typeof item.appearAt === "number" && typeof item.disappearAt === "number") {
            const inWindow = playhead >= item.appearAt && playhead < item.disappearAt;
            if (!inWindow && !selected && !renderMode) {
              // While editing (not rendering, not selected, outside window): still hide.
              return null;
            }
            if (!inWindow && renderMode) {
              return null;
            }
          }

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
                surfaceRef={surfaceRef}
                cameraZoom={camera?.zoom || 1}
                viewZoom={zoom}
                onUpdateItem={onUpdateItem}
                playhead={playhead}
                trackWindow={trackWindows[item.id] || null}
              />
            );
          }
          // Render overlay items (preset SVG or AI image)
          if (item.kind === "overlay") {
            return (
              <OverlayLayer
                key={item.id}
                item={item}
                selected={selected}
                onSelect={setSelectedId}
                onRemove={onRemove}
                onPointerDown={startDrag}
                isDragging={dragState.current?.id === item.id}
                surfaceRef={surfaceRef}
                cameraZoom={camera?.zoom || 1}
                viewZoom={zoom}
                onUpdateItem={onUpdateItem}
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
              {/* Selection ring + handles — hidden in renderMode for clean recording */}
              {selected && !renderMode && (
                <>
                  <div
                    className="absolute inset-0 ring-2 ring-cyan-400 rounded-[2.5rem] pointer-events-none"
                    style={{ boxShadow: "0 0 0 4px rgba(34,211,228,0.15)" }}
                  />
                  <CornerDeleteButtons onRemove={() => onRemove(item.id)} title="Remove device" />
                  <div className="absolute top-1/2 -left-8 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
                    <Move className="w-3.5 h-3.5" />
                  </div>
                  {/* Corner resize handles — drive the device's `scale` field */}
                  <ResizeHandles
                    surfaceRef={surfaceRef}
                    item={item}
                    widthPct={(item.scale ?? 1) * 30}
                    aspect={1}
                    cameraZoom={camera?.zoom || 1}
                    viewZoom={zoom}
                    onResize={({ widthPct }) => {
                      const newScale = Math.max(0.2, Math.min(3, widthPct / 30));
                      onUpdateItem(item.id, { scale: newScale });
                    }}
                    minPct={6}
                  />
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
                  <DeviceFrame device={item.device} media={item.media} scale={item.scale} cornerRadius={item.cornerRadius ?? 1} />
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
    </div>
  );
});

export default FreeCanvas;