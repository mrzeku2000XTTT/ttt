import React, { useRef } from "react";

/**
 * Reusable corner+edge resize handles overlay.
 *
 * Renders 8 small square handles on the bounding edges of the parent. The
 * parent must be `position: relative` (or similar). When the user drags a
 * handle, `onResize` is called with `{ widthPct, heightPct, x, y }` deltas
 * computed against the surface (the canvas the item lives on).
 *
 * Props:
 *  - surfaceRef: ref to the canvas surface (so we can measure pixel→% ratio)
 *  - item: { x, y } in % (0-100), used as the anchor for opposite-corner resize
 *  - widthPct: current width in % of surface
 *  - heightPct: current height in % of surface (or null → free-aspect)
 *  - aspect: width/height to maintain on corner drags (null = free)
 *  - cameraZoom: current camera zoom (so finger-pixels map correctly)
 *  - viewZoom: surface viewport zoom
 *  - onResize: ({ widthPct, heightPct, x, y }) => void  (any can be omitted)
 *  - minPct: minimum size in % (default 4)
 */
export default function ResizeHandles({
  surfaceRef,
  item,
  widthPct,
  heightPct,
  aspect = null,
  cameraZoom = 1,
  viewZoom = 1,
  onResize,
  minPct = 4,
}) {
  const stateRef = useRef(null);

  const begin = (e, corner) => {
    e.stopPropagation();
    e.preventDefault();
    if (!surfaceRef?.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const sw = surfaceRef.current.offsetWidth || rect.width / (viewZoom * cameraZoom);
    const sh = surfaceRef.current.offsetHeight || rect.height / (viewZoom * cameraZoom);
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    stateRef.current = {
      pointerId: e.pointerId,
      target: e.currentTarget,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      origW: widthPct,
      origH: heightPct ?? (aspect ? widthPct / aspect : widthPct),
      origCx: item.x,
      origCy: item.y,
      surfaceW: sw,
      surfaceH: sh,
      vs: viewZoom * cameraZoom,
    };
  };

  const onMove = (e) => {
    const s = stateRef.current;
    if (!s) return;
    e.preventDefault();
    // Convert pixel delta → percentage delta on the surface
    const dxPct = (((e.clientX - s.startX) / s.vs) / s.surfaceW) * 100;
    const dyPct = (((e.clientY - s.startY) / s.vs) / s.surfaceH) * 100;

    // Sign of width/height change per corner
    const signW = s.corner.includes("e") ? 1 : s.corner.includes("w") ? -1 : 0;
    const signH = s.corner.includes("s") ? 1 : s.corner.includes("n") ? -1 : 0;

    let newW = Math.max(minPct, s.origW + signW * dxPct * 2);
    let newH = Math.max(minPct, s.origH + signH * dyPct * 2);

    // Lock aspect on corner handles when aspect provided
    const isCorner = signW !== 0 && signH !== 0;
    if (aspect && isCorner) {
      // Use the larger relative change as the driver
      const driveByW = Math.abs(dxPct) >= Math.abs(dyPct);
      if (driveByW) newH = newW / aspect;
      else newW = newH * aspect;
    }

    // The center stays put — anchor is item center, so we don't move x/y.
    // (This gives natural corner-drag-from-anchor feel since the box grows
    // symmetrically around its center.)
    const out = { widthPct: newW };
    if (heightPct != null || aspect) out.heightPct = newH;
    onResize?.(out);
  };

  const end = (e) => {
    const s = stateRef.current;
    if (!s) return;
    try { s.target?.releasePointerCapture?.(s.pointerId); } catch {}
    stateRef.current = null;
  };

  const handle = (corner, style) => (
    <div
      key={corner}
      onPointerDown={(e) => begin(e, corner)}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 w-3 h-3 bg-white border-2 border-cyan-400 rounded-sm shadow-md hover:scale-125 transition-transform"
      style={{
        ...style,
        cursor: corner === "n" || corner === "s" ? "ns-resize"
          : corner === "e" || corner === "w" ? "ew-resize"
          : corner === "ne" || corner === "sw" ? "nesw-resize"
          : "nwse-resize",
        touchAction: "none",
      }}
      title="Drag to resize"
    />
  );

  return (
    <>
      {handle("nw", { left: -6, top: -6 })}
      {handle("n",  { left: "calc(50% - 6px)", top: -6 })}
      {handle("ne", { right: -6, top: -6 })}
      {handle("e",  { right: -6, top: "calc(50% - 6px)" })}
      {handle("se", { right: -6, bottom: -6 })}
      {handle("s",  { left: "calc(50% - 6px)", bottom: -6 })}
      {handle("sw", { left: -6, bottom: -6 })}
      {handle("w",  { left: -6, top: "calc(50% - 6px)" })}
    </>
  );
}