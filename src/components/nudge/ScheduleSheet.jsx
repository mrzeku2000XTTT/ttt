import React from "react";
import { Image as ImageIcon, FileText } from "lucide-react";

/**
 * The Schedule app: the schedule exactly as it was handed over — the screenshot
 * that was dropped, or the text that was pasted, untouched. It was kept in this
 * browser, so it is read from here too.
 */
export default function ScheduleSheet({ brief }) {
  const text = brief?.sourceText || "";
  const shot = brief?.sourcePreview || "";

  return (
    <div className="nudge-doc">
      {shot ? <img className="nudge-doc-shot" src={shot} alt="The schedule you gave NUDGE" /> : null}

      {text ? <pre className="nudge-doc-text">{text}</pre> : null}

      {!shot && !text ? (
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