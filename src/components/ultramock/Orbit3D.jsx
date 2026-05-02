import React, { useRef, useState, useCallback, useEffect } from "react";

/**
 * Drag-to-rotate 3D wrapper with full 360° freedom on X and Y axes.
 * - rotX / rotY are controlled from parent so sliders can drive them too.
 * - Mouse drag, touch drag, and double-click-to-reset are all supported.
 * - perspective + transform-style:preserve-3d gives true 3D depth.
 */
export default function Orbit3D({
  rotX, rotY, setRotX, setRotY,
  perspective = 1600,
  className = "",
  style = {},
  children,
}) {
  const dragging = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e) => {
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    dragging.current = {
      startX: point.clientX,
      startY: point.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
    setIsDragging(true);
  };

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging.current) return;
      const point = e.touches ? e.touches[0] : e;
      const dx = point.clientX - dragging.current.startX;
      const dy = point.clientY - dragging.current.startY;
      // Sensitivity: 0.4°/px = comfortable for full 360 with ~900px swipe
      setRotY(dragging.current.startRotY + dx * 0.4);
      setRotX(dragging.current.startRotX - dy * 0.4);
    },
    [setRotX, setRotY]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  const onDoubleClick = () => {
    setRotX(0);
    setRotY(0);
  };

  return (
    <div
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={`select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={{
        perspective: `${perspective}px`,
        touchAction: "none",
        ...style,
      }}
      title="Drag to rotate · Double-click to reset"
    >
      <div
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transformStyle: "preserve-3d",
          transition: isDragging ? "none" : "transform 0.25s ease-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}