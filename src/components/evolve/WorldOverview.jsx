import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { FACTIONS } from "@/lib/evolve/constants";

/** Territory held per faction — derived from world ownership, never hardcoded. */
export default function WorldOverview() {
  const { engine } = useEvolve();
  if (!engine) return null;
  const share = engine.factionShare();
  const max = Math.max(0.01, ...FACTIONS.map((f) => share[f.id] || 0));

  return (
    <div className="ev-section">
      <div className="ev-row" style={{ marginBottom: 7 }}>
        <span className="ev-label">Territory</span>
        <span className="ev-label" style={{ color: "#7d90a8" }}>
          {(share.claimed * 100).toFixed(1)}% claimed
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {FACTIONS.map((f) => {
          const v = share[f.id] || 0;
          return (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 46, fontSize: 8.5, letterSpacing: "0.1em", color: "#7d90a8" }}>{f.label}</span>
              <span className="ev-bar" style={{ flex: 1 }}>
                <i style={{ width: `${(v / max) * 100}%`, background: f.color }} />
              </span>
              <span style={{ width: 32, textAlign: "right", fontSize: 9.5, color: "#c9d6e4", fontVariantNumeric: "tabular-nums" }}>
                {(v * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}