import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerHUD — compact landscape HUD for the active player.
 * Shows: player ID, tKAS balance, compute, energy, storage, reputation,
 * income rate, organization, current activity.
 * Does not cover significant map area.
 */
export default function PlayerHUD() {
  const { currentPlayer, engine } = useEvolve();
  if (!currentPlayer) return null;

  const p = currentPlayer;
  const org = engine?.orgs.find((o) => o.id === p.organization_id);
  const income = (p.assets?.servers || 0) * 0.02 + 0.01;

  const items = [
    { label: "PLAYER", value: p.code, color: C.cyan },
    { label: "tKAS", value: p.balance.toFixed(2), color: C.green },
    { label: "COMPUTE", value: p.assets?.compute?.toFixed(0) || 0, color: C.blue },
    { label: "ENERGY", value: p.assets?.energy?.toFixed(0) || 0, color: C.yellow },
    { label: "STORAGE", value: p.assets?.storage?.toFixed(0) || 0, color: C.textDim },
    { label: "REP", value: p.reputation?.toFixed(0) || 50, color: C.text },
    { label: "INCOME", value: `${income.toFixed(2)}/d`, color: C.green },
    { label: "ORG", value: org ? org.name.slice(0, 8) : "—", color: C.purple },
    { label: "STATUS", value: p.status?.toUpperCase() || "IDLE", color: C.textDim },
  ];

  return (
    <div style={{
      position: "absolute", top: 50, left: 60, zIndex: 15,
      display: "flex", gap: 0, background: "rgba(7,11,19,0.88)",
      border: `1px solid ${C.line}`, borderRadius: 6, backdropFilter: "blur(6px)",
      maxHeight: 36, overflow: "hidden",
    }}>
      {items.map((it, i) => (
        <div key={it.label} style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "4px 10px", borderRight: i < items.length - 1 ? `1px solid ${C.line}` : "none",
          minWidth: 52,
        }}>
          <span style={{ fontSize: 7, letterSpacing: "0.1em", color: C.textFaint }}>{it.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: it.color, fontVariantNumeric: "tabular-nums" }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}