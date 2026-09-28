import React, { useEffect, useRef } from "react";
import { MOUTH_STYLES, drawMouth } from "./mouthStyles";

const TILE_W = 60;
const TILE_H = 42;
// The look each tile is sampled at — open enough to tell the shapes apart.
const TILE_LEVEL = 0.72;

/** One mouth look, drawn with the same renderer the stage uses. */
function StyleTile({ id }) {
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
    ctx.translate(TILE_W / 2, TILE_H / 2);
    drawMouth(ctx, id, {
      w: TILE_W * 0.68,
      open: TILE_H * 0.66,
      level: TILE_LEVEL,
      weight: 2.4,
    });
  }, [id]);

  return <canvas ref={ref} className="ts-style-canvas" style={{ width: TILE_W, height: TILE_H }} />;
}

/** The library of animated mouth looks. */
export default function MouthStyleGrid({ value, onChange }) {
  return (
    <div className="ts-style-grid" role="radiogroup" aria-label="Mouth look">
      {MOUTH_STYLES.map((style) => (
        <button
          key={style.id}
          type="button"
          role="radio"
          aria-checked={value === style.id}
          title={style.hint}
          className={`ts-style-tile ${value === style.id ? "is-active" : ""}`}
          onClick={() => onChange(style.id)}
        >
          <StyleTile id={style.id} />
          <span className="ts-style-name">{style.label}</span>
        </button>
      ))}
    </div>
  );
}