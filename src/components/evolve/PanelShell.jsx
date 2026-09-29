import React from "react";
import { X } from "lucide-react";

/** Shared chrome for every inspector and sheet. */
export default function PanelShell({ title, subtitle, onClose, children, side = "right", width = 340 }) {
  const style =
    side === "right"
      ? { top: 0, right: 0, bottom: 0, width, maxWidth: "94%" }
      : { top: 0, left: 0, bottom: 0, width, maxWidth: "94%" };

  return (
    <div className="ev-sheet ev-scroll" style={style}>
      <div className="ev-panel-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ev-panel-title" style={{ color: "#eef3f9", fontSize: 11, letterSpacing: "0.1em" }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 9, color: "#54657c", marginTop: 2, letterSpacing: "0.06em" }}>{subtitle}</div>
          ) : null}
        </div>
        {onClose ? (
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={onClose} title="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="ev-panel-body ev-scroll">{children}</div>
    </div>
  );
}