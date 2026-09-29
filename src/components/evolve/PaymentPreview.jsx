/**
 * PaymentPreview — shown BEFORE opening Scorpion so the player sees exactly
 * what they pay and receive. Then "REVIEW IN SCORPION" opens the wallet for
 * PIN-signing. Scorpion performs final approval; EVOLVE never auto-signs.
 *
 *   YOU PAY      2.00 tKAS
 *   YOU RECEIVE  20 COMPUTE
 *   RECIPIENT    A#188
 *   NETWORK      KASPA TN-10
 *   [REVIEW IN SCORPION]  [CANCEL]
 */
import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { sompiToKas } from "@/lib/evolve/evolveTxBuilder";

export default function PaymentPreview({ intent, onConfirm, onCancel }) {
  const { wallet } = useEvolve();
  if (!intent) return null;

  const amountKas = sompiToKas(intent.amountSompi);

  return (
    <div style={overlayStyle}>
      <div style={sheetStyle}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800, marginBottom: 12 }}>
          REVIEW PAYMENT
        </div>

        <Row label="YOU PAY" value={`${amountKas} tKAS`} strong />
        {intent.receive && <Row label="YOU RECEIVE" value={intent.receive} strong />}
        <Row label="RECIPIENT" value={intent.recipient?.code || intent.toAddress?.slice(0, 16) || "—"} />
        <Row label="PURPOSE" value={intent.purpose || "—"} />
        <Row label="NETWORK" value="KASPA TN-10" />
        {intent.worldRef && <Row label="REF" value={intent.worldRef} />}

        <div style={{ fontSize: 8.5, color: "#3a4a5e", marginTop: 10, lineHeight: 1.5, letterSpacing: "0.04em" }}>
          Scorpion will open for final approval. You must PIN-sign in the wallet.
          EVOLVE cannot auto-sign your transactions.
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={primaryBtn} disabled={wallet.busy} onClick={onConfirm}>
            {wallet.busy ? "OPENING…" : "REVIEW IN SCORPION"}
          </button>
          <button style={cancelBtn} onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "#54657c", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: strong ? 12 : 10, color: strong ? "#eef3f9" : "#9fb0c4", fontWeight: strong ? 800 : 500, fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

const overlayStyle = {
  position: "absolute", inset: 0, zIndex: 90,
  background: "rgba(3,6,11,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
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
  background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
  color: "#9fb0c4", padding: "9px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
};