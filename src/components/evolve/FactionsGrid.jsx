import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { X } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { orgColor, fmt, fmtInt } from "@/lib/evolve/constants";

/**
 * Organizations grid — shows emergent organizations, not predefined factions.
 * At genesis there are zero organizations. They appear when independent agents
 * discover that repeated cooperation improves their economic survival.
 */
export default function FactionsGrid({ onSelect, onSelectOrg, onClose }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const share = engine.factionShare();
  const active = engine.agents.filter((a) => a.status !== "archived");
  const independent = active.filter((a) => !a.organization_id);

  if (!engine.orgs.length) {
    return (
      <div className="ev-panel ev-scroll" style={{ flex: 1, minWidth: 0, border: "none", overflowY: "auto" }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">Organizations</span>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#54657c", letterSpacing: "0.1em" }}>0 FORMED</span>
          {onClose && (
            <button className="ev-btn ev-btn-ghost" style={{ padding: 6, marginLeft: 6 }} onClick={onClose} title="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#54657c", letterSpacing: "0.18em", marginBottom: 12 }}>NO ORGANIZATIONS YET</div>
          <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
            Organizations emerge when independent agents discover that repeated
            cooperation improves their economic survival.
            <br /><br />
            <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{independent.length}</span> independent agents are currently working alone.
            <br /><br />
            <span style={{ color: "#54657c" }}>Watch the event feed for the first ORGANIZATION_CREATED event.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-panel ev-scroll" style={{ flex: 1, minWidth: 0, border: "none", overflowY: "auto" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">Organizations</span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#54657c", letterSpacing: "0.1em" }}>{engine.orgs.length} ACTIVE · {independent.length} INDEPENDENT</span>
        {onClose && (
          <button className="ev-btn ev-btn-ghost" style={{ padding: 6, marginLeft: 6 }} onClick={onClose} title="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, padding: 12 }}>
        {engine.orgs.map((org) => {
          const members = active.filter((a) => org.members.includes(a.id));
          const assets = engine.world.assets.filter((a) => a.org_slot === org.slot);

          const s = share[org.id] || 0;
          const color = org.color || orgColor(org.id);

          return (
            <div key={org.id} className="ev-panel" style={{ borderRadius: 6 }}>
              <div className="ev-panel-head" style={{ borderBottomColor: `${color}55` }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", color }}>{org.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color }}>{(s * 100).toFixed(2)}%</span>
              </div>
              <div style={{ padding: 10 }}>
                <span className="ev-bar"><i style={{ width: `${s * 100}%`, background: color }} /></span>

                <div className="ev-grid2" style={{ marginTop: 10 }}>
                  <Cell label="Members" value={fmtInt(members.length)} />
                  <Cell label="Assets" value={fmtInt(assets.length)} />
                  <Cell label="Treasury" value={<LiveBalance actor={org} />} />
                  <Cell label="Wealth" value={<LiveBalance actors={members} />} />
                </div>

                <button className="ev-btn ev-btn-ghost" style={{ width: "100%", marginTop: 10, padding: "6px" }} onClick={() => onSelectOrg(org.id)}>
                  Inspect organization
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