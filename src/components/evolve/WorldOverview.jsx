import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { orgColor } from "@/lib/evolve/constants";

/**
 * Territory overview — derived from actual org ownership, never hardcoded.
 * At genesis, 0% of the world is claimed. Territory appears only when
 * organizations purchase assets and claim surrounding tiles.
 */
export default function WorldOverview() {
  const { engine } = useEvolve();
  if (!engine) return null;
  const share = engine.factionShare();
  const orgEntries = Object.entries(share).filter(([k]) => k !== "claimed" && share[k] > 0);

  return (
    <div className="ev-section">
      <div className="ev-row" style={{ marginBottom: 7 }}>
        <span className="ev-label">Territory</span>
        <span className="ev-label" style={{ color: "#7d90a8" }}>
          {(share.claimed * 100).toFixed(1)}% claimed
        </span>
      </div>
      {orgEntries.length === 0 ? (
        <div style={{ fontSize: 9.5, color: "#54657c", letterSpacing: "0.1em" }}>NO TERRITORY CLAIMED YET</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {orgEntries.slice(0, 8).map(([orgId, v]) => {
            const org = engine.orgs.find((o) => o.id === orgId);
            const color = org?.color || orgColor(orgId);
            const name = org?.name || orgId;
            return (
              <div key={orgId} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 80, fontSize: 8, letterSpacing: "0.06em", color: "#7d90a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                <span className="ev-bar" style={{ flex: 1 }}>
                  <i style={{ width: `${v * 100 / Math.max(0.001, share.claimed)}%`, background: color }} />
                </span>
                <span style={{ width: 32, textAlign: "right", fontSize: 9.5, color: "#c9d6e4", fontVariantNumeric: "tabular-nums" }}>
                  {(v * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}