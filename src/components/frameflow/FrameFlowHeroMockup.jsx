import React from "react";
import { Play } from "lucide-react";

const STRIP = ["START", "F02", "F03", "F04", "F05", "END"];

/**
 * A live preview of what the studio produces: the frame strip that fills in as
 * the in-betweens arrive. Built in HTML, never a screenshot.
 */
export default function FrameFlowHeroMockup({ startSrc, endSrc }) {
  return (
    <div className="ff-panel overflow-hidden p-4">
      <div className="ff-row mb-3">
        <span className="ff-dim text-[10px] tracking-[0.14em] uppercase">Generated sequence</span>
        <span className="ff-mono-num ff-dim text-[10px]">8 in-betweens · 12 fps</span>
      </div>

      <div className="flex gap-2 overflow-hidden">
        {STRIP.map((label, index) => {
          const isStart = index === 0;
          const isEnd = index === STRIP.length - 1;
          const src = isStart ? startSrc : isEnd ? endSrc : null;
          const locked = (isStart && startSrc) || (isEnd && endSrc);

          return (
            <div
              key={label}
              className="relative flex-1 overflow-hidden rounded-[10px] border"
              style={{
                borderColor: index === 3 ? "#c8ff4d" : "#292c30",
                background: "#0e1011",
                aspectRatio: "3 / 4",
              }}
            >
              <span className="absolute left-1.5 top-1.5 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[8px] tracking-[0.08em]">
                {label}
              </span>
              {src ? (
                <img src={src} alt={label} className="h-full w-full object-cover" />
              ) : (
                <span
                  className="grid h-full w-full place-items-center"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 6px, transparent 6px 12px)",
                  }}
                >
                  <span className="ff-dim text-[8px] tracking-[0.08em]">{locked ? "" : "AI"}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-[#292c30] pt-3">
        <span className="ff-btn ff-btn-small">
          <Play className="h-3 w-3" />
          Play
        </span>
        <span className="h-1 flex-1 rounded-full bg-[#292c30]">
          <span className="block h-1 w-[42%] rounded-full bg-[#c8ff4d]" />
        </span>
        <span className="ff-mono-num ff-dim text-[10px]">04 / 10</span>
      </div>

      <p className="ff-dim mt-3 text-[10px] tracking-[0.06em] uppercase">
        Regenerate any single in-between without rebuilding the shot
      </p>
    </div>
  );
}