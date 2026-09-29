import React from "react";
import { Move, Briefcase, ArrowLeftRight, Hammer, Store, Users, Building2, FlaskConical, Shield, MoreHorizontal } from "lucide-react";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerActionBar — bottom action bar for landscape phones.
 * MOVE · JOBS · TRADE · BUILD · MARKET · PEOPLE · ORGS · RESEARCH · DEFEND · MORE
 * Horizontal scroll, touch targets >= 44px.
 */
const ACTIONS = [
  { id: "MOVE", icon: Move, label: "MOVE" },
  { id: "JOBS", icon: Briefcase, label: "JOBS" },
  { id: "TRADE", icon: ArrowLeftRight, label: "TRADE" },
  { id: "BUILD", icon: Hammer, label: "BUILD" },
  { id: "MARKET", icon: Store, label: "MARKET" },
  { id: "PEOPLE", icon: Users, label: "PEOPLE" },
  { id: "ORGS", icon: Building2, label: "ORGS" },
  { id: "RESEARCH", icon: FlaskConical, label: "RESEARCH" },
  { id: "DEFEND", icon: Shield, label: "DEFEND" },
  { id: "MORE", icon: MoreHorizontal, label: "MORE" },
];

export default function PlayerActionBar({ onAction, active }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
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