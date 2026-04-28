import React, { useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

/**
 * SplitDivider — vertical drag handle for resizing the canvas/config split.
 * Reports new config-panel width (in px) via onResize.
 */
export default function SplitDivider({ onResize, minWidth = 280, maxWidth = 720 }) {
  const dragRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      // Right panel width = window width - mouseX
      const w = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX));
      onResize(w);
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onResize, minWidth, maxWidth]);

  return (
    <div
      onMouseDown={() => {
        dragRef.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }}
      className="group flex-shrink-0 w-1.5 h-full cursor-col-resize bg-white/5 hover:bg-cyan-500/40 transition-colors relative z-20"
      title="Drag to resize"
    >
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-12 rounded-md bg-white/[0.04] group-hover:bg-cyan-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-white/60" />
      </div>
    </div>
  );
}