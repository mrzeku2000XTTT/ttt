import React from "react";
import { Lock, Image as ImageIcon, FileText } from "lucide-react";

/**
 * What the phone shows once it is unlocked: the schedule exactly as it was handed
 * over — the screenshot that was dropped, or the text that was pasted, untouched.
 * It was kept in this browser, so it is read from here too.
 */
export default function ScheduleSheet({ brief, open, onLock }) {
  const text = brief?.sourceText || "";
  const shot = brief?.sourcePreview || "";

  return (
    <div className={`nudge-unlocked ${open ? "is-open" : ""}`}>
      <div className="nudge-unlocked-head">
        <span className="nudge-unlocked-title">
          {shot ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          Original schedule
        </span>
        <button
          type="button"
          className="nudge-ghost ml-auto"
          style={{ height: 28, padding: "0 9px" }}
          onClick={onLock}
        >
          <Lock className="w-3 h-3" /> Lock
        </button>
      </div>

      <div className="nudge-unlocked-body">
        {shot ? <img className="nudge-unlocked-shot" src={shot} alt="The schedule you gave NUDGE" /> : null}

        {text ? <pre className="nudge-unlocked-text">{text}</pre> : null}

        {!shot && !text ? (
          <p className="nudge-unlocked-empty">
            This brief was made before NUDGE started keeping a copy of the original.
          </p>
        ) : null}
      </div>

      {brief?.source ? <p className="nudge-unlocked-foot">{brief.source}</p> : null}
    </div>
  );
}