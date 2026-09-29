import React from "react";

/** Every decision an agent has taken, inspectable in order. */
export default function DecisionHistory({ decisions = [] }) {
  if (!decisions.length) {
    return <div style={{ fontSize: 10, color: "#54657c" }}>No decisions recorded yet.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {decisions.map((d, i) => (
        <div key={d.id || i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(120,160,200,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#22d3ee" }}>{d.action}</span>
            {d.cost !== undefined ? (
              <span style={{ fontSize: 9.5, color: "#f87171", fontVariantNumeric: "tabular-nums" }}>−{Number(d.cost).toFixed(2)}</span>
            ) : null}
          </div>
          {d.note ? <div style={{ fontSize: 10, color: "#9fb0c4", marginTop: 2, lineHeight: 1.35 }}>{d.note}</div> : null}
        </div>
      ))}
    </div>
  );
}