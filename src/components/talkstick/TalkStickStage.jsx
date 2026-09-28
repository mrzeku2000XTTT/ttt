import React, { useState } from "react";
import { Eye, Move } from "lucide-react";

/**
 * The drawing surface.
 *
 * Press anywhere to drop the mouth on the character, then drag it around. The
 * guide around the mouth lives in the DOM rather than on the canvas, so it never
 * ends up in the exported frame, and "Ready view" hides it for a clean look.
 */
export default function TalkStickStage({
  canvasRef,
  stageRef,
  hasImage,
  mouth,
  settings,
  canvasSize,
  editing,
  onToggleEditing,
  onPlace,
}) {
  const [dragging, setDragging] = useState(false);

  const toCanvas = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event) => {
    if (!hasImage || !editing) return;
    const point = toCanvas(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
    onPlace(point);
  };

  const move = (event) => {
    if (!dragging) return;
    const point = toCanvas(event);
    if (point) onPlace(point);
  };

  const end = (event) => {
    if (!dragging) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  // The handle tracks the mouth where it is actually painted, so the drag target
  // and the mouth never drift apart.
  const handle =
    mouth && canvasSize.width
      ? {
          left: `${(mouth.x / canvasSize.width) * 100}%`,
          top: `${((mouth.y + canvasSize.height * (settings.offsetY / 100)) / canvasSize.height) * 100}%`,
          width: `${settings.width}%`,
          height: `${((canvasSize.width * (settings.height / 100)) / canvasSize.height) * 100}%`,
        }
      : null;

  return (
    <main className="ts-card">
      <div className="ts-stage" ref={stageRef}>
        {hasImage && (
          <div
            className="ts-canvas-wrap"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <canvas
              ref={canvasRef}
              className={`ts-canvas ${dragging ? "is-dragging" : ""} ${editing ? "" : "is-ready"}`}
            />
            {editing && handle && (
              <div className={`ts-handle ${dragging ? "is-dragging" : ""}`} style={handle}>
                <Move className="ts-handle-icon" />
              </div>
            )}
          </div>
        )}

        {hasImage && (
          <button
            type="button"
            className={`ts-mode ${editing ? "" : "is-ready"}`}
            aria-pressed={!editing}
            onClick={onToggleEditing}
          >
            {editing ? <Eye className="ts-mode-icon" /> : <Move className="ts-mode-icon" />}
            {editing ? "Ready view" : "Adjust mouth"}
          </button>
        )}

        {!hasImage && (
          <div className="ts-empty">
            <strong>Upload your character</strong>
            <span>Then click directly on its mouth and drag to fine-tune it.</span>
          </div>
        )}
      </div>
    </main>
  );
}