import React, { useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerContracts — shows player's contracts with statuses.
 * PROPOSED / ACCEPTED / ACTIVE / COMPLETED / FAILED / CANCELLED.
 * Shows participants, contributions, reward, reward split, terms.
 * AI may evaluate contracts economically.
 */
const STATUS_COLOR = {
  PROPOSED: C.yellow,
  ACCEPTED: C.cyan,
  ACTIVE: C.green,
  COMPLETED: C.textDim,
  FAILED: C.red,
  CANCELLED: C.textFaint,
};

export default function PlayerContracts({ onClose }) {
  const { engine, currentPlayer, createContract, acceptContract } = useEvolve();
  const [showForm, setShowForm] = useState(false);
  if (!engine || !currentPlayer) return null;

  const myContracts = engine.contracts.filter(
    (c) => c.creator_actor_id === currentPlayer.id || c.participant_actor_ids?.includes(currentPlayer.id)
  );

  return (
    <div className="ev-sheet" style={{ bottom: 56, left: 60, right: 12, maxHeight: "60vh" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">CONTRACTS</span>
        <button className="ev-btn" style={{ marginLeft: "auto", padding: "3px 10px" }} onClick={() => setShowForm((s) => !s)}>{showForm ? "LIST" : "NEW"}</button>
        <button className="ev-btn ev-btn-ghost" style={{ padding: "3px 8px" }} onClick={onClose}>CLOSE</button>
      </div>
      <div className="ev-panel-body ev-scroll">
        {showForm ? (
          <ContractForm onCreate={createContract} playerId={currentPlayer.id} engine={engine} />
        ) : myContracts.length === 0 ? (
          <div style={{ padding: 16, color: C.textFaint, fontSize: 11 }}>No contracts yet. Propose one to cooperate with an AI or human.</div>
        ) : (
          myContracts.map((c) => (
            <div key={c.id} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{c.id}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLOR[c.status] || C.textDim, letterSpacing: "0.08em" }}>{c.status}</span>
              </div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                {c.creator_code} ↔ {c.participant_codes?.join(", ")}
              </div>
              <div style={{ fontSize: 10, color: C.green, marginTop: 3 }}>Reward: {c.reward?.toFixed(2)} tKAS</div>
              {c.reward_distribution && (
                <div style={{ fontSize: 9, color: C.textFaint, marginTop: 2 }}>
                  Split: {Object.entries(c.reward_distribution).map(([id, v]) => `${id.slice(-4)}: ${v.toFixed(1)}`).join(" · ")}
                </div>
              )}
              {c.status === "PROPOSED" && c.creator_actor_id !== currentPlayer.id && (
                <button className="ev-btn" style={{ padding: "3px 10px", marginTop: 6 }} onClick={() => acceptContract(c.id)}>ACCEPT</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ContractForm({ onCreate, playerId, engine }) {
  const [form, setForm] = useState({ partnerId: "", partnerType: "agent", reward: 5, myContribution: "capital", theirContribution: "work", myShare: 0.5 });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const nearby = engine.nearbyActors?.(playerId, 15) || { agents: [], players: [] };
  const partners = [...nearby.agents.map((a) => ({ id: a.id, label: `${a.code} (AI)`, type: "agent" })), ...nearby.players.map((p) => ({ id: p.id, label: `${p.code} (HUMAN)`, type: "player" }))];

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 8, color: C.textFaint, letterSpacing: "0.1em" }}>PARTNER</div>
      <select className="ev-input" value={form.partnerId} onChange={(e) => { const p = partners.find((x) => x.id === e.target.value); set("partnerId", e.target.value); set("partnerType", p?.type || "agent"); }}>
        <option value="">Select nearby actor…</option>
        {partners.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="ev-input" placeholder="Your contribution" value={form.myContribution} onChange={(e) => set("myContribution", e.target.value)} style={{ flex: 1 }} />
        <input className="ev-input" placeholder="Their contribution" value={form.theirContribution} onChange={(e) => set("theirContribution", e.target.value)} style={{ flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="ev-input" type="number" step="0.5" placeholder="Reward" value={form.reward} onChange={(e) => set("reward", Number(e.target.value))} style={{ width: 80 }} />
        <input className="ev-input" type="number" step="0.1" min="0" max="1" placeholder="Your share" value={form.myShare} onChange={(e) => set("myShare", Number(e.target.value))} style={{ width: 80 }} />
      </div>
      <button className="ev-btn" disabled={!form.partnerId} onClick={() => onCreate(form)}>PROPOSE CONTRACT</button>
    </div>
  );
}