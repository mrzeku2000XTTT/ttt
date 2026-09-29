import React, { useMemo, useState } from "react";
import { Crosshair } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { planAttack, SIM_ACTIONS } from "@/lib/evolve/conflictService";
import { fmt } from "@/lib/evolve/constants";

/**
 * AttackPlanner — every target here is an object inside the simulated world.
 * The backend World Engine resolves the result; this panel only states the odds.
 */
export default function AttackPlanner({ simId, onClose }) {
  const { engine, say } = useEvolve();
  const [actorId, setActorId] = useState("");
  const [simAction, setSimAction] = useState("ATTACK");
  const [commit, setCommit] = useState(1);

  const asset = engine?.world.findAsset(simId);
  const candidates = useMemo(
    () => (engine ? [...engine.agents.filter((a) => a.status !== "archived")].sort((a, b) => b.fitness - a.fitness) : []),
    [engine, engine?.tickCount]
  );
  if (!asset) return null;
  const actor = engine.agentById.get(actorId) || candidates[0];
  if (!actor) return null;

  const plan = planAttack({ actor, asset, commit, simAction });

  return (
    <PanelShell title="Attack Planning" subtitle={`${asset.sim_id} · simulated world asset`} onClose={onClose} width={348}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Attacker</div>
        <select
          value={actor.id}
          onChange={(e) => setActorId(e.target.value)}
          style={{ width: "100%", background: "#0b1220", border: "1px solid rgba(120,160,200,0.2)", borderRadius: 4, color: "#c9d6e4", fontSize: 10.5, padding: "6px" }}
        >
          {candidates.slice(0, 80).map((a) => (
            <option key={a.id} value={a.id}>{a.code} · {a.name} · fit {a.fitness.toFixed(2)}</option>
          ))}
        </select>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Simulation action</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {SIM_ACTIONS.map((s) => (
            <button key={s.id} className={`ev-chip ${simAction === s.id ? "is-on" : ""}`} onClick={() => setSimAction(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Target" value={asset.sim_id} />
          <Stat label="Target value" value={`${asset.value} resources`} />
          <Stat label="Attack power" value={plan.power} color="#f87171" />
          <Stat label="Target defence" value={Math.round(asset.defense)} color="#60a5fa" />
          <Stat label="Estimated cost" value={`${fmt(plan.cost)}`} />
          <Stat label="Potential spoils" value={`${fmt(plan.spoils)}`} color="#34d399" />
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-row" style={{ marginBottom: 4 }}>
          <span className="ev-label">Resource commitment</span>
          <span className="ev-value" style={{ fontSize: 10.5 }}>{commit.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2"
          step="0.05"
          value={commit}
          onChange={(e) => setCommit(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#f87171" }}
        />
      </div>

      <div className="ev-section">
        <div className="ev-row" style={{ marginBottom: 5 }}>
          <span className="ev-label">Estimated success</span>
          <span className="ev-value" style={{ color: plan.success > 0.55 ? "#34d399" : plan.success > 0.3 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>
            {(plan.success * 100).toFixed(1)}%
          </span>
        </div>
        <span className="ev-bar"><i style={{ width: `${plan.success * 100}%`, background: plan.success > 0.55 ? "#34d399" : "#f87171" }} /></span>
        <div style={{ fontSize: 9.5, color: "#54657c", marginTop: 6, lineHeight: 1.45 }}>
          Derived from the world model: attack power against the target's current defence. The World Engine
          resolves the outcome — this is a probability, not a promise.
        </div>
      </div>

      <div className="ev-section">
        <button
          className="ev-btn ev-btn-danger"
          style={{ width: "100%" }}
          onClick={() => {
            const r = engine.executeAttack(plan);
            say(r.message, r.ok);
            if (r.ok) onClose();
          }}
        >
          <Crosshair className="h-3.5 w-3.5" /> Execute simulation action
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