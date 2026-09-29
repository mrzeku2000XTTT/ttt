/**
 * ConnectScorpion — the human wallet connection flow.
 *
 *   CONNECT SCORPION → verify kaspa_testnet_10 → verify kaspatest: address → DONE
 *
 * If the wallet is on mainnet, we show "SWITCH TO TN-10" and lock economic actions.
 * Private keys never enter EVOLVE — Scorpion is non-custodial.
 */
import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { ScorpionConnectionState as State } from "@/lib/evolve/scorpionAdapter";

export default function ConnectScorpion({ compact = false }) {
  const { wallet } = useEvolve();

  if (wallet.connState === State.CONNECTED_TN10) return null;

  const wrong = wallet.connState === State.CONNECTED_WRONG_NETWORK;

  return (
    <div className="ev-scorpion-connect" style={panelStyle(compact)}>
      <div style={headerStyle}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800 }}>
          {wrong ? "EVOLVE REQUIRES KASPA TN-10" : "CONNECT SCORPION"}
        </div>
        <div style={{ fontSize: 9.5, color: "#54657c", marginTop: 4, letterSpacing: "0.08em" }}>
          {wrong ? "Your wallet is on the wrong network." : "Human wallet · non-custodial · keys stay in Scorpion"}
        </div>
      </div>

      {wallet.error && (
        <div style={errorStyle}>{wallet.error}</div>
      )}

      {wrong ? (
        <button style={btnStyle(true)} disabled={wallet.busy} onClick={wallet.switchToTN10}>
          {wallet.busy ? "SWITCHING…" : "SWITCH TO TN-10"}
        </button>
      ) : (
        <button style={btnStyle(true)} disabled={wallet.busy} onClick={wallet.connect}>
          {wallet.busy ? "CONNECTING…" : "CONNECT SCORPION"}
        </button>
      )}

      {!compact && (
        <div style={{ fontSize: 8.5, color: "#3a4a5e", marginTop: 8, lineHeight: 1.5, letterSpacing: "0.04em" }}>
          Scorpion opens → approve EVOLVE → we read your kaspatest: address.
          <br />Mainnet is disabled. TN-10 only.
        </div>
      )}
    </div>
  );
}

const panelStyle = (compact) => ({
  background: "rgba(9,14,24,0.92)",
  border: "1px solid rgba(34,211,238,0.3)",
  borderRadius: 8,
  padding: compact ? 10 : 14,
  display: "flex",
  flexDirection: "column",
  gap: 8,
});
const headerStyle = { marginBottom: 2 };
const btnStyle = (primary) => ({
  background: primary ? "rgba(34,211,238,0.18)" : "transparent",
  border: `1px solid ${primary ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.15)"}`,
  color: primary ? "#22d3ee" : "#9fb0c4",
  padding: "8px 12px",
  borderRadius: 5,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  cursor: "pointer",
});
const errorStyle = {
  fontSize: 9.5,
  color: "#f87171",
  background: "rgba(248,113,113,0.08)",
  border: "1px solid rgba(248,113,113,0.25)",
  borderRadius: 4,
  padding: "5px 8px",
};