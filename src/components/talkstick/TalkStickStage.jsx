import React, { useRef, useState } from "react";
import { Eye, Hand, ImagePlus, Move } from "lucide-react";
import AssetLayer from "./AssetLayer";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * The drawing surface.
 *
 * Press anywhere to drop the active feature on the character, drag to position
 * it, and pull the corner handle to resize it. The guide lives in the DOM rather
 * than on the canvas, so it never ends up in the exported frame, and "Ready view"
 * hides it for a clean look.
 */
export default function TalkStickStage({
  canvasRef,
  stageRef,
  hasImage,
  activePart,
  spot,
  part,
  canvasSize,
  editing,
  onToggleEditing,
  onPlace,
  onResize,
  charPos,
  movingChar,
  onToggleMovingChar,
  onMoveCharacter,
  assets,
  selectedAssetId,
  onSelectAsset,
  onChangeAsset,
  onDeleteAsset,
  onDropFiles,
}) {
  const [mode, setMode] = useState(null);
  // The pointer's starting point plus the character's position when the drag
  // began, so the character follows the pointer exactly.
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(false);
  const wrapRef = useRef(null);

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

  // Where the active feature actually sits, in canvas pixels.
  const box =
    spot && canvasSize.width
      ? {
          cx: spot.x + charPos.x,
          cy: spot.y + charPos.y + canvasSize.height * (part.offsetY / 100),
          w: canvasSize.width * (part.width / 100),
          h: canvasSize.width * (part.height / 100),
        }
      : null;

  const startMove = (event) => {
    if (!hasImage || !editing) return;
    // A press on the canvas steps out of whatever asset was selected, so the
    // click that dismisses an asset never nudges the face as well.
    if (selectedAssetId) {
      onSelectAsset(null);
      return;
    }
    const point = toCanvas(event);
    if (!point) return;
    event.preventDefault();
    wrapRef.current?.setPointerCapture?.(event.pointerId);
    if (movingChar) {
      setDrag({ start: point, origin: charPos });
      setMode("char");
      return;
    }
    setMode("move");
    onPlace(point);
  };

  const startResize = (event) => {
    if (!hasImage || !editing || !box) return;
    event.preventDefault();
    event.stopPropagation();
    wrapRef.current?.setPointerCapture?.(event.pointerId);
    setMode("resize");
  };

  const move = (event) => {
    if (!mode) return;
    const point = toCanvas(event);
    if (!point) return;

    if (mode === "char") {
      if (!drag) return;
      onMoveCharacter({
        x: drag.origin.x + (point.x - drag.start.x),
        y: drag.origin.y + (point.y - drag.start.y),
      });
      return;
    }
    if (mode === "move") {
      onPlace(point);
      return;
    }
    if (!box) return;
    // Sized from the corner being dragged, so the feature grows with the pointer.
    onResize({
      width: clamp(((Math.abs(point.x - box.cx) * 2) / canvasSize.width) * 100, 3, 95),
      height: clamp(((Math.abs(point.y - box.cy) * 2) / canvasSize.width) * 100, 2, 75),
    });
  };

  const end = (event) => {
    if (!mode) return;
    setMode(null);
    setDrag(null);
    wrapRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!over) setOver(true);
  };

  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setOver(false);
    onDropFiles(Array.from(event.dataTransfer?.files || []));
  };

  const guideStyle = box
    ? {
        left: `${(box.cx / canvasSize.width) * 100}%`,
        top: `${(box.cy / canvasSize.height) * 100}%`,
        width: `${part.width}%`,
        height: `${(box.h / canvasSize.height) * 100}%`,
      }
    : null;

  const cornerStyle = box
    ? {
        left: `${((box.cx + box.w / 2) / canvasSize.width) * 100}%`,
        top: `${((box.cy + box.h / 2) / canvasSize.height) * 100}%`,
      }
    : null;

  return (
    <main className="ts-card ts-stage-card">
      <div className="ts-stage-bar">
        <span className="ts-stage-label">Stage</span>
        {hasImage && (
          <div className="ts-stage-actions">
            {editing && (
              <button
                type="button"
                className={`ts-mode ${movingChar ? "is-on" : ""}`}
                aria-pressed={movingChar}
                onClick={onToggleMovingChar}
              >
                <Hand className="ts-mode-icon" />
                {movingChar ? "Moving character" : "Move character"}
              </button>
            )}
            <button
              type="button"
              className={`ts-mode ${editing ? "" : "is-ready"}`}
              aria-pressed={!editing}
              onClick={onToggleEditing}
            >
              {editing ? <Eye className="ts-mode-icon" /> : <Move className="ts-mode-icon" />}
              {editing ? "Ready view" : "Adjust face"}
            </button>
          </div>
        )}
      </div>

      <div
        className={`ts-stage ${over ? "is-over" : ""}`}
        ref={stageRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasImage && (
          <div
            className="ts-canvas-wrap"
            ref={wrapRef}
            onPointerDown={startMove}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <canvas
              ref={canvasRef}
              className={`ts-canvas ${
                mode === "move" || mode === "char" ? "is-dragging" : ""
              } ${movingChar ? "is-moving" : ""} ${editing ? "" : "is-ready"}`}
            />
            {editing && (
              <AssetLayer
                wrapRef={wrapRef}
                assets={assets}
                selectedId={selectedAssetId}
                onSelect={onSelectAsset}
                onChange={onChangeAsset}
                onDelete={onDeleteAsset}
              />
            )}
            {editing && !movingChar && !selectedAssetId && guideStyle && (
              <div className={`ts-guide ${mode ? "is-active" : ""}`} style={guideStyle}>
                <Move className="ts-guide-icon" />
                {cornerStyle && (
                  <span
                    className="ts-guide-corner"
                    style={cornerStyle}
                    onPointerDown={startResize}
                    role="presentation"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {over && (
          <div className="ts-drop">
            <ImagePlus className="ts-drop-icon" />
            Drop to place it
          </div>
        )}

        {!hasImage && (
          <div className="ts-empty">
            <strong>Upload your character</strong>
            <span>Then click directly on its face and drag to fine-tune it — or drop an image anywhere on this stage.</span>
          </div>
        )}
      </div>
    </main>
  );
}