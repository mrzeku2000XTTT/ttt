import React, { useEffect, useRef } from "react";
import { CAPTION_TEMPLATES, drawCaption } from "./captionText";

// The tile is drawn at a size where every template reads clearly, then scaled to
// fit the panel — the same renderer the stage uses, so nothing can drift.
const TILE_W = 200;
const TILE_H = 100;
const SAMPLE = "TALK";

/** One template, drawn for real. */
function Tile({ template, colour, accent, active, onPick }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCaption(ctx, canvas, { text: SAMPLE, template: template.id, color: colour, accent });
  }, [template, colour, accent]);

  return (
    <button
      type="button"
      className={`ts-template-tile ${active ? "is-active" : ""}`}
      onClick={() => onPick(template.id)}
      title={template.name}
    >
      <canvas ref={ref} width={TILE_W} height={TILE_H} className="ts-template-canvas" />
      <span className="ts-template-name">{template.name}</span>
    </button>
  );
}

/** The text library: pick a look and the caption takes it on immediately. */
export default function TextTemplatePicker({ value, colour, accent, onChange }) {
  return (
    <div className="ts-template-grid">
      {CAPTION_TEMPLATES.map((template) => (
        <Tile
          key={template.id}
          template={template}
          colour={colour}
          accent={accent}
          active={template.id === value}
          onPick={onChange}
        />
      ))}
    </div>
  );
}