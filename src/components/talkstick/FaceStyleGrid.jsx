import React, { useEffect, useRef } from "react";

const TILE_W = 60;
const TILE_H = 42;

/** One option, drawn with the same renderer the stage uses. */
function StyleTile({ id, preview }) {
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
    ctx.save();
    ctx.translate(TILE_W / 2, TILE_H / 2);
    preview(ctx, id);
    ctx.restore();
  }, [id, preview]);

  return <canvas ref={ref} className="ts-style-canvas" style={{ width: TILE_W, height: TILE_H }} />;
}

/** A grid of visual choices — mouth looks, eye styles, nose shapes, eye animations. */
export default function FaceStyleGrid({ options, value, onChange, preview }) {
  return (
    <div className="ts-style-grid" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          title={option.hint}
          className={`ts-style-tile ${value === option.id ? "is-active" : ""}`}
          onClick={() => onChange(option.id)}
        >
          <StyleTile id={option.id} preview={preview} />
          <span className="ts-style-name">{option.label}</span>
        </button>
      ))}
    </div>
  );
}