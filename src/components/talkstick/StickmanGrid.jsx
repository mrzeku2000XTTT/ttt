import React, { useEffect, useRef } from "react";
import { STICKMEN, drawStickman } from "./stickmen";

const TILE_W = 56;
const TILE_H = 70;

/** One stickman, drawn with the same renderer the stage uses. */
function StickTile({ id }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = TILE_W * dpr;
    canvas.height = TILE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, TILE_W, TILE_H);
    drawStickman(ctx, id, TILE_W, TILE_H);
  }, [id]);

  return <canvas ref={ref} className="ts-stick-canvas" style={{ width: TILE_W, height: TILE_H }} />;
}

/** The ten ready-made characters, each in a different action. */
export default function StickmanGrid({ value, onChange }) {
  return (
    <div className="ts-stick-grid" role="radiogroup" aria-label="Stickman">
      {STICKMEN.map((stickman) => (
        <button
          key={stickman.id}
          type="button"
          role="radio"
          aria-checked={value === stickman.id}
          title={stickman.hint}
          className={`ts-stick-tile ${value === stickman.id ? "is-active" : ""}`}
          onClick={() => onChange(stickman.id)}
        >
          <StickTile id={stickman.id} />
          <span className="ts-stick-name">{stickman.label}</span>
        </button>
      ))}
    </div>
  );
}