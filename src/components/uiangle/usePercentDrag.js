import { useRef } from "react";

/**
 * Percentage-based drag for markers inside a container.
 * start(id) goes on the draggable item; move/end go on the container.
 * onDrag receives (id, xPercent, yPercent).
 */
export function usePercentDrag(areaRef, onDrag) {
  const dragging = useRef(null);

  const start = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = id;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const move = (e) => {
    if (dragging.current === null || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onDrag(dragging.current, x, y);
  };

  const end = () => {
    dragging.current = null;
  };

  return { start, move, end };
}