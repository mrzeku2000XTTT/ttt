import React from "react";
import { Check, X } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { JOB_FLOW, fmt } from "@/lib/evolve/constants";

/** JobInspector — the brief, the acceptance method and the full lifecycle. */
export default function JobInspector({ jobId, onClose }) {
  const { engine } = useEvolve();
  const job = engine?.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  const agent = engine.agentById.get(job.claimed_by);
  const failed = job.status === "FAILED";
  const reached = JOB_FLOW.indexOf(job.status);

  return (
    <PanelShell title={job.code} subtitle={`${job.type} · ${job.difficulty}`} onClose={onClose} width={344}>
      <div className="ev-section">
        <div className="ev-value" style={{ fontSize: 13, fontWeight: 700 }}>{job.title}</div>
        <div style={{ fontSize: 11, color: "#c9d6e4", marginTop: 6, lineHeight: 1.5 }}>{job.brief}</div>
      </div>

      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Reward" value={`${fmt(job.reward)} tKAS`} color="#34d399" />
          <Stat label="Difficulty" value={job.difficulty} />
          <Stat label="Status" value={job.status} />
          <Stat label="Verification" value={job.verification} />
          <Stat label="Claimed by" value={agent ? agent.code : "—"} />
          <Stat label="Created day" value={job.created_day} />
        </div>
        <span className="ev-bar" style={{ display: "block", marginTop: 8 }}>
          <i style={{ width: `${Math.max(2, job.progress * 100)}%`, background: "#22d3ee" }} />
        </span>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Lifecycle</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {JOB_FLOW.map((s, i) => {
            const done = !failed && reached >= i;
            const isNow = !failed && reached === i;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, opacity: done || isNow ? 1 : 0.4 }}>
                {done ? <Check className="h-3 w-3" style={{ color: "#34d399" }} /> : <span style={{ width: 12 }} />}
                <span style={{ fontSize: 10, letterSpacing: "0.08em", color: isNow ? "#22d3ee" : done ? "#c9d6e4" : "#54657c" }}>{s}</span>
              </div>
            );
          })}
          {failed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <X className="h-3 w-3" style={{ color: "#f87171" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "#f87171" }}>FAILED · NO PAYMENT</span>
            </div>
          )}
        </div>
      </div>

      {job.verification_notes && (
        <div className="ev-section">
          <div className="ev-label" style={{ marginBottom: 4 }}>Verification notes</div>
          <div style={{ fontSize: 10.5, color: job.status === "FAILED" ? "#f87171" : "#34d399", lineHeight: 1.45 }}>
            {job.verification_notes}
          </div>
        </div>
      )}

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Acceptance</div>
        <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.45 }}>
          {job.verification === "TESTS"
            ? "Checked by the sandbox test suite. Code is only ever run in an isolated sandbox — never against the EVOLVE host."
            : job.verification === "SCHEMA"
            ? "Output must validate against the required schema."
            : job.verification === "MULTI_MODEL"
            ? "Findings are cross-checked independently before payment."
            : "A human reviewer signs off before the treasury releases funds."}
        </div>
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