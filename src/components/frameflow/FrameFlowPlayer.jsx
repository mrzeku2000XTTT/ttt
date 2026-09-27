import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { frameLabel } from "./frameFlowPresets";
import { drawContain } from "./frameFlowCrossfade";

function CompareTile({ label, src, active }) {
  return (
    <div className={`ff-compare-tile ${active ? "is-active" : ""}`}>
      <span className="ff-compare-label">{label}</span>
      {src ? (
        <img src={src} alt={label} />
      ) : (
        <span className="ff-dim grid h-full w-full place-items-center text-[10px]">—</span>
      )}
    </div>
  );
}

/**
 * The inspection stage: the selected frame at full size, with the two references
 * underneath it so it is obvious whether an in-between actually matches.
 */
export default function FrameFlowPlayer({ frames, current, playing, onTogglePlay, onSelect, startSrc, endSrc }) {
  const canvasRef = useRef(null);
  const source = frames[current]?.image;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.fillStyle = "#ededed";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawContain(ctx, image, canvas.width, canvas.height);
    };
    image.src = source;
  }, [source]);

  if (!frames.length) {
    return (
      <section className="ff-panel">
        <div className="ff-panel-head">
          <span className="text-[13px] font-bold tracking-[0.06em]">FRAME VIEWER</span>
          <span className="ff-dim text-[11px]">full-size inspection</span>
        </div>
        <div className="ff-empty">
          Generate a sequence and every frame is inspected here at full size, against both references.
        </div>
      </section>
    );
  }

  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">FRAME VIEWER</span>
        <div className="flex items-center gap-3">
          <span className="ff-dim ff-mono-num text-[11px]">
            {frameLabel(current, frames.length)} · F{String(current + 1).padStart(2, "0")} / {frames.length}
          </span>
          <button type="button" className="ff-btn ff-btn-small" onClick={onTogglePlay}>
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="p-[18px]">
        <canvas ref={canvasRef} className="ff-canvas" />

        <div className="ff-compare">
          <CompareTile label="START" src={startSrc} />
          <CompareTile label="THIS FRAME" src={source} active />
          <CompareTile label="END" src={endSrc} />
        </div>

        <div className="mt-[12px] flex items-center gap-[8px]">
          <button type="button" className="ff-btn ff-btn-small" onClick={() => onSelect(current - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min="0"
            max={Math.max(0, frames.length - 1)}
            value={current}
            onChange={(event) => onSelect(Number(event.target.value))}
            className="flex-1 accent-[#c8ff4d]"
            aria-label="Scrub frames"
          />
          <button type="button" className="ff-btn ff-btn-small" onClick={() => onSelect(current + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="ff-dim ff-mono-num text-[11px]">
            {current + 1} / {frames.length}
          </span>
        </div>
      </div>
    </section>
  );
}