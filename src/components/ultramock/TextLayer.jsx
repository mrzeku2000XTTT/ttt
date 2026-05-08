import React, { useEffect, useState } from "react";
import { Move } from "lucide-react";
import ResizeHandles from "./ResizeHandles";
import CornerDeleteButtons from "./CornerDeleteButtons";

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
  playhead = 0,  // current timeline time (sec) — drives appearAt/disappearAt windows
  trackWindow = null, // { first, last } — first/last keyframe times for this item's track
}) {
  const [displayed, setDisplayed] = useState(item.text || "");
  // Word-pop animation state — number of words currently visible
  const [popVisible, setPopVisible] = useState(0);

  // Per-letter overrides (each: { color?, scale?, rotation? }) and
  // optional image-fill URL — letters use background-clip: text to render the
  // image *inside* the glyph shapes.
  const letterOverrides = Array.isArray(item.letters) ? item.letters : [];
  const hasLetterOverrides = letterOverrides.some((l) => l && Object.keys(l).length > 0);
  const imageFillUrl = item.imageFillUrl || null;
  const imageFillStyle = imageFillUrl
    ? {
        backgroundImage: `url("${imageFillUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        // text-shadow kills the clip on most browsers — drop it for image fills
        textShadow: "none",
      }
    : null;

  // Render text as per-letter <span>s when overrides exist, OR pass through.
  // Used by the static + 3D variants. The typewriter/pop animations have
  // their own renderers and ignore per-letter overrides for simplicity.
  const renderStyledText = (sourceText, baseStyle = {}) => {
    if (!hasLetterOverrides) return sourceText;
    return sourceText.split("").map((ch, i) => {
      const o = letterOverrides[i] || {};
      const style = {
        display: "inline-block",
        whiteSpace: "pre",
        ...(o.color ? { color: o.color, WebkitTextFillColor: o.color } : null),
        ...(o.scale ? { fontSize: `${(Number(baseStyle.fontSize) || 32) * o.scale}px` } : null),
        ...(o.rotation ? { transform: `rotate(${o.rotation}deg)` } : null),
      };
      return <span key={i} style={style}>{ch}</span>;
    });
  };

  // Per-beat visibility window: when a beat has appearAt/disappearAt set
  // (from the Katagami sub-agent flow), render ONLY inside [appearAt, disappearAt].
  // Otherwise, when this text has timeline keyframes, gate visibility to its
  // [first kf, last kf] window so the word only appears starting at its
  // first keyframe — i.e. "shows up on the time it was added on keyframe".
  // While editing (item is selected), always show so the user can drag/resize.
  const hasBeatWindow = typeof item.appearAt === "number" && typeof item.disappearAt === "number";
  const hasKfWindow = !hasBeatWindow && trackWindow && typeof trackWindow.first === "number";
  const hasWindow = hasBeatWindow || hasKfWindow;
  const inWindow = hasBeatWindow
    ? (playhead >= item.appearAt && playhead < item.disappearAt)
    : hasKfWindow
      ? (playhead >= trackWindow.first - 0.001)
      : true;

  // Word-reveal loop — used by 'pop', 'slide-up', 'blur-in', 'glow-pop', 'glitch'
  // (all per-word reveal animations). Reveals one word at a time, then loops.
  // When loopDelay is 0, plays ONCE and holds.
  useEffect(() => {
    const PER_WORD_ANIMS = ["pop", "slide-up", "blur-in", "glow-pop", "glitch"];
    if (!PER_WORD_ANIMS.includes(item.animation)) return;
    const words = (item.text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const stepMs = Math.max(50, (Number(item.popDelay) || 0.18) * 1000);
    const loopMs = Math.max(0, (Number(item.loopDelay) ?? 1.5) * 1000);
    const shouldLoop = loopMs > 0;
    let cancelled = false;
    let timeouts = [];

    const runOnce = () => {
      setPopVisible(0);
      for (let i = 1; i <= words.length; i++) {
        const t = setTimeout(() => { if (!cancelled) setPopVisible(i); }, i * stepMs);
        timeouts.push(t);
      }
      if (shouldLoop) {
        const restart = setTimeout(() => { if (!cancelled) runOnce(); }, words.length * stepMs + loopMs);
        timeouts.push(restart);
      }
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
    const shouldLoop = loopDelay > 0;
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
      // Only schedule a restart if loopDelay > 0 — beats need ONE pass.
      if (shouldLoop) {
        const restart = setTimeout(() => {
          if (!cancelled) runOnce();
        }, (full.length / speed) * 1000 + loopDelay);
        timeouts.push(restart);
      }
    };

    runOnce();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [item.text, item.animation, item.typeSpeed, item.loopDelay]);

  // OUTSIDE-WINDOW: don't render anything — completely hidden, even when selected.
  if (hasWindow && !inWindow) return null;

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
          <CornerDeleteButtons onRemove={() => onRemove(item.id)} title="Remove text" />
          <div className="absolute top-1/2 -left-7 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg pointer-events-none">
            <Move className="w-3 h-3" />
          </div>
          {hasWindow && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-orange-400 text-black text-[10px] font-black tracking-wide shadow-lg whitespace-nowrap pointer-events-none">
              {hasBeatWindow
                ? `⏱ ${item.appearAt.toFixed(1)}s – ${item.disappearAt.toFixed(1)}s`
                : `⏱ appears at ${trackWindow.first.toFixed(1)}s`}
            </div>
          )}
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
        // 3D extruded text — stacked layered shadows + perspective tilt.
        // Image fills disable the textShadow stack (background-clip can't coexist with it).
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
              textShadow: imageFillUrl ? "none" : build3DShadow(item.depth ?? 8, item.color),
              filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))",
              ...(imageFillStyle || {}),
            }}
          >
            {renderStyledText(item.text, { fontSize: item.fontSize })}
          </div>
        </div>
      ) : ["pop", "slide-up", "blur-in", "glow-pop", "glitch"].includes(item.animation) ? (
        // Per-word kinetic typography. Five distinct reveal styles, each with
        // its own enter transform / filter. All use the same popVisible counter.
        <div
          style={{
            fontSize: item.fontSize,
            color: item.color,
            fontWeight: item.fontWeight,
            fontFamily: item.fontFamily || "ui-sans-serif, system-ui, sans-serif",
            textAlign: "center",
            textShadow: item.animation === "glow-pop"
              ? `0 0 32px ${item.color || "#fff"}, 0 0 64px ${item.color || "#fff"}, 0 4px 18px rgba(0,0,0,0.6)`
              : item.animation === "glitch"
                ? "2px 0 0 #ff00ea, -2px 0 0 #00fff0, 0 4px 18px rgba(0,0,0,0.6)"
                : "0 4px 18px rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.35)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.1,
            letterSpacing: item.animation === "glitch" ? "0.02em" : "-0.015em",
          }}
        >
          {(item.text || "").split(/(\s+)/).map((chunk, i, arr) => {
            const wordsBefore = arr.slice(0, i).filter((c) => c.trim().length > 0).length;
            const isWord = chunk.trim().length > 0;
            const visible = !isWord || wordsBefore < popVisible;

            // Per-style enter transforms
            let hiddenTransform = "scale(0.4)";
            let hiddenFilter = "blur(6px)";
            let trans = "opacity 0.25s ease-out, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease-out";
            if (item.animation === "slide-up") {
              hiddenTransform = "translateY(60%)";
              hiddenFilter = "blur(2px)";
              trans = "opacity 0.3s ease-out, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.3s ease-out";
            } else if (item.animation === "blur-in") {
              hiddenTransform = "scale(1.05)";
              hiddenFilter = "blur(14px)";
              trans = "opacity 0.45s ease-out, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s ease-out";
            } else if (item.animation === "glow-pop") {
              hiddenTransform = "scale(0.7)";
              hiddenFilter = "blur(8px) brightness(2.5)";
              trans = "opacity 0.3s ease-out, transform 0.45s cubic-bezier(0.34, 1.7, 0.64, 1), filter 0.5s ease-out";
            } else if (item.animation === "glitch") {
              hiddenTransform = "translateX(-8%) skewX(-8deg)";
              hiddenFilter = "blur(2px)";
              trans = "opacity 0.15s ease-out, transform 0.25s cubic-bezier(0.85, 0, 0.15, 1), filter 0.2s ease-out";
            } else {
              // 'pop' — punchy spring overshoot
              hiddenTransform = "scale(0.35)";
              hiddenFilter = "blur(8px)";
              trans = "opacity 0.25s ease-out, transform 0.4s cubic-bezier(0.34, 1.7, 0.64, 1), filter 0.3s ease-out";
            }

            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "none" : hiddenTransform,
                  transition: trans,
                  filter: visible ? "blur(0)" : hiddenFilter,
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
            textShadow: imageFillUrl ? "none" : "0 2px 12px rgba(0,0,0,0.35)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            ...(imageFillStyle || {}),
          }}
        >
          {item.animation === "typewriter" ? displayed : renderStyledText(displayed, { fontSize: item.fontSize })}
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