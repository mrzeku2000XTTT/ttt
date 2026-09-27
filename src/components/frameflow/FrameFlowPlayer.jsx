import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { drawContain } from "./frameFlowCrossfade";

/** Frame-by-frame viewer: scrub the strip or play it back at the shot's fps. */
export default function FrameFlowPlayer({ frames, current, playing, onTogglePlay, onSelect }) {
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

  if (!frames.length) return null;

  return (
    <section className="ff-panel">
      <div className="ff-panel-head">
        <span className="text-[13px] font-bold tracking-[0.06em]">FRAME VIEWER</span>
        <button type="button" className="ff-btn ff-btn-small" onClick={onTogglePlay}>
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div className="p-[18px]">
        <canvas ref={canvasRef} className="ff-canvas" />

        <div className="mt-[10px] flex items-center gap-[8px]">
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