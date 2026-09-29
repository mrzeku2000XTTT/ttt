import React from "react";
import { Landmark, Users, Briefcase } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt, fmtInt } from "@/lib/evolve/constants";

const SPEEDS = [1, 2, 5, 10];

/**
 * TopStatusHUD — every number here is read from live simulation state.
 * Nothing on this strip is a UI-only placeholder.
 */
export default function TopStatusHUD({ onMenu, onView, onTreasury }) {
  const { engine } = useEvolve();
  if (!engine) return null;
  const s = engine.stats();

  const Metric = ({ label, value, delta, color, onClick, title }) => (
    <button
      className="ev-metric"
      onClick={onClick}
      title={title || label}
      style={{ background: "none", border: "none", borderRight: "1px solid rgba(120,160,200,0.10)", textAlign: "left" }}
    >
      <span className="ev-metric-label">{label}</span>
      <span className="ev-metric-value" style={{ color: color || "#eef3f9" }}>
        {value}
        {delta > 0 ? <span className="ev-metric-delta" style={{ color: "#34d399" }}>+{delta}</span> : null}
      </span>
    </button>
  );

  return (
    <div className="ev-hud-bar">
      <div className="ev-brand">
        <span className="ev-brand-mark">EVOLVE</span>
        <span className="ev-brand-sub">AI Civilization Sim · Kaspa TN-10</span>
      </div>

      <div className="ev-metrics ev-scroll">
        <Metric label="Agents" value={fmtInt(s.agents)} delta={s.agentsDelta} onClick={() => onView("AGENTS")} title="Open the agent roster" />
        <Metric label="Generations" value={fmtInt(s.generations)} color="#c084fc" onClick={() => onView("RESEARCH")} title="Open research" />
        <Metric label="Test KAS Treasury" value={fmt(s.treasury)} color="#34d399" onClick={onTreasury} title="Open the treasury" />
        <Metric label="Active Jobs" value={fmtInt(s.activeJobs)} delta={s.jobsDelta} onClick={() => onView("JOBS")} title="Open the job market" />
        <Metric label="Compute" value={`${s.compute}%`} color="#60a5fa" onClick={() => onView("ECONOMY")} title="Open the economy" />
        <Metric label="Energy" value={`${s.energy}%`} color="#fbbf24" onClick={() => onView("ECONOMY")} title="Open the economy" />
        <Metric label="World Time" value={`DAY ${fmtInt(s.day)}`} onClick={() => onView("EVENTS")} title="Open the event explorer" />
        <Metric label="Assets" value={fmtInt(s.assets)} onClick={() => onView("FACTIONS")} title="Open factions" />
      </div>

      <div className="ev-clock">
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={() => engine.togglePause()} title={engine.paused ? "Resume" : "Pause"}>
          {engine.paused ? <Users className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" style={{ opacity: 0 }} />}
          <span style={{ fontSize: 10 }}>{engine.paused ? "PAUSED" : `${engine.speed}×`}</span>
        </button>
        <div style={{ display: "flex", gap: 2 }}>
          {SPEEDS.map((v) => (
            <button
              key={v}
              className={`ev-btn ${!engine.paused && engine.speed === v ? "" : "ev-btn-ghost"}`}
              style={{ padding: "7px 8px", fontSize: 10 }}
              onClick={() => engine.setSpeed(v)}
            >
              {v}×
            </button>
          ))}
        </div>
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={onTreasury} title="Treasury">
          <Landmark className="h-3.5 w-3.5" />
        </button>
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={onMenu} title="Simulation settings">
          <span style={{ fontSize: 12, lineHeight: 1 }}>⋯</span>
        </button>
      </div>
    </div>
  );
}