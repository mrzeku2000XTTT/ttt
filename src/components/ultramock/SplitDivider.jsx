import React, { useRef } from "react";
import { GripVertical } from "lucide-react";

/**
 * Vertical drag handle that resizes the RIGHT sidebar.
 * Drag right → narrower sidebar; drag left → wider sidebar.
 */
export default function SplitDivider({ onResize, minWidth = 280, maxWidth = 640 }) {
  const dragging = useRef(false);

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const fromRight = window.innerWidth - e.clientX;
    const w = Math.max(minWidth, Math.min(maxWidth, fromRight));
    onResize(w);
  };

  const onPointerUp = (e) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="hidden lg:flex absolute top-0 bottom-0 -left-1.5 w-3 z-20 cursor-col-resize items-center justify-center group"
      title="Drag to resize"
    >
      <div className="w-px h-full bg-white/10 group-hover:bg-cyan-400/60 transition-colors" />
      <div className="absolute w-5 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
        <GripVertical className="w-3 h-3 text-white/60" />
      </div>
    </div>
  );
}