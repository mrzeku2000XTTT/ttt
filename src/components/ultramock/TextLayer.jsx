import React, { useEffect, useState } from "react";
import { X, Move } from "lucide-react";
import ResizeHandles from "./ResizeHandles";

/**
 * Renders a draggable text overlay on the FreeCanvas.
 * Supports a "typewriter" animation that loops every `loopDelay` seconds.
 *
 * Text item shape:
 *   { id, kind:'text', text, x, y, fontSize, color, fontWeight, animation:'none'|'typewriter',
 *     typeSpeed (chars/sec), loopDelay (sec), fontFamily }
 */
export default function TextLayer({
  item,
  selected,
  onSelect,
  onRemove,
  onPointerDown, // (e, item) — drag handler from parent
  isDragging,
  surfaceRef,
  cameraZoom = 1,
  viewZoom = 1,
  onUpdateItem,
}) {
  const [displayed, setDisplayed] = useState(item.text || "");

  useEffect(() => {
    if (item.animation !== "typewriter") {
      setDisplayed(item.text || "");
      return;
    }
    const full = item.text || "";
    const speed = Math.max(1, Number(item.typeSpeed) || 12); // chars per sec
    const loopDelay = Math.max(0, Number(item.loopDelay) ?? 1.5) * 1000;
    let cancelled = false;
    let timeouts = [];

    const runOnce = () => {
      setDisplayed("");
      for (let i = 1; i <= full.length; i++) {
        const t = setTimeout(() => {
          if (!cancelled) setDisplayed(full.slice(0, i));
        }, (i / speed) * 1000);
        timeouts.push(t);
      }
      // schedule restart
      const restart = setTimeout(() => {
        if (!cancelled) runOnce();
      }, (full.length / speed) * 1000 + loopDelay);
      timeouts.push(restart);
    };

    runOnce();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [item.text, item.animation, item.typeSpeed, item.loopDelay]);

  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, item); }}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      className="absolute select-none"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: selected ? 25 : 15,
        touchAction: "none",
        pointerEvents: "auto",
        width: `${Math.max(10, Math.min(100, item.boxWidth ?? 90))}%`,
        maxWidth: `${Math.max(10, Math.min(100, item.boxWidth ?? 90))}%`,
      }}
    >
      {selected && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="absolute -top-3 -right-3 z-30 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg"
            title="Remove text"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute -top-3 -left-3 z-30 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
            <Move className="w-3 h-3" />
          </div>
          <div
            className="absolute -inset-2 ring-2 ring-cyan-400/70 rounded-lg pointer-events-none"
            style={{ boxShadow: "0 0 0 4px rgba(34,211,238,0.1)" }}
          />
          {onUpdateItem && surfaceRef && (
            <ResizeHandles
              surfaceRef={surfaceRef}
              item={item}
              widthPct={item.boxWidth ?? 90}
              cameraZoom={cameraZoom}
              viewZoom={viewZoom}
              onResize={({ widthPct }) => {
                // Scale BOTH the box width AND the font size proportionally
                // so corner drag actually grows/shrinks the visible text.
                const oldW = item.boxWidth ?? 90;
                const newW = Math.max(10, Math.min(100, widthPct));
                const ratio = newW / oldW;
                const oldFs = Number(item.fontSize) || 32;
                const newFs = Math.max(8, Math.min(400, oldFs * ratio));
                onUpdateItem(item.id, {
                  boxWidth: newW,
                  fontSize: newFs,
                });
              }}
              minPct={10}
            />
          )}
        </>
      )}
      <div
        style={{
          fontSize: item.fontSize,
          color: item.color,
          fontWeight: item.fontWeight,
          fontFamily: item.fontFamily || "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          textShadow: "0 2px 12px rgba(0,0,0,0.35)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}
      >
        {displayed}
        {item.animation === "typewriter" && (
          <span
            className="inline-block w-[0.08em] align-baseline"
            style={{
              backgroundColor: item.color,
              height: "1em",
              marginLeft: "0.05em",
              animation: "ultramock-blink 1s steps(2) infinite",
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes ultramock-blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}