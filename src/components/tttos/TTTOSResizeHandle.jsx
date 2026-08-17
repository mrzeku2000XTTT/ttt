import React, { useRef, useCallback } from "react";

const HANDLES = [
  { dir: "n",  className: "top-0 left-2 right-2 h-1 cursor-ns-resize" },
  { dir: "s",  className: "bottom-0 left-2 right-2 h-1 cursor-ns-resize" },
  { dir: "e",  className: "right-0 top-2 bottom-2 w-1 cursor-ew-resize" },
  { dir: "w",  className: "left-0 top-2 bottom-2 w-1 cursor-ew-resize" },
  { dir: "ne", className: "top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize" },
  { dir: "nw", className: "top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize" },
  { dir: "se", className: "bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize" },
  { dir: "sw", className: "bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize" },
];

export default function TTTOSResizeHandle({ dir, className, onResizeStart }) {
  const handleRef = useRef(null);

  const onPointerDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(dir, e);
  }, [dir, onResizeStart]);

  return (
    <div
      ref={handleRef}
      onPointerDown={onPointerDown}
      className={`absolute z-30 ${className} hover:bg-cyan-400/30 transition-colors`}
    />
  );
}

export { HANDLES };