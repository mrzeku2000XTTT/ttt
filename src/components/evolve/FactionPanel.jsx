import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { FACTIONS, fmt } from "@/lib/evolve/constants";

/** One faction: territory, population, assets and its leading agents. */
export default function FactionPanel({ factionId, onClose, onSelectAgent }) {
  const { engine } = useEvolve();
  if (!engine || !factionId) return null;

  const faction = FACTIONS.find((f) => f.id === factionId);
  const share = engine.factionShare()[factionId] || 0;
  const members = engine.agents.filter((a) => a.faction === factionId && a.status !== "archived");
  const assets = engine.world.assets.filter((a) => a.faction === factionId);
  const orgs = engine.orgs.filter((o) => o.faction === factionId);


  return (
    <PanelShell title={`Faction ${faction.label}`} subtitle={`${members.length} agents · ${assets.length} assets`} onClose={onClose} width={330}>
      <div className="ev-section">
        <div className="ev-row" style={{ marginBottom: 5 }}>
          <span className="ev-label">Territory</span>
          <span className="ev-value" style={{ color: faction.color, fontWeight: 700 }}>{(share * 100).toFixed(2)}%</span>
        </div>
        <span className="ev-bar"><i style={{ width: `${share * 100}%`, background: faction.color }} /></span>
      </div>

      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Agents" value={members.length} />
          <Stat label="Assets" value={assets.length} />
          <Stat label="Organizations" value={orgs.length} />
          <Stat label="Combined wealth" value={<LiveBalance actors={members} unit />} color="#34d399" />
          <Stat label="Servers" value={assets.filter((a) => a.kind === "server").length} />
          <Stat label="Cities" value={assets.filter((a) => a.kind === "city").length} />
        </div>
      </div>

      {orgs.length > 0 && (
        <div className="ev-section">
          <div className="ev-label" style={{ marginBottom: 5 }}>Organizations</div>
          {orgs.map((o) => (
            <div key={o.id} className="ev-row" style={{ padding: "2.5px 0" }}>
              <span style={{ fontSize: 10.5, color: "#c9d6e4" }}>{o.name}</span>
              <span className="ev-label">{o.members.length} members · rep {o.reputation.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 5 }}>Leading agents</div>
        {[...members].sort((a, b) => b.fitness - a.fitness).slice(0, 10).map((a) => (
          <button
            key={a.id}
            className="ev-btn ev-btn-ghost"
            style={{ width: "100%", justifyContent: "space-between", padding: "5px 8px", fontSize: 10, marginBottom: 3 }}
            onClick={() => onSelectAgent(a.id)}
          >
            <span>{a.code} · {a.name}</span>
            <span style={{ color: "#34d399" }}><LiveBalance actor={a} /></span>
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

const Stat = ({ label, value, color }) => (
  <div>
    <div className="ev-label">{label}</div>
    <div className="ev-value" style={{ color: color || "#eef3f9", fontWeight: 600 }}>{value}</div>
  </div>
);