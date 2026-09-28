import React from "react";
import { Image as ImageIcon, FileText, Maximize2 } from "lucide-react";

/**
 * The schedule exactly as it was handed over — the screenshot that was dropped, or
 * the text that was pasted. Tapping it opens it full screen, because a schedule is
 * easier to read when it is the only thing on the screen.
 */
export default function ScheduleSheet({ brief, onOpen }) {
  const text = brief?.sourceText || "";
  const shot = brief?.sourcePreview || "";
  const kept = Boolean(shot || text);

  return (
    <div className="nudge-doc">
      {shot ? (
        <button type="button" className="nudge-src" onClick={onOpen}>
          <img className="nudge-doc-shot" src={shot} alt="The schedule you gave NUDGE" />
          <span className="nudge-src-open">
            <Maximize2 className="w-3.5 h-3.5" /> Open full screen
          </span>
        </button>
      ) : null}

      {text ? (
        <button type="button" className="nudge-src" onClick={onOpen}>
          <span className="nudge-doc-text">{text}</span>
          <span className="nudge-src-open">
            <Maximize2 className="w-3.5 h-3.5" /> Open full screen
          </span>
        </button>
      ) : null}

      {!kept ? (
        <p className="nudge-doc-empty">
          {brief
            ? "This brief was made before NUDGE started keeping a copy of the original."
            : "No schedule yet. Build a brief on the panel and its original lands here."}
        </p>
      ) : null}

      {brief?.source ? (
        <p className="nudge-doc-foot">
          {shot ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          {brief.source}
        </p>
      ) : null}
    </div>
  );
}