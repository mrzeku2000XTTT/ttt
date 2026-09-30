import React, { useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { JOB_TYPES, VERIFICATION_METHODS, C } from "@/lib/evolve/constants";

/**
 * PlayerJobs — tabs: AVAILABLE / MY JOBS / POST JOB.
 * AVAILABLE shows real jobs from the shared job market.
 * POST JOB creates an actual Job record and escrows development funds.
 */
export default function PlayerJobs({ onClose }) {
  const { engine, currentPlayer, postPlayerJob, chainBalances } = useEvolve();
  const [tab, setTab] = useState("AVAILABLE");

  if (!engine || !currentPlayer) return null;

  const openJobs = engine.jobs.filter((j) => j.status === "OPEN");
  const myJobs = engine.jobs.filter((j) => j.posted_by === currentPlayer.id || j.claimed_by === currentPlayer.id);

  return (
    <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, maxHeight: "60vh", width: "auto" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">JOBS</span>
        <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {["AVAILABLE", "MY JOBS", "POST JOB"].map((t) => (
            <button key={t} className={tab === t ? "ev-chip is-on" : "ev-chip"} onClick={() => setTab(t)} style={{ border: "none", cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll">
        {tab === "AVAILABLE" && <JobList jobs={openJobs} />}
        {tab === "MY JOBS" && <JobList jobs={myJobs} emptyMsg="You have no jobs yet." />}
        {tab === "POST JOB" && <PostJobForm onPost={(d) => postPlayerJob(d)} balance={chainBalances.balanceFor(currentPlayer)} />}
      </div>
    </div>
  );
}

function JobList({ jobs, emptyMsg }) {
  if (!jobs.length) return <div style={{ padding: 16, color: C.textFaint, fontSize: 11 }}>{emptyMsg || "No open jobs."}</div>;
  return (
    <div>
      {jobs.map((j) => (
        <div key={j.id} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{j.code} · {j.title}</span>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>{j.reward.toFixed(2)} tKAS</span>
          </div>
          <div style={{ fontSize: 9, color: C.textFaint, marginTop: 3 }}>{j.type} · {j.difficulty} · {j.status}</div>
          {j.brief && <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{j.brief}</div>}
        </div>
      ))}
    </div>
  );
}

function PostJobForm({ onPost, balance }) {
  const [form, setForm] = useState({ type: "RESEARCH", title: "", brief: "", reward: 2, verification: "SCHEMA", difficulty: "MEDIUM", access: "GLOBAL" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.title.trim()) return;
    onPost(form);
  };
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="TITLE"><input className="ev-input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Job title" /></Field>
      <Field label="TASK"><textarea className="ev-input" rows={2} value={form.brief} onChange={(e) => set("brief", e.target.value)} placeholder="What must be produced" /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="TYPE"><select className="ev-input" value={form.type} onChange={(e) => set("type", e.target.value)}>{JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="REWARD (tKAS)"><input className="ev-input" type="number" step="0.5" value={form.reward} onChange={(e) => set("reward", Number(e.target.value))} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="VERIFICATION"><select className="ev-input" value={form.verification} onChange={(e) => set("verification", e.target.value)}>{VERIFICATION_METHODS.map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
        <Field label="DIFFICULTY"><select className="ev-input" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></Field>
        <Field label="ACCESS"><select className="ev-input" value={form.access} onChange={(e) => set("access", e.target.value)}><option>GLOBAL</option><option>REGIONAL</option><option>LOCAL</option></select></Field>
      </div>
      <div style={{ fontSize: 9, color: C.textFaint }}>Balance: {balance === undefined ? 'N/A' : `${balance.toFixed(4)} tKAS`} · Reward is escrowed on post.</div>
      <button className="ev-btn" onClick={submit} disabled={balance === undefined || form.reward > balance} style={{ alignSelf: "flex-start" }}>POST JOB</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 8, letterSpacing: "0.1em", color: C.textFaint }}>{label}</span>
      {children}
    </div>
  );
}