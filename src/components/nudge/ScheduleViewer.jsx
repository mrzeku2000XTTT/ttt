import React, { useState } from "react";
import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";

/**
 * The schedule alone, as big as the phone allows — a screenshot at whatever size
 * the reader needs, or the pasted text at a size that is easy on the eyes.
 */
export default function ScheduleViewer({ open, brief, onClose }) {
  const [scale, setScale] = useState(1);

  if (!open) return null;

  const shot = brief?.sourcePreview || "";
  const text = brief?.sourceText || "";
  const size = (step) => setScale((cur) => Math.min(4, Math.max(1, Number((cur + step).toFixed(1)))));

  return (
    <div className="nudge-viewer">
      <div className="nudge-viewer-head">
        <button type="button" className="nudge-app-back" onClick={onClose} aria-label="Back to the schedule">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="nudge-app-title">The schedule you gave me</span>
      </div>

      <div className="nudge-viewer-stage">
        {shot ? (
          <img
            className="nudge-viewer-shot"
            src={shot}
            alt="Your schedule, full size"
            style={{ width: `${Math.round(scale * 100)}%` }}
          />
        ) : null}
        {text ? <p className="nudge-viewer-text">{text}</p> : null}
        {!shot && !text ? <p className="nudge-doc-empty">There is no original kept with this brief.</p> : null}
      </div>

      {brief?.source ? <p className="nudge-doc-foot nudge-viewer-name">{brief.source}</p> : null}

      <div className="nudge-viewer-foot">
        {shot ? (
          <>
            <button type="button" className="nudge-big" onClick={() => size(-0.5)} disabled={scale <= 1}>
              <ZoomOut className="w-4 h-4" /> Smaller
            </button>
            <button type="button" className="nudge-big" onClick={() => size(0.5)} disabled={scale >= 4}>
              <ZoomIn className="w-4 h-4" /> Bigger
            </button>
          </>
        ) : null}
        <button type="button" className="nudge-big" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}