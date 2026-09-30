import React, { useState } from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerBuild — available simulated assets with cost/resources/production.
 * Building creates real WorldAsset state via engine.playerBuild.
 */
const BUILDINGS = [
  { kind: "energy", label: "ENERGY NODE", cost: 4, produces: "energy", rate: 0.08, desc: "Passive energy income" },
  { kind: "compute", label: "COMPUTE NODE", cost: 5, produces: "compute", rate: 0.06, desc: "Compute capacity" },
  { kind: "server", label: "SERVER", cost: 8, produces: "data", rate: 0.05, desc: "Data processing" },
  { kind: "storage", label: "STORAGE", cost: 3, produces: "storage", rate: 0.04, desc: "Resource storage" },
];

export default function PlayerBuild({ onClose }) {
  const { engine, currentPlayer, buildAsset, selectedSpawnCell, chainBalances } = useEvolve();
  const [sel, setSel] = useState(null);

  if (!engine || !currentPlayer) return null;
  const cell = selectedSpawnCell || currentPlayer.position;
  const geoLat = selectedSpawnCell?.centerLat ?? currentPlayer.geo_lat ?? null;
  const geoLng = selectedSpawnCell?.centerLng ?? currentPlayer.geo_lng ?? null;

  return (
    <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, maxHeight: "55vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">BUILD · CELL {cell.x},{cell.y}</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll" style={{ padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {BUILDINGS.map((b) => {
            const canAfford = (chainBalances.balanceFor(currentPlayer) ?? -1) >= b.cost;
            const isSel = sel === b.kind;
            return (
              <button
                key={b.kind}
                onClick={() => setSel(b.kind)}
                style={{
                  textAlign: "left", padding: 10, borderRadius: 6, cursor: "pointer",
                  background: isSel ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSel ? "rgba(34,211,238,0.5)" : C.line}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? C.cyan : C.text }}>{b.label}</div>
                <div style={{ fontSize: 9, color: C.textFaint, marginTop: 4 }}>{b.desc}</div>
                <div style={{ fontSize: 10, color: canAfford ? C.green : C.red, marginTop: 6, fontWeight: 700 }}>{b.cost} tKAS</div>
                <div style={{ fontSize: 8, color: C.textDim, marginTop: 2 }}>+{b.rate}/tick {b.produces}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.textFaint }}>BALANCE: <LiveBalance actor={currentPlayer} unit /></span>
          <button className="ev-btn" disabled={!sel} onClick={() => { const r = buildAsset({ kind: sel, x: cell.x, y: cell.y, geoLat, geoLng }); if (r?.ok) setSel(null); }}>BUILD</button>
        </div>
      </div>
    </div>
  );
}