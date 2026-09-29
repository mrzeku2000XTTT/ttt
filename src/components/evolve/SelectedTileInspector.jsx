import React from "react";
import { Crosshair, Wrench, Shield, ArrowLeftRight, Eye } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { LEVEL_WORD, orgColor } from "@/lib/evolve/constants";

/**
 * SelectedTileInspector — what the tapped tile actually is, its survey, its owner
 * and the action that makes sense for it.
 */
export default function SelectedTileInspector({ onAttack, onTrade, onFortify, onInspectAsset }) {
  const { engine } = useEvolve();
  const tile = engine?.selection;
  if (!tile) return null;

  const ownerColor = tile.ownerColor || orgColor(tile.ownerOrg) || "#94a3b8";
  const asset = tile.assets?.[0];
  const geo = tile.geo;
  const title = geo ? geo.cellId : tile.label;

  return (
    <div className="ev-overlay-card" style={{ width: 236, maxWidth: "72vw" }}>
      <div className="ev-panel-head" style={{ padding: "6px 9px" }}>
        <span className="ev-panel-title" style={{ color: geo ? "#22d3ee" : (tile.color === "#8fa3b8" ? "#c9d6e4" : "#eef3f9"), fontSize: 10, letterSpacing: "0.04em" }}>
          {title}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: ownerColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {tile.owner === "neutral" ? "Neutral Territory" : tile.owner}
        </span>
      </div>

      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Geographic Cell</div>
        {geo ? (
          <>
            <Row label="Lat" value={geo.centerLat.toFixed(4)} />
            <Row label="Lng" value={geo.centerLng.toFixed(4)} />
            <Row label="Cell" value={geo.cellId} />
          </>
        ) : (
          <Row label="Coordinates" value={`${tile.x},${tile.y}`} />
        )}
      </div>

      <div className="ev-section" style={{ padding: "8px 9px" }}>
        <div className="ev-label" style={{ marginBottom: 5 }}>Resources</div>
        <Row label="Wood" value={LEVEL_WORD[tile.wood] || "NONE"} />
        <Row label="Energy Potential" value={LEVEL_WORD[tile.energy] || "NONE"} />
        <Row label="Compute Spots" value={LEVEL_WORD[tile.compute] || "NONE"} />
        <Row label="Owner" value={tile.owner === "neutral" ? "NONE" : tile.owner.toUpperCase()} />
        {tile.sculpted ? <Row label="Terrain" value="RESHAPED" /> : null}
      </div>

      {asset && (
        <div className="ev-section" style={{ padding: "8px 9px" }}>
          <div className="ev-label" style={{ marginBottom: 5 }}>Simulated Asset</div>
          <Row label="Id" value={asset.sim_id} />
          <Row label="Kind" value={asset.kind.toUpperCase()} />
          <Row label="Owner" value={asset.owner_id || "UNCLAIMED"} />
          <Row label="Value" value={asset.value} />
          <Row label="Defence" value={Math.round(asset.defense)} />
          <Row label="Damage" value={Math.round(asset.damage)} />
        </div>
      )}

      <div style={{ display: "flex", gap: 5, padding: "8px 9px", flexWrap: "wrap" }}>
        {asset ? (
          <>
            <button className="ev-btn" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onAttack(asset)}>
              <Crosshair className="h-3 w-3" /> Attack
            </button>
            <button className="ev-btn ev-btn-ghost" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onFortify(asset)}>
              <Shield className="h-3 w-3" /> Defend
            </button>
            <button className="ev-btn ev-btn-ghost" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onTrade(asset)}>
              <ArrowLeftRight className="h-3 w-3" /> Trade
            </button>
            <button className="ev-btn ev-btn-ghost" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => onInspectAsset(asset)}>
              <Eye className="h-3 w-3" /> Inspect
            </button>
          </>
        ) : (
          <button className="ev-btn ev-btn-ghost" style={{ padding: "6px 9px", fontSize: 9.5 }} onClick={() => engine.setTool("SERVER")}>
            <Wrench className="h-3 w-3" /> Build here
          </button>
        )}
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0" }}>
    <span className="ev-label">{label}</span>
    <span className="ev-value" style={{ fontSize: 10.5 }}>{value}</span>
  </div>
);