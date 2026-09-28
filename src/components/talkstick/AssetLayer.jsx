import React, { useState } from "react";
import { Move, Trash2 } from "lucide-react";
import { paintOrder } from "./sceneAssets";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * The draggable overlay for every scene asset.
 *
 * It sits on top of the canvas while the guide is on, and each asset swallows
 * the presses that land on it — so picking up a background or a prop can never
 * move the character's face or trip any of the character controls underneath.
 */
export default function AssetLayer({
  wrapRef,
  assets,
  selectedId,
  onSelect,
  onChange,
  onDelete,
}) {
  const [mode, setMode] = useState(null);

  // Pointer position as a share of the canvas, which is how assets are stored.
  const share = (event) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const start = (event, asset, kind) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect(asset.id);
    setMode({ id: asset.id, kind });
  };

  const move = (event) => {
    if (!mode) return;
    const asset = assets.find((item) => item.id === mode.id);
    const point = share(event);
    if (!asset || !point) return;
    event.stopPropagation();

    if (mode.kind === "move") {
      onChange(asset.id, { x: clamp(point.x, -10, 110), y: clamp(point.y, -10, 110) });
      return;
    }
    // Sized from the corner being pulled, so the asset grows with the pointer.
    onChange(asset.id, { width: clamp(Math.abs(point.x - asset.x) * 2, 3, 220) });
  };

  const end = (event) => {
    if (!mode) return;
    setMode(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="ts-assets">
      {paintOrder(assets).map((asset) => {
        const active = asset.id === selectedId;
        return (
          <div
            key={asset.id}
            className={`ts-asset ${active ? "is-active" : ""} ${mode?.id === asset.id ? "is-busy" : ""}`}
            style={{
              left: `${asset.x}%`,
              top: `${asset.y}%`,
              width: `${asset.width}%`,
              aspectRatio: `${asset.ratio || 1}`,
              // The overlay stacks in the same order the canvas paints, so the
              // stage and the export always agree — and the picked asset stays
              // reachable above the rest.
              zIndex: active ? 2 : 1,
            }}
            onPointerDown={(event) => start(event, asset, "move")}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <img src={asset.url} alt="" draggable={false} />
            {active && (
              <>
                <span className="ts-asset-tag">
                  <Move className="ts-asset-tag-icon" />
                  {asset.name}
                </span>
                <span
                  className="ts-asset-handle"
                  role="presentation"
                  onPointerDown={(event) => start(event, asset, "resize")}
                />
                <button
                  type="button"
                  className="ts-asset-remove"
                  title={`Remove ${asset.name}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(asset.id);
                  }}
                >
                  <Trash2 className="ts-asset-remove-icon" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}