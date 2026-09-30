import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { Shield, Crosshair } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { orgColor, fmt } from "@/lib/evolve/constants";

/** AssetInspector — a single simulated world object and its condition. */
export default function AssetInspector({ simId, onClose, onAttack, onFortify }) {
  const { engine } = useEvolve();
  const asset = engine?.world.findAsset(simId);
  if (!asset) return null;

  const owner = engine.agentById.get(asset.owner_id);
  const condition = Math.max(0, 1 - asset.damage / Math.max(1, asset.value));

  return (
    <PanelShell title={asset.sim_id} subtitle={`${asset.kind.toUpperCase()} · built day ${asset.built_day}`} onClose={onClose} width={320}>
      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Owner" value={asset.org_slot > 0 && engine.world.orgSlots?.[asset.org_slot] ? (engine.orgs.find((o) => o.id === engine.world.orgSlots[asset.org_slot])?.name || "Org") : "Unowned"} color={asset.org_slot > 0 && engine.world.orgSlots?.[asset.org_slot] ? orgColor(engine.world.orgSlots[asset.org_slot]) : "#94a3b8"} />
          <Stat label="Level" value={asset.level} />
          <Stat label="Value" value={asset.value} />
          <Stat label="Defence" value={Math.round(asset.defense)} />
          <Stat label="Damage" value={Math.round(asset.damage)} />
          <Stat label="Output / day" value={asset.output} />
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-row" style={{ marginBottom: 5 }}>
          <span className="ev-label">Condition</span>
          <span className="ev-value" style={{ color: condition > 0.6 ? "#34d399" : condition > 0.3 ? "#fbbf24" : "#f87171" }}>
            {(condition * 100).toFixed(0)}%
          </span>
        </div>
        <span className="ev-bar"><i style={{ width: `${condition * 100}%`, background: condition > 0.6 ? "#34d399" : "#fbbf24" }} /></span>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Owner</div>
        <div className="ev-value">{owner ? `${owner.code} · ${owner.name}` : "UNCLAIMED"}</div>
        {owner ? <div className="ev-label" style={{ marginTop: 3 }}>Balance <LiveBalance actor={owner} unit /> · Gen {owner.generation}</div> : null}
        <div className="ev-label" style={{ marginTop: 3 }}>Coordinates {asset.x},{asset.y}</div>
      </div>

      <div className="ev-section" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button className="ev-btn" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onAttack(asset)}>
          <Crosshair className="h-3 w-3" /> Attack
        </button>
        <button className="ev-btn ev-btn-ghost" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onFortify(asset)}>
          <Shield className="h-3 w-3" /> Fortify
        </button>
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