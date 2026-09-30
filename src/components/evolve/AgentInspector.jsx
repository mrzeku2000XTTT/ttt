import React, { useState } from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import ChainAmount from '@/components/evolve/ChainAmount';
import { GitBranch, Baby, Building2, Coins } from "lucide-react";
import PanelShell from "./PanelShell";
import GenomePanel from "./GenomePanel";
import DecisionHistory from "./DecisionHistory";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt } from "@/lib/evolve/constants";

const TABS = ["Overview", "Genome", "Decisions"];

/**
 * AgentInspector — everything known about one agent: lineage, wallet, work,
 * economics, genome and the decisions that produced them.
 */
export default function AgentInspector({ agentId, onClose, onLineage }) {
  const { engine, say, chainBalances } = useEvolve();
  const [tab, setTab] = useState("Overview");
  const agent = engine?.agentById.get(agentId);
  if (!agent) return null;

  const job = engine.jobs.find((j) => j.id === agent.current_job_id);
  const org = engine.orgs.find((o) => o.id === agent.organization_id);
  const profit = agent.lifetime_earnings - agent.lifetime_expenses;

  return (
    <PanelShell
      title={`Agent ${agent.code}`}
      subtitle={`${agent.name} · Generation ${agent.generation} · Fitness ${agent.fitness.toFixed(3)}`}
      onClose={onClose}
      width={352}
    >
      <div style={{ display: "flex", gap: 4, padding: "7px 9px", borderBottom: "1px solid rgba(120,160,200,0.1)" }}>
        {TABS.map((t) => (
          <button key={t} className={`ev-chip ${tab === t ? "is-on" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div className="ev-section">
            <div className="ev-grid2">
              <Stat label="Status" value={agent.status.toUpperCase()} color={agent.status === "working" ? "#22d3ee" : "#eef3f9"} />
              <Stat label="Organization" value={agent.organization_id ? (engine.orgs.find((o) => o.id === agent.organization_id)?.name || "—") : "Independent"} />
              <Stat label="Generation" value={agent.generation} />
              <Stat label="Age" value={`${agent.age_days.toFixed(1)} days`} />
            </div>
          </div>

          <div className="ev-section">
            <div className="ev-label" style={{ marginBottom: 5 }}>Kaspa Testnet</div>
            <div style={{ fontSize: 9.5, color: "#7d90a8", wordBreak: "break-all", lineHeight: 1.4 }}>{agent.address || "—"}</div>
            <div className="ev-row" style={{ marginTop: 6 }}>
              <span className="ev-label">Wallet Balance</span>
              <span className="ev-value" style={{ color: "#34d399", fontWeight: 700 }}><LiveBalance actor={agent} unit /></span>
            </div>
          </div>

          <div className="ev-section">
            <div className="ev-label" style={{ marginBottom: 5 }}>Lineage</div>
            <div className="ev-row"><span className="ev-label">Parent</span><span className="ev-value">{engine.agentById.get(agent.parent_id)?.code || "GENESIS"}</span></div>
            <div className="ev-row" style={{ marginTop: 3 }}>
              <span className="ev-label">Children</span>
              <span className="ev-value" style={{ fontSize: 10.5 }}>
                {agent.children.length ? agent.children.map((c) => engine.agentById.get(c)?.code || c).join(", ") : "NONE"}
              </span>
            </div>
            <button className="ev-btn ev-btn-ghost" style={{ marginTop: 7, width: "100%", padding: "6px" }} onClick={() => onLineage(agent.id)}>
              <GitBranch className="h-3 w-3" /> View lineage
            </button>
          </div>

          <div className="ev-section">
            <div className="ev-label" style={{ marginBottom: 5 }}>Current Work</div>
            {job ? (
              <>
                <div className="ev-value">{job.code} · {job.title}</div>
                <div className="ev-label" style={{ marginTop: 3 }}>{job.type} · {job.status} · {fmt(job.reward)} tKAS</div>
                <span className="ev-bar" style={{ display: "block", marginTop: 5 }}>
                  <i style={{ width: `${job.progress * 100}%`, background: "#22d3ee" }} />
                </span>
              </>
            ) : (
              <div className="ev-label">IDLE — no job claimed</div>
            )}
          </div>

          <div className="ev-section">
            <div className="ev-label" style={{ marginBottom: 5 }}>Economics</div>
            <div className="ev-row"><span className="ev-label">Confirmed EVOLVE inflow</span><span className="ev-value" style={{ color: "#34d399" }}><ChainAmount actor={agent} /></span></div>
            <div className="ev-row"><span className="ev-label">Expenses</span><span className="ev-value" style={{ color: "#f87171" }}><ChainAmount actor={agent} direction="out" /></span></div>
            <div className="ev-row"><span className="ev-label">Profit</span><span className="ev-value" style={{ color: profit >= 0 ? "#34d399" : "#f87171" }}><ChainAmount actor={agent} direction="net" /></span></div>
            <div className="ev-row"><span className="ev-label">Jobs completed</span><span className="ev-value">{agent.jobs_completed} · failed {agent.jobs_failed}</span></div>
          </div>

          <div className="ev-section">
            <div className="ev-label" style={{ marginBottom: 5 }}>Assets</div>
            <div className="ev-grid2">
              <Stat label="Compute" value={Math.round(agent.assets?.compute || 0)} />
              <Stat label="Energy" value={Math.round(agent.assets?.energy || 0)} />
              <Stat label="Servers" value={Math.round(agent.assets?.servers || 0)} />
              <Stat label="Information" value={Math.round(agent.assets?.information || 0)} />
            </div>
          </div>

          {org && (
            <div className="ev-section">
              <div className="ev-label" style={{ marginBottom: 4 }}>Organization</div>
              <div className="ev-value">{org.name}</div>
              <div className="ev-label" style={{ marginTop: 2 }}>Treasury <LiveBalance actor={org} /> · Reputation {org.reputation.toFixed(0)}</div>
            </div>
          )}

          <div className="ev-section" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <button
              className="ev-btn"
              style={{ padding: "6px 9px", fontSize: 9.5 }}
              onClick={() => {
                const r = engine.reproduce(agent.id);
                say(r.message, r.ok);
              }}
            >
              <Baby className="h-3 w-3" /> Reproduce
            </button>
            <button
              className="ev-btn ev-btn-ghost"
              style={{ padding: "6px 9px", fontSize: 9.5 }}
              onClick={() => {
                const r = engine.formOrg(agent.id);
                say(r.message, r.ok);
              }}
            >
              <Building2 className="h-3 w-3" /> Found org
            </button>
            <button
              className="ev-btn ev-btn-ghost"
              style={{ padding: "6px 9px", fontSize: 9.5 }}
              onClick={() => {
                const r = engine.contributeToOrg(agent.id, Math.min(5, Math.max(0, (chainBalances.balanceFor(agent) ?? 0) / 4)));
                say(r.message, r.ok);
              }}
            >
              <Coins className="h-3 w-3" /> Contribute
            </button>
          </div>
        </>
      )}

      {tab === "Genome" && (
        <div className="ev-section">
          <GenomePanel genome={agent.genome} delta={agent.genome_delta} />
        </div>
      )}

      {tab === "Decisions" && (
        <div className="ev-section">
          <DecisionHistory decisions={agent.decisions} />
        </div>
      )}
    </PanelShell>
  );
}

const Stat = ({ label, value, color }) => (
  <div>
    <div className="ev-label">{label}</div>
    <div className="ev-value" style={{ color: color || "#eef3f9", fontWeight: 600 }}>{value}</div>
  </div>
);