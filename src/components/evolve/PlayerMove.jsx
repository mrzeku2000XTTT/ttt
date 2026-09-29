import React, { useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerMove — select destination gameplay cell.
 * Shows distance, energy cost, travel time, country, economic conditions.
 * Confirm MOVE — map should animate actor movement (camera follows).
 */
export default function PlayerMove({ onClose, onMoved }) {
  const { engine, currentPlayer, movePlayer } = useEvolve();
  const [dest, setDest] = useState(null);

  if (!engine || !currentPlayer) return null;
  const p = currentPlayer;

  const dist = dest ? Math.abs(p.position.x - dest.x) + Math.abs(p.position.y - dest.y) : 0;
  const energyCost = dist * 0.05;
  const kasCost = energyCost * 0.5;
  const canMove = dest && dist > 0 && p.assets.energy >= energyCost && engine.world.isBuildable(dest.x, dest.y);

  const handleMove = () => {
    const res = movePlayer(dest.x, dest.y);
    if (res?.ok) {
      setDest(null);
      onMoved?.();
    }
  };

  // Show a mini grid around the player for cell selection
  const r = 12;
  const x0 = Math.max(0, p.position.x - r);
  const x1 = Math.min(engine.world.width - 1, p.position.x + r);
  const y0 = Math.max(0, p.position.y - r);
  const y1 = Math.min(engine.world.height - 1, p.position.y + r);
  const cellSize = 14;

  return (
    <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, maxHeight: "55vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">MOVE · CURRENT {p.position.x},{p.position.y}</span>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll ev-stack-sm" style={{ display: "flex" }}>
        <div style={{ flex: 1, overflow: "auto", padding: 10, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${x1 - x0 + 1}, ${cellSize}px)`, gap: 1 }}>
            {Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }).map((_, i) => {
              const cx = x0 + (i % (x1 - x0 + 1));
              const cy = y0 + Math.floor(i / (x1 - x0 + 1));
              const isPlayer = p.position.x === cx && p.position.y === cy;
              const isDest = dest?.x === cx && dest?.y === cy;
              const buildable = engine.world.isBuildable(cx, cy);
              return (
                <div
                  key={i}
                  onClick={() => buildable && !isPlayer && setDest({ x: cx, y: cy })}
                  style={{
                    width: cellSize, height: cellSize, borderRadius: 2,
                    background: isPlayer ? C.cyan : isDest ? "rgba(34,211,238,0.5)" : buildable ? "#1a2a1a" : "#0a121e",
                    border: isDest ? `1px solid ${C.cyan}` : "none",
                    cursor: buildable && !isPlayer ? "pointer" : "default",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="ev-side-sm" style={{ width: 200, padding: 12, borderLeft: `1px solid ${C.line}` }}>
          {dest ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>DEST {dest.x},{dest.y}</div>
              <Row label="DISTANCE" value={`${dist} cells`} />
              <Row label="ENERGY COST" value={energyCost.toFixed(2)} color={p.assets.energy >= energyCost ? C.green : C.red} />
              <Row label="tKAS COST" value={kasCost.toFixed(2)} />
              <button className="ev-btn" disabled={!canMove} onClick={handleMove} style={{ marginTop: 12, width: "100%" }}>MOVE</button>
            </>
          ) : (
            <div style={{ color: C.textFaint, fontSize: 11 }}>Select a destination cell.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 9, color: C.textFaint }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}