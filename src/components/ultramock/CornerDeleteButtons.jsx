import React from "react";
import { X } from "lucide-react";

/**
 * Renders a small × delete button on ALL FOUR CORNERS of a selected item.
 * Makes it easy for users to remove an object/word no matter where they tap —
 * especially on mobile where reaching the top-right can be awkward.
 *
 * Usage: drop inside a `selected && (...)` block in any layer component.
 *   <CornerDeleteButtons onRemove={() => onRemove(item.id)} title="Remove text" />
 */
export default function CornerDeleteButtons({ onRemove, title = "Remove" }) {
  const corners = [
    { className: "-top-3 -right-3" },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute ${c.className} z-30 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg ring-2 ring-black/20`}
          title={title}
          aria-label={title}
        >
          <X className="w-3 h-3" strokeWidth={3} />
        </button>
      ))}
    </>
  );
}