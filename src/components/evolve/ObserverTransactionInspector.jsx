/**
 * ObserverTransactionInspector — public observers can inspect economic
 * transactions associated with public game events.
 *
 *   FROM  A#81
 *   TO    P#91
 *   2.00 tKAS
 *   PURPOSE  COMPUTE PURCHASE
 *   STATUS   CONFIRMED
 *   TXID     abc123...
 *
 * Never exposes secret information — only public addresses and economic metadata.
 */
import React from "react";
import { TxStatus, statusLabel, statusColor } from "@/lib/evolve/txStateMachine";
import { sompiToKas } from "@/lib/evolve/evolveTxBuilder";

export default function ObserverTransactionInspector({ tx, onClose }) {
  if (!tx) return null;

  const color = statusColor(tx.status);
  const amountKas = sompiToKas(tx.amount_sompi || 0);
  const shortTx = tx.txid ? `${tx.txid.slice(0, 12)}…${tx.txid.slice(-8)}` : "—";

  return (
    <div style={overlayStyle}>
      <div style={{ ...panelStyle, borderColor: `${color}55` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800 }}>TRANSACTION</span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        <Row label="FROM" value={tx.sender_code || "—"} mono />
        <Row label="TO" value={tx.recipient_code || "—"} mono />
        <Row label="AMOUNT" value={`${amountKas} tKAS`} strong />
        <Row label="PURPOSE" value={tx.purpose || "—"} />
        <Row label="STATUS" value={statusLabel(tx.status)} color={color} />

        <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 4 }}>
          <div style={{ fontSize: 8, letterSpacing: "0.14em", color: "#54657c", fontWeight: 700, marginBottom: 4 }}>TXID</div>
          <div style={{ fontSize: 9, color: "#9fb0c4", fontFamily: "monospace", wordBreak: "break-all" }} title={tx.txid || ""}>
            {tx.txid || "—"}
          </div>
        </div>

        {tx.sender_address && (
          <div style={{ marginTop: 6, fontSize: 8, color: "#3a4a5e", fontFamily: "monospace" }}>
            FROM: {tx.sender_address.slice(0, 20)}…
          </div>
        )}
        {tx.recipient_address && (
          <div style={{ fontSize: 8, color: "#3a4a5e", fontFamily: "monospace" }}>
            TO: {tx.recipient_address.slice(0, 20)}…
          </div>
        )}

        <div style={{ fontSize: 8, color: "#3a4a5e", marginTop: 10, lineHeight: 1.5, letterSpacing: "0.04em" }}>
          Public transaction record. No private key information is exposed.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, strong, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#54657c", fontWeight: 700 }}>{label}</span>
      <span style={{
        fontSize: strong ? 12 : 10,
        color: color || (strong ? "#eef3f9" : "#9fb0c4"),
        fontWeight: strong ? 800 : 500,
        fontFamily: mono ? "monospace" : "inherit",
      }}>{value}</span>
    </div>
  );
}

const overlayStyle = {
  position: "absolute", inset: 0, zIndex: 90,
  background: "rgba(3,6,11,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
};
const panelStyle = {
  background: "rgba(9,14,24,0.98)", border: "1px solid rgba(34,211,238,0.35)", borderRadius: 8,
  padding: 18, width: "min(360px, 90vw)", display: "flex", flexDirection: "column",
};
const closeBtn = {
  background: "transparent", border: "none", color: "#7d8da3", fontSize: 14, cursor: "pointer", padding: "2px 6px",
};