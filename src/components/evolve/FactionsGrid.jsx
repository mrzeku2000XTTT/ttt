import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { FACTIONS, fmt, fmtInt } from "@/lib/evolve/constants";

/** Every faction side by side: territory, population and economic weight. */
export default function FactionsGrid({ onSelect, onSelectOrg }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const share = engine.factionShare();
  const active = engine.agents.filter((a) => a.status !== "archived");

  return (
    <div className="ev-panel ev-scroll" style={{ flex: 1, minWidth: 0, border: "none", overflowY: "auto" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">Factions</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, padding: 12 }}>
        {FACTIONS.map((f) => {
          const members = active.filter((a) => a.faction === f.id);
          const assets = engine.world.assets.filter((a) => a.faction === f.id);
          const wealth = members.reduce((s, a) => s + a.balance, 0);
          const orgs = engine.orgs.filter((o) => o.faction === f.id);
          const s = share[f.id] || 0;

          return (
            <div key={f.id} className="ev-panel" style={{ borderRadius: 6 }}>
              <div className="ev-panel-head" style={{ borderBottomColor: f.color }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", color: f.color }}>{f.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: f.color }}>{(s * 100).toFixed(2)}%</span>
              </div>
              <div style={{ padding: 10 }}>
                <span className="ev-bar"><i style={{ width: `${s * 100}%`, background: f.color }} /></span>

                <div className="ev-grid2" style={{ marginTop: 10 }}>
                  <Cell label="Agents" value={fmtInt(members.length)} />
                  <Cell label="Assets" value={fmtInt(assets.length)} />
                  <Cell label="Combined wealth" value={fmt(wealth)} />
                  <Cell label="Organizations" value={fmtInt(orgs.length)} />
                </div>

                {orgs.length > 0 && (
                  <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {orgs.map((o) => (
                      <button key={o.id} className="ev-chip" onClick={() => onSelectOrg(o.id)}>{o.name}</button>
                    ))}
                  </div>
                )}

                <button className="ev-btn ev-btn-ghost" style={{ width: "100%", marginTop: 10, padding: "6px" }} onClick={() => onSelect(f.id)}>
                  Open faction
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Cell = ({ label, value }) => (
  <div>
    <div className="ev-label">{label}</div>
    <div className="ev-value" style={{ fontWeight: 600 }}>{value}</div>
  </div>
);