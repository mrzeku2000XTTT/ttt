import React from "react";
import { Loader2 } from "lucide-react";
import { frameLabel } from "./frameFlowPresets";

/** Every frame of the sequence at once — the whole sheet, start to end. */
export default function FrameFlowSpriteSheet({ frames, current, onSelect }) {
  if (frames.length < 2) return null;

  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">SPRITE SHEET</span>
        <span className="ff-dim text-[11px]">{frames.length} frames · click any frame to inspect it</span>
      </div>

      <div className="ff-sheet">
        {frames.map((frame, index) => (
          <button
            key={index}
            type="button"
            className={`ff-sheet-tile ${index === current ? "is-active" : ""}`}
            onClick={() => onSelect(index)}
          >
            <span className="ff-sheet-label">
              {frameLabel(index, frames.length)} · F{String(index + 1).padStart(2, "0")}
            </span>
            {frame.image ? (
              <img src={frame.image} alt={`Frame ${index + 1}`} />
            ) : (
              <span className="ff-frame-hold">
                {frame.status === "error" ? "—" : <Loader2 className="h-4 w-4 animate-spin" />}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}