/**
 * PaymentStatusOverlay — shows the payment lifecycle after Scorpion broadcast.
 *
 *   BROADCAST → CONFIRMING → CONFIRMED → SETTLED
 *                          ↘ FAILED
 *
 * After Scorpion returns a TXID, this overlay shows:
 *   PAYMENT BROADCAST · 2.00 tKAS · TN-10 · CONFIRMING... · TX abc123...
 *
 * It does NOT say "PAYMENT COMPLETE" until the confirmation watcher detects
 * TN10 confirmation and the settlement service transfers world resources.
 */
import React from "react";
import { TxStatus, statusLabel, statusColor } from "@/lib/evolve/txStateMachine";
import { sompiToKas } from "@/lib/evolve/evolveTxBuilder";

export default function PaymentStatusOverlay({ payment, onDismiss }) {
  if (!payment) return null;

  const { intent, txId, status, receive } = payment;
  const amountKas = intent?.amount_sompi ? sompiToKas(intent.amount_sompi) : "0";
  const color = statusColor(status);
  const label = statusLabel(status);
  const shortTx = txId ? `${txId.slice(0, 10)}…${txId.slice(-6)}` : "—";

  const isBroadcasting = [TxStatus.BROADCAST, TxStatus.CONFIRMING].includes(status);
  const isConfirmed = [TxStatus.CONFIRMED, TxStatus.SETTLED].includes(status);
  const isFailed = [TxStatus.FAILED, TxStatus.CANCELLED, TxStatus.EXPIRED].includes(status);

  return (
    <div style={overlayStyle}>
      <div style={{ ...sheetStyle, borderColor: `${color}55` }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", color, fontWeight: 800, marginBottom: 12 }}>
          {isConfirmed ? "PAYMENT CONFIRMED" : isFailed ? "PAYMENT FAILED" : "PAYMENT BROADCAST"}
        </div>

        <div style={{ fontSize: 22, color: "#eef3f9", fontWeight: 800, fontFamily: "monospace", marginBottom: 4 }}>
          {amountKas} tKAS
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#54657c", fontWeight: 700, marginBottom: 12 }}>
          KASPA TN-10
        </div>

        {/* Status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: isBroadcasting ? "ev-pulse 1.2s infinite" : "none",
          }} />
          <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: "0.1em" }}>
            {isBroadcasting ? "CONFIRMING…" : label.toUpperCase()}
          </span>
        </div>

        {/* Transaction details */}
        <Row label="TX" value={shortTx} mono />
        <Row label="RECIPIENT" value={intent?.recipient_code || intent?.recipient_address?.slice(0, 16) || "—"} />
        <Row label="PURPOSE" value={intent?.purpose || "—"} />
        {receive && isConfirmed && <Row label="RECEIVED" value={receive} strong />}

        {isBroadcasting && (
          <div style={{ fontSize: 8.5, color: "#3a4a5e", marginTop: 10, lineHeight: 1.5, letterSpacing: "0.04em" }}>
            Transaction is broadcast to TN-10. World resources will transfer after confirmation.
            You can close this — confirmation continues in the background.
          </div>
        )}

        {isConfirmed && (
          <div style={{ fontSize: 8.5, color: "#34d399", marginTop: 10, lineHeight: 1.5, letterSpacing: "0.04em" }}>
            ✓ Confirmed on TN-10. World resources have been transferred.
          </div>
        )}

        {isFailed && (
          <div style={{ fontSize: 8.5, color: "#f87171", marginTop: 10, lineHeight: 1.5, letterSpacing: "0.04em" }}>
            ✗ Payment failed. Resource reservation has been released. No resources were transferred.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {isFailed && payment.onRetry && (
            <button style={primaryBtn} onClick={payment.onRetry}>TRY AGAIN</button>
          )}
          <button style={isFailed ? cancelBtn : primaryBtn} onClick={onDismiss}>
            {isBroadcasting ? "CLOSE" : "DONE"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#54657c", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: strong ? 12 : 10, color: strong ? "#eef3f9" : "#9fb0c4", fontWeight: strong ? 800 : 500, fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}

const overlayStyle = {
  position: "absolute", inset: 0, zIndex: 95,
  background: "rgba(3,6,11,0.88)", display: "flex", alignItems: "center", justifyContent: "center",
};
const sheetStyle = {
  background: "rgba(9,14,24,0.98)", border: "1px solid rgba(34,211,238,0.35)", borderRadius: 8,
  padding: 18, width: "min(340px, 90vw)", display: "flex", flexDirection: "column",
};
const primaryBtn = {
  flex: 1, background: "rgba(34,211,238,0.18)", border: "1px solid rgba(34,211,238,0.5)",
  color: "#22d3ee", padding: "9px 12px", borderRadius: 5, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer",
};
const cancelBtn = {
  flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
  color: "#9fb0c4", padding: "9px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
};