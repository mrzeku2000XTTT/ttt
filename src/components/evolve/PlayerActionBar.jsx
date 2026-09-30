import React from "react";
import { Move, Briefcase, ArrowLeftRight, Hammer, Store, Users, MoreHorizontal } from "lucide-react";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerActionBar — the bottom action bar.
 * MOVE · JOBS · TRADE · BUILD · MARKET · PEOPLE · MORE
 *
 * Only player actions live here. Everything that is already a destination on
 * the left navigation (Organizations, Research, Agents) is NOT repeated — those
 * are reached from the nav or from MORE. The bar sits in normal layout flow so
 * it can never be covered by a panel.
 */
const ACTIONS = [
  { id: "MOVE", icon: Move, label: "MOVE" },
  { id: "JOBS", icon: Briefcase, label: "JOBS" },
  { id: "TRADE", icon: ArrowLeftRight, label: "TRADE" },
  { id: "BUILD", icon: Hammer, label: "BUILD" },
  { id: "MARKET", icon: Store, label: "MARKET" },
  { id: "PEOPLE", icon: Users, label: "PEOPLE" },
  { id: "MORE", icon: MoreHorizontal, label: "MORE" },
];

export default function PlayerActionBar({ onAction, active }) {
  return (
    <div className="ev-action-bar" style={{
      flex: "none", position: "relative", zIndex: 20,
      display: "flex", gap: 4, padding: "6px 8px",
      background: "rgba(7,11,19,0.95)", borderTop: `1px solid ${C.line}`,
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const isActive = active === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            style={{
              flex: "none", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              minWidth: 60, height: 44, padding: "6px 8px", borderRadius: 6,
              background: isActive ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? "rgba(34,211,238,0.5)" : C.line}`,
              color: isActive ? C.cyan : C.textDim, cursor: "pointer",
              transition: "all .15s",
            }}
          >
            <Icon size={16} />
            <span style={{ fontSize: 8, letterSpacing: "0.05em", fontWeight: 700 }}>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}