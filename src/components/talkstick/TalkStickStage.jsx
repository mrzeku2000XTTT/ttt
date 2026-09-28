import React, { useEffect, useRef, useState } from "react";
import { Eye, Hand, ImagePlus, Maximize2, Minimize2, MousePointer2, Move, Repeat } from "lucide-react";
import AssetLayer from "./AssetLayer";
import { charOrigin, featureBox } from "./talkStickRender";

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
  tool,
  onToolChange,
  onCycle,
  onMoveCharacter,
  charScale,
  onScaleCharacter,
  assets,
  selectedAssetId,
  onSelectAsset,
  onChangeAsset,
  onDeleteAsset,
  onDropFiles,
  children,
}) {
  const [mode, setMode] = useState(null);
  const [full, setFull] = useState(false);
  const cardRef = useRef(null);
  // The pointer's starting point plus the character's position when the drag
  // began, so the character follows the pointer exactly.
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(false);
  const wrapRef = useRef(null);
  // The hand tool turns every press on the stage into a character drag, and the
  // cycle tool turns every press into a step to the next movable thing.
  const movingChar = tool === "hand";
  const cycling = tool === "cycle";

  // Full screen hands the character the whole display for a clean look at it.
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === cardRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else cardRef.current?.requestFullscreen?.();
  };

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
  const box = spot && canvasSize.width ? featureBox(canvasSize, spot, part, charPos, charScale) : null;

  // The character's own frame — shown while the hand tool is held, so the whole
  // character can be dragged around and pulled bigger from the same corner.
  const origin = canvasSize.width ? charOrigin(canvasSize, charPos, charScale) : null;
  const charBox = origin
    ? {
        left: `${(origin.x / canvasSize.width) * 100}%`,
        top: `${(origin.y / canvasSize.height) * 100}%`,
        width: `${charScale * 100}%`,
        height: `${charScale * 100}%`,
      }
    : null;
  const charCorner = origin
    ? {
        left: `${((origin.x + canvasSize.width * charScale) / canvasSize.width) * 100}%`,
        top: `${((origin.y + canvasSize.height * charScale) / canvasSize.height) * 100}%`,
      }
    : null;

  const startMove = (event) => {
    if (!hasImage || !editing) return;
    // The cycle tool places nothing — each press just steps to the next thing
    // you can move, so no button has to be pressed to change the selection.
    if (cycling) {
      event.preventDefault();
      onCycle();
      return;
    }
    // A press on the canvas steps out of whatever asset was selected, so the
    // click that dismisses an asset never nudges the face as well.
    if (selectedAssetId && !movingChar) {
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

  // The hand tool's corner grip scales the whole character, face included.
  const startCharResize = (event) => {
    if (!hasImage || !editing || !movingChar || !origin) return;
    event.preventDefault();
    event.stopPropagation();
    wrapRef.current?.setPointerCapture?.(event.pointerId);
    setMode("charResize");
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
    if (mode === "charResize") {
      // Measured from the character's centre, so it grows around its middle.
      const centre = origin.x + (canvasSize.width * charScale) / 2;
      onScaleCharacter(((point.x - centre) * 2) / canvasSize.width);
      return;
    }
    if (mode === "move") {
      onPlace(point);
      return;
    }
    if (!box) return;
    // Sized from the corner being dragged, so the feature grows with the pointer.
    // The distances are read back into the character's own space, so a feature
    // keeps its share of the face whatever size the character is drawn at.
    onResize({
      width: clamp((((Math.abs(point.x - box.cx) * 2) / charScale) / canvasSize.width) * 100, 3, 95),
      height: clamp((((Math.abs(point.y - box.cy) * 2) / charScale) / canvasSize.width) * 100, 2, 75),
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
        width: `${(box.w / canvasSize.width) * 100}%`,
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
    <main className={`ts-card ts-stage-card ${full ? "is-full" : ""}`} ref={cardRef}>
      <div className="ts-stage-bar">
        <span className="ts-stage-label">Stage</span>
        <div className="ts-stage-actions">
          {hasImage && (
            <>
            {editing && (
              <div className="ts-tools" role="radiogroup" aria-label="Tool">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!movingChar}
                  className={`ts-mode ${movingChar ? "" : "is-on"}`}
                  title="Mouse — click the face to place features, drag props and backgrounds"
                  onClick={() => onToolChange("mouse")}
                >
                  <MousePointer2 className="ts-mode-icon" />
                  Mouse
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={movingChar}
                  className={`ts-mode ${movingChar ? "is-on" : ""}`}
                  title="Hand — drag the whole character around the stage"
                  onClick={() => onToolChange("hand")}
                >
                  <Hand className="ts-mode-icon" />
                  Hand
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={cycling}
                  className={`ts-mode ${cycling ? "is-on" : ""}`}
                  title="Cycle — each click steps to the next thing you can move: the character, then each part, then every prop"
                  onClick={() => onToolChange("cycle")}
                >
                  <Repeat className="ts-mode-icon" />
                  Cycle
                </button>
              </div>
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
            </>
          )}
          <button
            type="button"
            className={`ts-mode ${full ? "is-on" : ""}`}
            onClick={toggleFull}
            title={full ? "Leave full screen" : "Fill the screen with the stage"}
          >
            {full ? <Minimize2 className="ts-mode-icon" /> : <Maximize2 className="ts-mode-icon" />}
            {full ? "Exit" : "Full screen"}
          </button>
        </div>
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
            className={`ts-canvas-wrap ${cycling ? "is-cycling" : ""}`}
            ref={wrapRef}
            onPointerDown={startMove}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <canvas
              ref={canvasRef}
              className={`ts-canvas ${
                mode === "move" || mode === "char" || mode === "charResize" ? "is-dragging" : ""
              } ${movingChar ? "is-moving" : ""} ${editing ? "" : "is-ready"}`}
            />
            {editing && movingChar && charBox && (
              <div className="ts-charbox" style={charBox}>
                {charCorner && (
                  <span
                    className="ts-charbox-corner"
                    style={charCorner}
                    onPointerDown={startCharResize}
                    role="presentation"
                  />
                )}
              </div>
            )}
            {editing && !movingChar && (
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

      {children}
    </main>
  );
}