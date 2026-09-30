import React, { createContext, useContext } from "react";
import { X } from "lucide-react";

/**
 * Every inspector uses the same chrome. In "sheet" mode it floats over the world
 * (the map stays visible); in "center" mode the left navigation has switched the
 * main area to this view.
 */
const PaneMode = createContext("sheet");
export const PaneModeProvider = PaneMode.Provider;
export const usePaneMode = () => useContext(PaneMode);

export default function PanelShell({ title, subtitle, onClose, children, side = "right", width = 340 }) {
  const mode = usePaneMode();

  // Centre mode is a real page in the middle column — the same shape the Agents
  // roster uses. It must stay in normal flow: applying the floating `.ev-sheet`
  // chrome there took the panel out of layout and let it overlap its neighbours.
  const center = mode === "center";

  const style = center
    ? { flex: 1, minWidth: 0, minHeight: 0, border: "none" }
    : side === "right"
    ? { position: "absolute", top: 0, right: 0, bottom: 0, width, maxWidth: "94%", zIndex: 30 }
    : { position: "absolute", top: 0, left: 0, bottom: 0, width, maxWidth: "94%", zIndex: 30 };

  return (
    <div className={`ev-scroll ${center ? "ev-panel" : "ev-sheet"}`} style={style}>
      <div className="ev-panel-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ev-panel-title" style={{ color: "#eef3f9", fontSize: 11, letterSpacing: "0.1em" }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 9, color: "#54657c", marginTop: 2, letterSpacing: "0.06em" }}>{subtitle}</div> : null}
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