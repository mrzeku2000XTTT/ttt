import React, { useState } from "react";
import { Type } from "lucide-react";
import { layoutCaption } from "./captionText";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * The draggable overlay for the caption.
 *
 * The caption itself is painted onto the canvas, so this only marks the block the
 * words were wrapped inside: drag it anywhere on the frame to move it, and pull
 * the corner to change the width the words wrap to — which is what turns one long
 * line into a handful of readable ones. It swallows its own presses, so picking up
 * the caption can never nudge the face or a prop underneath.
 */
export default function CaptionLayer({
  canvasRef,
  canvasSize,
  caption,
  selected,
  onSelect,
  onChange,
}) {
  const [mode, setMode] = useState(null);

  // Measured with the very same layout the renderer uses, so the outline always
  // sits exactly where the words were painted.
  const ctx = canvasRef.current?.getContext("2d");
  const box = ctx && canvasSize.width ? layoutCaption(ctx, canvasSize, caption) : null;
  if (!box) return null;

  const cxPct = (box.cx / canvasSize.width) * 100;
  const topPct = (box.top / canvasSize.height) * 100;
  const widthPct = (box.boxW / canvasSize.width) * 100;
  const heightPct = (box.blockHeight / canvasSize.height) * 100;

  // Pointer position as a share of the canvas, which is how the caption is stored.
  const share = (event) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const start = (event, kind) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect(true);
    setMode(kind);
  };

  const move = (event) => {
    if (!mode) return;
    const point = share(event);
    if (!point) return;
    event.stopPropagation();

    if (mode === "move") {
      onChange({ x: clamp(point.x, 0, 100) / 100, y: clamp(point.y, 0, 100) / 100 });
      return;
    }
    // Sized from the corner being pulled, so the block grows with the pointer and
    // the words re-wrap to the width it is given.
    onChange({ width: clamp((Math.abs(point.x - cxPct) * 2) / 100, 0.2, 0.98) });
  };

  const end = (event) => {
    if (!mode) return;
    setMode(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="ts-captions">
      <div
        className={`ts-caption ${selected ? "is-active" : ""} ${mode ? "is-busy" : ""}`}
        style={{
          left: `${cxPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: `${heightPct}%`,
        }}
        onPointerDown={(event) => start(event, "move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {selected && (
          <>
            <span className="ts-caption-tag">
              <Type className="ts-caption-tag-icon" />
              Caption
            </span>
            <span
              className="ts-caption-handle"
              role="presentation"
              title="Drag to set how wide the words wrap"
              onPointerDown={(event) => start(event, "resize")}
            />
          </>
        )}
      </div>
    </div>
  );
}