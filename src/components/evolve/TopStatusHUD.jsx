import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Play, Pause, Store } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt, fmtInt } from "@/lib/evolve/constants";
import ConnectScorpion from "./ConnectScorpion";
import useTn10Balances from "@/lib/evolve/useTn10Balances";

const SPEEDS = [1, 2, 5, 10];

/**
 * TopStatusHUD — every number here is read from live simulation state.
 * Nothing on this strip is a UI-only placeholder.
 */
export default function TopStatusHUD({ onMenu, onView, onTreasury }) {
  const { engine } = useEvolve();
  const navigate = useNavigate();

  // On-chain tKAS — the real TN-10 balance held by this experiment's AI agents.
  // Read from the chain; never the simulation's internal treasury counter.
  const agentCount = engine?.agents?.length || 0;
  const agentAddresses = useMemo(
    () => (engine ? engine.agents.filter((a) => a.address).map((a) => a.address) : []),
    [engine, agentCount]
  );
  const { balances: onChain, loading: onChainLoading, ok: onChainOk } = useTn10Balances(agentAddresses);

  if (!engine) return null;
  const s = engine.stats();
  const onChainTotal = Object.values(onChain).reduce((sum, v) => sum + v, 0);

  const exitToStore = () => {
    try { localStorage.removeItem("came_from_categories"); } catch {}
    navigate("/AppStoreV2");
  };

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
        <img
          className="ev-brand-logo"
          src="/evolve-logo.png"
          alt="EVOLVE"
        />
        <span className="ev-brand-sub">AI Civilization Sim · Kaspa TN-10</span>
      </div>

      <div className="ev-metrics ev-scroll">
        <Metric label="Agents" value={fmtInt(s.agents)} delta={s.agentsDelta} onClick={() => onView("AGENTS")} title="Open the agent roster" />
        <Metric label="Generations" value={fmtInt(s.generations)} color="#c084fc" onClick={() => onView("RESEARCH")} title="Open research" />
        <Metric
          label="On-chain tKAS"
          value={onChainLoading ? "…" : onChainOk ? fmt(onChainTotal) : "N/A"}
          color="#34d399"
          onClick={onTreasury}
          title="Real Kaspa TN-10 balance held by this experiment's AI agents"
        />
        <Metric label="Active Jobs" value={fmtInt(s.activeJobs)} delta={s.jobsDelta} onClick={() => onView("JOBS")} title="Open the job market" />
        <Metric label="Compute" value={`${s.compute}%`} color="#60a5fa" onClick={() => onView("ECONOMY")} title="Open the economy" />
        <Metric label="Energy" value={`${s.energy}%`} color="#fbbf24" onClick={() => onView("ECONOMY")} title="Open the economy" />
        <Metric label="World Time" value={`DAY ${fmtInt(s.day)}`} onClick={() => onView("EVENTS")} title="Open the event explorer" />
        <Metric label="Assets" value={fmtInt(s.assets)} onClick={() => onView("FACTIONS")} title="Open factions" />
      </div>

      <div className="ev-clock">
        <ConnectScorpion />
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={() => engine.togglePause()} title={engine.paused ? "Resume" : "Pause"}>
          {engine.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span style={{ fontSize: 10 }}>{engine.paused ? "PAUSED" : `${engine.speed}×`}</span>
        </button>
        <div className="ev-speeds" style={{ display: "flex", gap: 2 }}>
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
        <button className="ev-btn ev-btn-ghost ev-opt-sm" style={{ padding: 7 }} onClick={onTreasury} title="Treasury">
          <Landmark className="h-3.5 w-3.5" />
        </button>
        <button className="ev-btn ev-btn-ghost" style={{ padding: 7 }} onClick={onMenu} title="Simulation settings">
          <span style={{ fontSize: 12, lineHeight: 1 }}>⋯</span>
        </button>
        <button className="ev-btn" style={{ padding: "7px 11px" }} onClick={exitToStore} title="Exit to Store">
          <Store className="h-3.5 w-3.5" />
          <span className="ev-exit-label" style={{ fontSize: 10, fontWeight: 800 }}>EXIT TO STORE</span>
        </button>
      </div>
    </div>
  );
}