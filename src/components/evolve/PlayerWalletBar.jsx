/**
 * PlayerWalletBar — the human player's Scorpion wallet HUD.
 *
 *   WALLET · SCORPION · ● TN-10 · kaspatest:q… · 12.48 tKAS
 *   [WALLET] [ACTIVITY] [DISCONNECT]
 *
 * Shows chain-derived balance (sompi → tKAS). No private-key controls — those
 * belong to Scorpion. When on mainnet, economic actions are locked.
 */
import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { ScorpionConnectionState as State } from "@/lib/evolve/scorpionAdapter";
import { TxStatus } from "@/lib/evolve/txStateMachine";

export default function PlayerWalletBar({ onActivity }) {
  const { wallet, paymentStatus, pendingTxCount } = useEvolve();

  if (wallet.connState === State.DISCONNECTED || wallet.connState === State.CONNECTING) return null;

  const tn10 = wallet.isTN10;
  const addr = wallet.address || "";
  const shortAddr = addr ? `${addr.slice(0, 12)}…${addr.slice(-4)}` : "";
  const hasPending = paymentStatus && [TxStatus.BROADCAST, TxStatus.CONFIRMING].includes(paymentStatus.status);

  return (
    <div style={barStyle(tn10)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.18em", color: "#54657c", fontWeight: 700 }}>SCORPION</span>
        <span style={dotStyle(tn10)} title={tn10 ? "TN-10" : "WRONG NETWORK"} />
        <span style={{ fontSize: 9, letterSpacing: "0.12em", color: tn10 ? "#22d3ee" : "#f87171", fontWeight: 700 }}>
          {tn10 ? "TN-10" : "WRONG NET"}
        </span>
        {shortAddr && (
          <span style={{ fontSize: 9, color: "#7d8da3", fontFamily: "monospace", letterSpacing: "0.02em" }} title={addr}>
            {shortAddr}
          </span>
        )}
        {tn10 && (
          <span style={{ fontSize: 10.5, color: "#eef3f9", fontWeight: 700, marginLeft: 4 }}>
            {wallet.balanceKasShort} tKAS
          </span>
        )}
        {hasPending && (
          <button style={pendingBtn} onClick={onActivity} title="Pending transactions">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 4px #22d3ee", animation: "ev-pulse 1s infinite" }} />
            PENDING
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={miniBtn} onClick={wallet.openWallet} title="Open Scorpion wallet">WALLET</button>
        {onActivity && <button style={miniBtn} onClick={onActivity}>ACTIVITY</button>}
        <button style={miniBtn} onClick={wallet.disconnect}>DISCONNECT</button>
      </div>
    </div>
  );
}

const barStyle = (tn10) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  background: "rgba(9,14,24,0.92)",
  border: `1px solid ${tn10 ? "rgba(34,211,238,0.3)" : "rgba(248,113,113,0.3)"}`,
  borderRadius: 6,
  padding: "6px 10px",
  flex: 1,
  minWidth: 0,
});
const dotStyle = (tn10) => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: tn10 ? "#22d3ee" : "#f87171",
  boxShadow: tn10 ? "0 0 6px #22d3ee" : "0 0 6px #f87171",
  flexShrink: 0,
});
const miniBtn = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#9fb0c4",
  fontSize: 8.5,
  letterSpacing: "0.1em",
  fontWeight: 700,
  padding: "3px 7px",
  borderRadius: 4,
  cursor: "pointer",
};
const pendingBtn = {
  display: "flex", alignItems: "center", gap: 4,
  background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.35)",
  color: "#22d3ee", fontSize: 8, letterSpacing: "0.1em", fontWeight: 700,
  padding: "2px 6px", borderRadius: 3, cursor: "pointer",
};