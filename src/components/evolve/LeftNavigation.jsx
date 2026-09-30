import React from "react";
import { Globe2, Users, Briefcase, Coins, Flag, FlaskConical, Radio, GitBranch, Terminal, Receipt, Store } from "lucide-react";

export const NAV_ITEMS = [
  { id: "WORLD", label: "World", icon: Globe2 },
  { id: "AGENTS", label: "Agents", icon: Users },
  { id: "JOBS", label: "Jobs", icon: Briefcase },
  { id: "ECONOMY", label: "Economy", icon: Coins },
  { id: "MARKET", label: "Market", icon: Store },
  { id: "FACTIONS", label: "Factions", icon: Flag },
  { id: "RESEARCH", label: "Research", icon: FlaskConical },
  { id: "LINEAGE", label: "Lineage", icon: GitBranch },
  { id: "EVENTS", label: "Events", icon: Radio },
];

export default function LeftNavigation({ view, onView, onDebug, onTransactions }) {
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
      <div style={{ flex: 1 }} />
      {onTransactions && (
        <button
          className="ev-nav-item"
          onClick={onTransactions}
          title="Transaction Activity"
        >
          <Receipt className="h-4 w-4" />
          <span className="ev-nav-label">TXs</span>
        </button>
      )}
      <button
        className="ev-nav-item"
        onClick={onDebug}
        title="Debug Inspector"
        style={{ borderTop: "1px solid rgba(120,160,200,0.16)" }}
      >
        <Terminal className="h-4 w-4" />
        <span className="ev-nav-label">Debug</span>
      </button>
    </nav>
  );
}