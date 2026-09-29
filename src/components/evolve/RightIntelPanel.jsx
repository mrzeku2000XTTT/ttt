import React from "react";
import WorldMinimap from "./WorldMinimap";
import RecentEvents from "./RecentEvents";
import WorldOverview from "./WorldOverview";

/** Right-hand intelligence column: minimap, live events, territory. */
export default function RightIntelPanel({ cam, setCam, mapSize, onPickEvent }) {
  return (
    <aside className="ev-intel ev-panel" style={{ borderTop: "none", borderBottom: "none", borderRight: "none" }}>
      <WorldMinimap cam={cam} setCam={setCam} mapSize={mapSize} />
      <WorldOverview />
      <div className="ev-panel-head" style={{ borderTop: "1px solid rgba(120,160,200,0.1)" }}>
        <span className="ev-panel-title">Recent Events</span>
      </div>
      <RecentEvents limit={60} onPick={onPickEvent} />
    </aside>
  );
}