import React, { useState } from "react";
import { Handshake, Swords } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { organizationStanding } from "@/lib/evolve/organizationService";
import { factionColor, fmt } from "@/lib/evolve/constants";

/** Organizations: shared treasury, territory, reputation, alliances and rivals. */
export default function OrganizationInspector({ orgId, onClose, onSelectAgent }) {
  const { engine, say } = useEvolve();
  const [other, setOther] = useState("");
  const org = engine?.orgs.find((o) => o.id === orgId);
  if (!org) return null;

  const standing = organizationStanding(org, engine.agents);
  const members = engine.agents.filter((a) => org.members.includes(a.id));

  return (
    <PanelShell title={org.name} subtitle={`${org.id} · founded day ${org.founded_day}`} onClose={onClose} width={344}>
      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Faction" value={org.faction.toUpperCase()} color={factionColor(org.faction)} />
          <Stat label="Standing" value={standing.standing.toFixed(1)} />
          <Stat label="Members" value={standing.memberCount} />
          <Stat label="Member wealth" value={`${fmt(standing.wealth)}`} color="#34d399" />
          <Stat label="Treasury" value={`${fmt(org.treasury)} tKAS`} color="#34d399" />
          <Stat label="Reputation" value={org.reputation.toFixed(0)} />
          <Stat label="Jobs completed" value={org.jobs_completed} />
          <Stat label="Territory" value={org.territory} />
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 5 }}>Members</div>
        {members.length === 0 && <div style={{ fontSize: 10, color: "#54657c" }}>No members yet.</div>}
        {members.slice(0, 14).map((a) => (
          <button
            key={a.id}
            className="ev-btn ev-btn-ghost"
            style={{ width: "100%", justifyContent: "space-between", padding: "5px 8px", fontSize: 10, marginBottom: 3 }}
            onClick={() => onSelectAgent(a.id)}
          >
            <span>{a.code} · {a.name}</span>
            <span style={{ color: "#34d399" }}>{fmt(a.balance)}</span>
          </button>
        ))}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 5 }}>Alliances & rivals</div>
        <div style={{ fontSize: 10, color: "#34d399", marginBottom: 3 }}>
          Allies: {org.alliances.map((id) => engine.orgs.find((o) => o.id === id)?.name || id).join(", ") || "NONE"}
        </div>
        <div style={{ fontSize: 10, color: "#f87171" }}>Rivals: {org.enemies.map((id) => engine.orgs.find((o) => o.id === id)?.name || id).join(", ") || "NONE"}</div>

        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          <select
            value={other}
            onChange={(e) => setOther(e.target.value)}
            style={{ flex: 1, minWidth: 120, background: "#0b1220", border: "1px solid rgba(120,160,200,0.2)", borderRadius: 4, color: "#c9d6e4", fontSize: 10, padding: "5px" }}
          >
            <option value="">Select organization…</option>
            {engine.orgs.filter((o) => o.id !== org.id).map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button className="ev-btn" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => { const r = engine.allyOrgs(org.id, other); say(r.message, r.ok); }}>
            <Handshake className="h-3 w-3" /> Ally
          </button>
          <button className="ev-btn ev-btn-danger" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => { const r = engine.rivalOrgs(org.id, other); say(r.message, r.ok); }}>
            <Swords className="h-3 w-3" /> Rival
          </button>
        </div>
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