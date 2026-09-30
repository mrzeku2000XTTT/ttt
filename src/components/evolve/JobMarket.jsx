import React, { useState } from "react";
import { Briefcase } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt } from "@/lib/evolve/constants";

const STATUS_COLOR = {
  OPEN: "#22d3ee",
  CLAIMED: "#60a5fa",
  RUNNING: "#60a5fa",
  SUBMITTED: "#a78bfa",
  VERIFYING: "#fbbf24",
  VERIFIED: "#34d399",
  PAYMENT_PENDING: "#fbbf24",
  PAID: "#34d399",
  FAILED: "#f87171",
};

const FILTERS = ["OPEN", "ACTIVE", "ALL"];

/** The real job marketplace. Work only pays once verification passes. */
export default function JobMarket({ onClose, onSelectJob }) {
  const { engine, say } = useEvolve();
  const [filter, setFilter] = useState("OPEN");
  const [agentId, setAgentId] = useState("");
  if (!engine) return null;

  const idle = engine.agents.filter((a) => a.status !== "archived").sort((a, b) => b.fitness - a.fitness);
  const chosen = agentId || idle[0]?.id || "";

  const jobs = engine.jobs.filter((j) =>
    filter === "ALL" ? true : filter === "OPEN" ? j.status === "OPEN" : !["PAID", "FAILED"].includes(j.status)
  );

  return (
    <PanelShell title="Job Market" subtitle={`${engine.jobs.filter((j) => j.status === "OPEN").length} open · ${engine.jobs.length} total`} onClose={onClose} width={392}>
      <div className="ev-scroll" style={{ display: "flex", gap: 4, padding: "6px 9px", overflowX: "auto", borderBottom: "1px solid rgba(120,160,200,0.1)" }}>
        {FILTERS.map((f) => (
          <button key={f} className={`ev-chip ${filter === f ? "is-on" : ""}`} style={{ flex: "none" }} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <select
          value={chosen}
          onChange={(e) => setAgentId(e.target.value)}
          style={{
            marginLeft: "auto", background: "#0b1220", border: "1px solid rgba(120,160,200,0.2)",
            borderRadius: 4, color: "#c9d6e4", fontSize: 10, padding: "3px 5px", maxWidth: 150,
          }}
        >
          {idle.slice(0, 60).map((a) => (
            <option key={a.id} value={a.id}>{a.code} · fit {a.fitness.toFixed(2)}</option>
          ))}
        </select>
      </div>

      {jobs.length === 0 && (
        <div style={{ padding: "18px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, color: "#7d90a8", lineHeight: 1.5 }}>
            {filter === "OPEN"
              ? "No open jobs right now — every job posted so far has been claimed."
              : "No jobs in this view."}
          </div>
          {engine.jobs.length > 0 && filter !== "ALL" && (
            <button className="ev-btn ev-btn-ghost" style={{ marginTop: 10 }} onClick={() => setFilter("ALL")}>
              Show all {engine.jobs.length} jobs
            </button>
          )}
        </div>
      )}

      {jobs.map((job) => (
        <div key={job.id} className="ev-section" style={{ cursor: "pointer", padding: "7px 10px" }} onClick={() => onSelectJob(job.id)}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#eef3f9" }}>{job.code}</span>
            <span className="ev-chip" style={{ borderColor: STATUS_COLOR[job.status], color: STATUS_COLOR[job.status] }}>{job.status}</span>
            <span className="ev-chip">{job.type}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#34d399" }}>{fmt(job.reward)} tKAS</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#c9d6e4", marginTop: 4 }}>{job.title}</div>
          <div style={{ fontSize: 9.5, color: "#7d90a8", marginTop: 2, lineHeight: 1.35 }}>{job.brief}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center", flexWrap: "wrap", minHeight: 22 }}>
            <span className="ev-label">Difficulty {job.difficulty}</span>
            <span className="ev-label">Verification {job.verification}</span>
            {job.status !== "OPEN" && job.progress > 0 && (
              <span className="ev-bar" style={{ flex: 1, maxWidth: 90 }}>
                <i style={{ width: `${job.progress * 100}%`, background: "#22d3ee" }} />
              </span>
            )}
            {job.status === "OPEN" && (
              <button
                className="ev-btn"
                style={{ marginLeft: "auto", padding: "5px 9px", fontSize: 9.5, flex: "none" }}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = engine.claimJob(chosen, job.id);
                  say(r.message, r.ok);
                }}
              >
                <Briefcase className="h-3 w-3" /> Claim
              </button>
            )}
          </div>
        </div>
      ))}
    </PanelShell>
  );
}