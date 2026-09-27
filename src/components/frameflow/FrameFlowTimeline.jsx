import React from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { frameLabel } from "./frameFlowPresets";

/** The generated strip — start, the in-betweens, the end frame, each repairable. */
export default function FrameFlowTimeline({ frames, current, onSelect, onRegenerate }) {
  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">GENERATED SEQUENCE</span>
        <span className="ff-dim text-[11px]">
          {frames.length ? `${frames.length} frames · click a frame to inspect` : "Start → in-betweens → end"}
        </span>
      </div>

      <div className="ff-timeline ff-scroll">
        {!frames.length && <div className="ff-empty">Your generated frames will appear here.</div>}

        {frames.map((frame, index) => {
          const locked = index === 0 || index === frames.length - 1;
          return (
            <div
              key={index}
              className={`ff-frame ${index === current ? "is-active" : ""}`}
              onClick={() => onSelect(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(index);
              }}
            >
              <span className="ff-frame-badge">{frameLabel(index, frames.length)}</span>

              {frame.image ? (
                <img src={frame.image} alt={`Frame ${index + 1}`} />
              ) : (
                <span className="ff-frame-hold">
                  {frame.status === "pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "—"}
                </span>
              )}

              <span className="ff-frame-meta">
                <span>F{String(index + 1).padStart(2, "0")}</span>
                <button
                  type="button"
                  className="ff-regen"
                  title={locked ? "Start and end references are locked" : "Regenerate this frame"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRegenerate(index);
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  {locked ? "Locked" : "Redo"}
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}