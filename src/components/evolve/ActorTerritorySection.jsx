import React, { useEffect, useState } from "react";
import { getActorTerritory } from "@/lib/evolve/geoTerritoryService";
import { getControllerColor } from "@/lib/evolve/controllerColor";
import { useEvolve } from "@/lib/evolve/useEvolve";

/**
 * ActorTerritorySection — the land this actor currently controls.
 *
 * Reads the authoritative ownership layer scoped to ONE actor (never the whole
 * planet), shows the acquisition mix, and lists each cell with the actor's own
 * identity colour marker. Clicking a row selects that cell, which opens the Cell
 * Inspector.
 *
 * Only real fields are shown; a category with no data is omitted rather than
 * rendered empty.
 */
export default function ActorTerritorySection({ actorId, onSelectCell }) {
  const { experimentId } = useEvolve();
  const [cells, setCells] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!actorId || !experimentId) {
      setCells(null);
      return undefined;
    }
    (async () => {
      try {
        const res = await getActorTerritory({ experimentId, actorId, actorType: "AI" });
        if (!cancelled) setCells(res?.cells || []);
      } catch {
        if (!cancelled) setCells([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actorId, experimentId]);

  const color = getControllerColor(actorId);

  if (!cells) {
    return (
      <div className="ev-section">
        <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#54657c", marginBottom: 6 }}>TERRITORY</div>
        <div style={{ fontSize: 10, color: "#7d90a8" }}>Loading…</div>
      </div>
    );
  }

  const economic = cells.filter((c) => c.claim_source === "ECONOMIC_EXPANSION");
  const spawn = cells.filter((c) => c.claim_source !== "ECONOMIC_EXPANSION");

  return (
    <div className="ev-section">
      <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#54657c", marginBottom: 6 }}>TERRITORY</div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
        <span style={{ fontSize: 9, color: "#54657c" }}>CONTROLLED CELLS</span>
        <span style={{ fontSize: 11, color: "#eef3f9", fontWeight: 600 }}>{cells.length}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
        <span style={{ fontSize: 9, color: "#54657c" }}>SPAWN CELLS</span>
        <span style={{ fontSize: 11, color: "#eef3f9", fontWeight: 600 }}>{spawn.length}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
        <span style={{ fontSize: 9, color: "#54657c" }}>ECONOMIC CLAIMS</span>
        <span style={{ fontSize: 11, color: "#eef3f9", fontWeight: 600 }}>{economic.length}</span>
      </div>

      {cells.length === 0 ? (
        <div style={{ fontSize: 9.5, color: "#7d90a8", marginTop: 6 }}>No territory controlled</div>
      ) : (
        <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 4 }}>
          {cells.map((c) => {
            const isEconomic = c.claim_source === "ECONOMIC_EXPANSION";
            const settled = isEconomic && c.claim_tx_id;
            return (
              <button
                key={c.cell_id}
                onClick={() => onSelectCell?.(c)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  width: "100%",
                  padding: "5px 6px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(120,160,200,0.14)",
                  borderRadius: 4,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    flex: "0 0 auto",
                    marginTop: 2,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 9.5, color: "#eef3f9", fontWeight: 600 }}>
                    {c.cell_id}
                  </span>
                  <span style={{ display: "block", fontSize: 8, color: "#7d90a8", letterSpacing: "0.06em" }}>
                    {isEconomic
                      ? `ECONOMIC EXPANSION · ${(Number(c.claim_amount_sompi || 0) / 1e8).toFixed(2)} tKAS`
                      : "SPAWN"}
                  </span>
                  {settled ? (
                    <span style={{ display: "block", fontSize: 8, color: "#34d399", letterSpacing: "0.06em" }}>
                      VERIFIED · TN10
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}