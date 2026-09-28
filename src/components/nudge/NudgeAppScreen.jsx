import React from "react";
import { ArrowLeft } from "lucide-react";

/** The frame every app opens into: a way back to the home screen, and a scrolling body. */
export default function NudgeAppScreen({ title, onHome, children }) {
  return (
    <div className="nudge-app">
      <div className="nudge-app-head">
        <button type="button" className="nudge-app-back" onClick={onHome} aria-label="Back to the home screen">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <span className="nudge-app-title">{title}</span>
      </div>
      <div className="nudge-app-body">{children}</div>
    </div>
  );
}