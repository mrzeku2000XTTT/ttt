import React, { useMemo, useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { cellStats, countryGridBounds, randomCellInCountry } from "@/lib/evolve/countryMap";
import { C } from "@/lib/evolve/constants";

/**
 * CellSelect — after country selection, zoom into the country.
 * Display valid gameplay cells. Cell inspector shows actors/resources/control.
 * Button: SPAWN HERE.
 */
export default function CellSelect({ onClose }) {
  const { engine, selectedCountry, selectSpawnCell, selectedSpawnCell, spawnPlayer } = useEvolve();
  const [hover, setHover] = useState(null);

  const bounds = useMemo(() => {
    if (!engine || !selectedCountry) return null;
    return countryGridBounds(engine.world, selectedCountry);
  }, [engine, selectedCountry]);

  const stats = useMemo(() => {
    if (!engine || !hover) return null;
    return cellStats(engine.world, engine.agents, engine.players, engine.world.assets, hover.x, hover.y);
  }, [engine, hover]);

  if (!engine || !selectedCountry || !bounds) return null;

  const cellSize = 18;
  const cols = bounds.x1 - bounds.x0 + 1;
  const rows = bounds.y1 - bounds.y0 + 1;

  const pickRandom = () => {
    const cell = randomCellInCountry(engine.world, engine.rng, selectedCountry);
    selectSpawnCell(cell);
  };

  const handleSpawn = async () => {
    if (!selectedSpawnCell) return;
    const res = await spawnPlayer({ country: selectedCountry.name, position: selectedSpawnCell });
    if (!res?.ok) {
      // flash handled by say in useEvolve
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 37, display: "flex", background: "rgba(3,6,11,0.95)" }}>
      <div className="ev-panel" style={{ flex: 1, borderRight: `1px solid ${C.line}` }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">{selectedCountry.name.toUpperCase()} · CELL SELECT</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>BACK</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 1 }}>
            {Array.from({ length: rows * cols }).map((_, i) => {
              const cx = bounds.x0 + (i % cols);
              const cy = bounds.y0 + Math.floor(i / cols);
              const tile = engine.world.tile(cx, cy);
              const buildable = engine.world.isBuildable(cx, cy);
              const isSel = selectedSpawnCell?.x === cx && selectedSpawnCell?.y === cy;
              const hasActor = engine.agents.some((a) => a.position?.x === cx && a.position?.y === cy) ||
                engine.players.some((p) => p.position?.x === cx && p.position?.y === cy);
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHover({ x: cx, y: cy })}
                  onClick={() => buildable && selectSpawnCell({ x: cx, y: cy })}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isSel ? "rgba(34,211,238,0.5)" : buildable ? (hasActor ? "rgba(34,211,238,0.15)" : tile?.color || "#1a2a1a") : "#0a121e",
                    border: isSel ? `1px solid ${C.cyan}` : "none",
                    cursor: buildable ? "pointer" : "default",
                    borderRadius: 2,
                  }}
                  title={`${cx},${cy} ${tile?.label || ""}`}
                />
              );
            })}
          </div>
        </div>
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
          <button className="ev-btn ev-btn-ghost" onClick={pickRandom}>RANDOM CELL</button>
          <button className="ev-btn" disabled={!selectedSpawnCell} onClick={handleSpawn} style={{ marginLeft: "auto" }}>
            SPAWN HERE
          </button>
        </div>
      </div>

      <div style={{ width: 260, padding: 14, overflowY: "auto" }}>
        {stats ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{stats.label}</div>
            <div style={{ fontSize: 9, color: C.textFaint, marginBottom: 12 }}>{stats.country} · {stats.biome}</div>
            <Row label="AI" value={stats.independentAI + " ind."} />
            <Row label="HUMANS" value={stats.humans} />
            <Row label="ORGANIZATIONS" value={stats.organizations} />
            <Row label="OPEN JOBS" value={stats.openJobs} />
            <Row label="COMPUTE" value={stats.compute} />
            <Row label="ENERGY" value={stats.energy} />
            <Row label="CONTROL" value={stats.control} />
            <Row label="ECON. ACTIVITY" value={stats.economicActivity} />
            <Row label="BUILDABLE" value={stats.buildable ? "YES" : "NO"} color={stats.buildable ? C.green : C.red} />
          </>
        ) : (
          <div style={{ color: C.textFaint, fontSize: 11 }}>Hover a cell to inspect.</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 9, letterSpacing: "0.1em", color: C.textFaint }}>{label}</span>
      <span style={{ fontSize: 11, color: color || C.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}