import React from "react";
import { Pause, Play, Save } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { evolveRepo } from "@/lib/evolve/repo";
import { fmt, fmtInt } from "@/lib/evolve/constants";

const SPEEDS = [1, 2, 5, 10];

/** Simulation clock, ledger status and experiment settings. */
export default function SimulationControls({ onClose }) {
  const { engine, experimentId, say } = useEvolve();
  if (!engine) return null;
  const s = engine.stats();

  return (
    <PanelShell title="Simulation" subtitle={`${engine.config.label} · seed ${engine.config.seed}`} onClose={onClose} width={300}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Clock</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className="ev-btn" style={{ padding: 8 }} onClick={() => engine.togglePause()}>
            {engine.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          {SPEEDS.map((v) => (
            <button key={v} className={`ev-btn ${!engine.paused && engine.speed === v ? "" : "ev-btn-ghost"}`} style={{ padding: "7px 9px", fontSize: 10 }} onClick={() => engine.setSpeed(v)}>
              {v}×
            </button>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: "#54657c", marginTop: 7, lineHeight: 1.45 }}>
          Simulation speed never accelerates blockchain confirmation — settlements resolve on wall-clock time.
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Experiment</div>
        <Row label="World" value={`${engine.world.width}×${engine.world.height} · ${engine.config.world_size}`} />
        <Row label="Scarcity" value={engine.config.scarcity.toUpperCase()} />
        <Row label="Mutation" value={`${(engine.config.mutation_rate * 100).toFixed(0)}%`} />
        <Row label="Population" value={fmtInt(s.population ?? s.agents)} />
        <Row label="Assets" value={fmtInt(s.assets)} />
        <Row label="World day" value={fmtInt(s.day)} />
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Ledger</div>
        <div className="ev-row">
          <span className="ev-label">Adapter</span>
          <span className="ev-value" style={{ color: engine.kaspa.ledger === "mock" ? "#fbbf24" : "#34d399" }}>
            {engine.kaspa.ledger === "mock" ? "DEVELOPMENT LEDGER" : "KASPA TN-10"}
          </span>
        </div>
        <div className="ev-row"><span className="ev-label">Treasury</span><span className="ev-value">{fmt(engine.treasury.balance)} tKAS</span></div>
        <div className="ev-row"><span className="ev-label">Settlements</span><span className="ev-value">{engine.transactions.length}</span></div>
      </div>

      <div className="ev-section">
        <button
          className="ev-btn ev-btn-ghost"
          style={{ width: "100%" }}
          onClick={async () => {
            if (!experimentId) return say("No experiment record to save yet", false);
            await evolveRepo.checkpoint(experimentId, engine.toRecords(experimentId));
            say("Checkpoint written");
          }}
        >
          <Save className="h-3.5 w-3.5" /> Write checkpoint
        </button>
      </div>
    </PanelShell>
  );
}

const Row = ({ label, value }) => (
  <div className="ev-row" style={{ padding: "2.5px 0" }}>
    <span className="ev-label">{label}</span>
    <span className="ev-value" style={{ fontSize: 10.5 }}>{value}</span>
  </div>
);