import React, { useState } from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { StepForward, RotateCcw, AlertTriangle, Activity } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { evolveRepo } from "@/lib/evolve/repo";
import { fmt, fmtInt, RESOURCE_IDS } from "@/lib/evolve/constants";
import { priceOf } from "@/lib/evolve/economyService";

/**
 * Development Debug Panel — a live inspector into the simulation engine.
 * Shows tick rate, queued actions, resource totals, market prices and errors.
 * Includes STEP 1 TICK and RESET EXPERIMENT for debugging.
 */
export default function DebugPanel({ onClose }) {
  const { engine, experimentId, say, chainBalances } = useEvolve();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!engine) return null;

  const s = engine.stats();
  const activeAgents = engine.agents.filter((a) => a.status !== "archived");
  const archived = engine.agents.length - activeAgents.length;
  const insolvent = activeAgents.filter(a => chainBalances.balanceFor(a) === 0).length;
  const decisions = activeAgents.reduce((sum, a) => sum + (a.decisions?.length || 0), 0);
  const errorCount = engine.events.recent(200).filter((e) => /FAIL|REJECT|ARCHIVED|SHORT/.test(e.type)).length;

  const handleReset = async () => {
    if (!experimentId) {
      engine.reset();
      setConfirmReset(false);
      return say("Experiment cleared locally");
    }
    try {
      await evolveRepo.resetExperiment(experimentId);
      engine.reset();
      setConfirmReset(false);
      say("Experiment reset — create new genesis");
    } catch (err) {
      console.error("EVOLVE reset failed", err);
      say("Reset failed — check logs", false);
    }
  };

  return (
    <PanelShell title="Debug Inspector" subtitle="DEVELOPMENT ONLY" onClose={onClose} width={340}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Clock</div>
        <div className="ev-row"><span className="ev-label">Tick</span><span className="ev-value">{fmtInt(engine.tickCount)}</span></div>
        <div className="ev-row"><span className="ev-label">World day</span><span className="ev-value">{fmtInt(s.day)}</span></div>
        <div className="ev-row"><span className="ev-label">Speed</span><span className="ev-value">{engine.paused ? "PAUSED" : `${engine.speed}×`}</span></div>
        <div className="ev-row"><span className="ev-label">Started</span><span className="ev-value" style={{ color: engine.started ? "#34d399" : "#fbbf24" }}>{engine.started ? "YES" : "NO"}</span></div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Population</div>
        <div className="ev-row"><span className="ev-label">Active</span><span className="ev-value">{fmtInt(s.agents ?? s.population)}</span></div>
        <div className="ev-row"><span className="ev-label">Archived</span><span className="ev-value">{fmtInt(archived)}</span></div>
        <div className="ev-row"><span className="ev-label">Insolvent</span><span className="ev-value" style={{ color: insolvent ? "#f87171" : "#7d90a8" }}>{fmtInt(insolvent)}</span></div>
        <div className="ev-row"><span className="ev-label">Max generation</span><span className="ev-value">{fmtInt(s.generations)}</span></div>
        <div className="ev-row"><span className="ev-label">Decisions logged</span><span className="ev-value">{fmtInt(decisions)}</span></div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>World resources</div>
        {RESOURCE_IDS.map((id) => (
          <div key={id} className="ev-row" style={{ padding: "2px 0" }}>
            <span className="ev-label" style={{ textTransform: "capitalize" }}>{id}</span>
            <span className="ev-value">{fmt(engine.world.resources[id] || 0, 0)} · {fmt(priceOf(engine.world, id), 2)} tKAS</span>
          </div>
        ))}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Engine</div>
        <div className="ev-row"><span className="ev-label">Assets</span><span className="ev-value">{fmtInt(s.assets)}</span></div>
        <div className="ev-row"><span className="ev-label">Jobs active</span><span className="ev-value">{fmtInt(s.activeJobs)}</span></div>
        <div className="ev-row"><span className="ev-label">Organizations</span><span className="ev-value">{fmtInt(engine.orgs.length)}</span></div>
        <div className="ev-row"><span className="ev-label">Transactions</span><span className="ev-value">{fmtInt(engine.transactions.length)}</span></div>
        <div className="ev-row"><span className="ev-label">Events generated</span><span className="ev-value">{fmtInt(engine.events.count())}</span></div>
        <div className="ev-row"><span className="ev-label">Recent errors</span><span className="ev-value" style={{ color: errorCount ? "#f87171" : "#7d90a8" }}>{fmtInt(errorCount)}</span></div>
        <div className="ev-row"><span className="ev-label">Treasury</span><span className="ev-value"><LiveBalance actor={engine.treasury} unit /></span></div>
        <div className="ev-row"><span className="ev-label">Ledger</span><span className="ev-value" style={{ color: engine.kaspa.ledger === "mock" ? "#fbbf24" : "#34d399" }}>{engine.kaspa.ledger === "mock" ? "DEVELOPMENT" : "TN-10"}</span></div>
      </div>

      <div className="ev-section">
        <button className="ev-btn" style={{ width: "100%", marginBottom: 6 }} onClick={() => { engine.step(); }}>
          <StepForward className="h-3.5 w-3.5" /> Step 1 tick
        </button>
        {!confirmReset ? (
          <button className="ev-btn ev-btn-ghost" style={{ width: "100%" }} onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset experiment
          </button>
        ) : (
          <div style={{ border: "1px solid rgba(248,113,113,0.4)", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 9.5, color: "#f87171", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <AlertTriangle className="h-3 w-3" /> This deletes all records for this experiment.
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="ev-btn" style={{ flex: 1, borderColor: "rgba(248,113,113,0.4)", color: "#f87171" }} onClick={handleReset}>
                Confirm reset
              </button>
              <button className="ev-btn ev-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}