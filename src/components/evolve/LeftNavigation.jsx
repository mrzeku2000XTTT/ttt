import React from "react";
import { Globe2, Users, Briefcase, Coins, Flag, FlaskConical, Radio, GitBranch } from "lucide-react";

export const NAV_ITEMS = [
  { id: "WORLD", label: "World", icon: Globe2 },
  { id: "AGENTS", label: "Agents", icon: Users },
  { id: "JOBS", label: "Jobs", icon: Briefcase },
  { id: "ECONOMY", label: "Economy", icon: Coins },
  { id: "FACTIONS", label: "Factions", icon: Flag },
  { id: "RESEARCH", label: "Research", icon: FlaskConical },
  { id: "LINEAGE", label: "Lineage", icon: GitBranch },
  { id: "EVENTS", label: "Events", icon: Radio },
];

export default function LeftNavigation({ view, onView }) {
  return (
    <nav className="ev-nav ev-panel" style={{ borderTop: "none", borderBottom: "none", borderLeft: "none" }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`ev-nav-item ${view === item.id ? "is-active" : ""}`}
            onClick={() => onView(item.id)}
            title={item.label}
          >
            <Icon className="h-4 w-4" />
            <span className="ev-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}