/**
 * TransactionActivityPanel — shows pending, confirming, confirmed, and failed
 * payment intents for the current player or observer.
 *
 *   PENDING (1)   CONFIRMED (12)   FAILED (0)
 *
 *   ┌──────────────────────────────────────┐
 *   │ ● CONFIRMING  2.00 tKAS  → A#188     │
 *   │   RESOURCE_PURCHASE · TX abc123…     │
 *   ├──────────────────────────────────────┤
 *   │ ✓ SETTLED    1.50 tKAS  → A#092     │
 *   │   JOB_PAYMENT · TX def456…           │
 *   └──────────────────────────────────────┘
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { TxStatus, statusLabel, statusColor } from "@/lib/evolve/txStateMachine";
import { sompiToKasShort } from "@/lib/evolve/evolveTxBuilder";
import { loadActorIntents } from "@/lib/evolve/paymentIntentService";

export default function TransactionActivityPanel({ onClose }) {
  const { currentPlayer, experimentId } = useEvolve();
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!experimentId || !currentPlayer) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await loadActorIntents(experimentId, currentPlayer.id, 50);
      if (!cancelled) {
        setIntents(data);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 6000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [experimentId, currentPlayer]);

  const pending = intents.filter((i) => [TxStatus.BROADCAST, TxStatus.CONFIRMING, TxStatus.AWAITING_SIGNATURE, TxStatus.SIGNED].includes(i.status));
  const confirmed = intents.filter((i) => [TxStatus.CONFIRMED, TxStatus.SETTLED].includes(i.status));
  const failed = intents.filter((i) => [TxStatus.FAILED, TxStatus.CANCELLED, TxStatus.EXPIRED].includes(i.status));

  const filtered = filter === "PENDING" ? pending : filter === "CONFIRMED" ? confirmed : filter === "FAILED" ? failed : intents;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800 }}>TRANSACTION ACTIVITY</span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <FilterTab label="ALL" count={intents.length} active={filter === "ALL"} onClick={() => setFilter("ALL")} />
          <FilterTab label="PENDING" count={pending.length} active={filter === "PENDING"} onClick={() => setFilter("PENDING")} />
          <FilterTab label="CONFIRMED" count={confirmed.length} active={filter === "CONFIRMED"} onClick={() => setFilter("CONFIRMED")} />
          <FilterTab label="FAILED" count={failed.length} active={filter === "FAILED"} onClick={() => setFilter("FAILED")} />
        </div>

        {/* Transaction list */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "50vh" }}>
          {loading && <div style={{ fontSize: 10, color: "#54657c", padding: 12, textAlign: "center" }}>Loading…</div>}
          {!loading && !filtered.length && (
            <div style={{ fontSize: 10, color: "#54657c", padding: 24, textAlign: "center" }}>No transactions</div>
          )}
          {filtered.map((intent) => (
            <TxRow key={intent.id} intent={intent} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterTab({ label, count, active, onClick }) {
  return (
    <button style={{
      ...tabStyle,
      background: active ? "rgba(34,211,238,0.15)" : "transparent",
      borderColor: active ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.1)",
      color: active ? "#22d3ee" : "#7d8da3",
    }} onClick={onClick}>
      {label} ({count})
    </button>
  );
}

function TxRow({ intent }) {
  const color = statusColor(intent.status);
  const label = statusLabel(intent.status);
  const amount = sompiToKasShort(intent.amount_sompi || 0);
  const shortTx = intent.tx_id ? `${intent.tx_id.slice(0, 10)}…${intent.tx_id.slice(-6)}` : "—";
  const isPending = [TxStatus.BROADCAST, TxStatus.CONFIRMING, TxStatus.AWAITING_SIGNATURE, TxStatus.SIGNED].includes(intent.status);

  return (
    <div style={rowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: color, boxShadow: `0 0 6px ${color}`,
          animation: isPending ? "ev-pulse 1.2s infinite" : "none",
          flexShrink: 0,
        }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: color, fontWeight: 700, letterSpacing: "0.08em" }}>{label.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: "#eef3f9", fontWeight: 700, fontFamily: "monospace" }}>{amount} tKAS</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <span style={{ fontSize: 9, color: "#7d8da3" }}>
              {intent.sender_code || "—"} → {intent.recipient_code || "—"}
            </span>
            <span style={{ fontSize: 8, color: "#54657c", fontFamily: "monospace" }} title={intent.tx_id || ""}>{shortTx}</span>
          </div>
          <div style={{ fontSize: 8.5, color: "#54657c", marginTop: 2, letterSpacing: "0.04em" }}>
            {intent.purpose || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "absolute", inset: 0, zIndex: 90,
  background: "rgba(3,6,11,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
};
const panelStyle = {
  background: "rgba(9,14,24,0.98)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 8,
  padding: 16, width: "min(420px, 92vw)", maxHeight: "70vh", display: "flex", flexDirection: "column",
};
const closeBtn = {
  background: "transparent", border: "none", color: "#7d8da3", fontSize: 14, cursor: "pointer", padding: "2px 6px",
};
const tabStyle = {
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
  padding: "4px 8px", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
};
const rowStyle = {
  padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)",
};