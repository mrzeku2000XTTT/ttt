import React, { useEffect, useState } from "react";
import { X, Move } from "lucide-react";
import ResizeHandles from "./ResizeHandles";

// Build a stacked text-shadow string that simulates 3D extrusion.
// Each layer is darker than the base color, with a soft cast shadow at the end.
function build3DShadow(depth, baseColor) {
  const d = Math.max(1, Math.min(40, Number(depth) || 8));
  const layers = [];
  for (let i = 1; i <= d; i++) {
    // Fade from solid base color into black for depth
    const t = i / d;
    const shade = `rgba(0,0,0,${0.35 + t * 0.35})`;
    layers.push(`${i}px ${i}px 0 ${shade}`);
  }
  // Soft ambient shadow under the whole thing
  layers.push(`${d + 4}px ${d + 6}px 16px rgba(0,0,0,0.5)`);
  return layers.join(", ");
}

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
  // Word-pop animation state — number of words currently visible
  const [popVisible, setPopVisible] = useState(0);

  // Word-pop loop: reveals one word at a time, then loops.
  useEffect(() => {
    if (item.animation !== "pop") return;
    const words = (item.text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const stepMs = Math.max(50, (Number(item.popDelay) || 0.25) * 1000);
    const loopMs = Math.max(0, (Number(item.loopDelay) ?? 1.5) * 1000);
    let cancelled = false;
    let timeouts = [];

    const runOnce = () => {
      setPopVisible(0);
      for (let i = 1; i <= words.length; i++) {
        const t = setTimeout(() => { if (!cancelled) setPopVisible(i); }, i * stepMs);
        timeouts.push(t);
      }
      const restart = setTimeout(() => { if (!cancelled) runOnce(); }, words.length * stepMs + loopMs);
      timeouts.push(restart);
    };
    runOnce();
    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  }, [item.text, item.animation, item.popDelay, item.loopDelay]);

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
      {item.animation === "3d" ? (
        // 3D extruded text — stacked layered shadows + perspective tilt
        <div
          style={{
            perspective: "800px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: item.fontSize,
              color: item.color,
              fontWeight: item.fontWeight,
              fontFamily: item.fontFamily || "ui-sans-serif, system-ui, sans-serif",
              textAlign: "center",
              whiteSpace: "pre-wrap",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              transform: `rotateX(${item.tilt ?? 12}deg)`,
              transformOrigin: "50% 100%",
              textShadow: build3DShadow(item.depth ?? 8, item.color),
              filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
            }}
          >
            {item.text}
          </div>
        </div>
      ) : item.animation === "pop" ? (
        // Word pop-in — each word scales/fades in sequentially
        <div
          style={{
            fontSize: item.fontSize,
            color: item.color,
            fontWeight: item.fontWeight,
            fontFamily: item.fontFamily || "ui-sans-serif, system-ui, sans-serif",
            textAlign: "center",
            textShadow: "0 4px 18px rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.35)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          {(item.text || "").split(/(\s+)/).map((chunk, i, arr) => {
            // Count word index (skip whitespace chunks)
            const wordsBefore = arr.slice(0, i).filter((c) => c.trim().length > 0).length;
            const isWord = chunk.trim().length > 0;
            const visible = !isWord || wordsBefore < popVisible;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0.4)",
                  transition: "opacity 0.25s ease-out, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  filter: visible ? "blur(0)" : "blur(6px)",
                }}
              >
                {chunk}
              </span>
            );
          })}
        </div>
      ) : (
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
      )}
      <style>{`
        @keyframes ultramock-blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}