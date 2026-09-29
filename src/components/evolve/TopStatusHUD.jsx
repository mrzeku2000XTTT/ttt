import React from "react";
import { Pause, Play, Gauge, Menu } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt, fmtInt } from "@/lib/evolve/constants";

const SPEEDS = [1, 2, 5, 10];

/**
 * TopStatusHUD — every number here is read from live simulation state.
 * Nothing on this strip is a UI-only placeholder.
 */
export default function TopStatusHUD({ onMenu }) {
  const { engine } = useEvolve();
  if (!engine) return null;
  const s = engine.stats();

  const Metric = ({ label, value, delta, color, suffix }) => (
    <div className="ev-metric">
      <span className="ev-metric-label">{label}</span>
      <span className="ev-metric-value" style={{ color: color || "#eef3f9" }}>
        {value}
        {suffix ? <span style={{ fontSize: 9, color: "#54657c", marginLeft: 3 }}>{suffix}</span> : null}
        {delta > 0 ? <span className="ev-metric-delta" style={{ color: "#34d399" }}>+{delta}</span> : null}
      </span>
    </div>
  );

  return (
    <div className="ev-hud-bar">
      <div className="ev-brand">
        <span className="ev-brand-mark">EVOLVE</span>
        <span className="ev-brand-sub">AI Civilization Sim · Kaspa TN-10</span>
      </div>

      <div className="ev-metrics ev-scroll">
        <Metric label="Agents" value={fmtInt(s.agents)} delta={s.agentsDelta} />
        <Metric label="Generations" value={fmtInt(s.generations)} color="#c084fc" />
        <Metric label="Test KAS Treasury" value={fmt(s.treasury)} color="#34d399" />
        <Metric label="Active Jobs" value={fmtInt(s.activeJobs)} delta={s.jobsDelta} />
        <Metric label="Compute" value={`${s.compute}%`} color="#60a5fa" />
        <Metric label="Energy" value={`${s.energy}%`} color="#fbbf24" />
        <Metric label="World Time" value={`DAY ${fmtInt(s.day)}`} />
        <Metric label="Assets" value={fmtInt(s.assets)} />
      </div>

      <div className="ev-clock">
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={() => engine.togglePause()} title={engine.paused ? "Resume" : "Pause"}>
          {engine.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
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
        <Gauge className="h-3.5 w-3.5" style={{ color: "#54657c" }} />
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={onMenu} title="Menu">
          <Menu className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}