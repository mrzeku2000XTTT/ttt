/**
 * ConnectScorpion — compact top-bar button with a scorpion logo.
 *
 *   CONNECT SCORPION → verify kaspa_testnet_10 → verify kaspatest: address → DONE
 *
 * If the wallet is on mainnet, the button offers "SWITCH TO TN-10".
 * Private keys never enter EVOLVE — Scorpion is non-custodial.
 */
import React, { useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { ScorpionConnectionState as State } from "@/lib/evolve/scorpionAdapter";

function ScorpionLogo({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* tail curling up and over */}
      <path d="M6 16c0-4 2-7 6-7 2 0 3 1 3 3" />
      {/* stinger */}
      <path d="M15 12l2.2-1.2" />
      {/* body */}
      <path d="M6 16h8.5" />
      {/* head */}
      <circle cx="14.8" cy="16" r="1.1" fill="currentColor" stroke="none" />
      {/* pincers */}
      <path d="M16.2 15l2-1.4M16.2 17l2 1.4" />
      {/* legs */}
      <path d="M7 16v2.2M9 16v2.4M11 16v2.2" />
    </svg>
  );
}

export default function ConnectScorpion() {
  const { wallet } = useEvolve();
  const [open, setOpen] = useState(false);

  if (wallet.connState === State.CONNECTED_TN10) return null;

  const wrong = wallet.connState === State.CONNECTED_WRONG_NETWORK;
  const busy = wallet.busy;
  const label = wrong
    ? (busy ? "SWITCHING…" : "SWITCH TO TN-10")
    : (busy ? "CONNECTING…" : "CONNECT SCORPION");

  const onClick = () => {
    if (wrong) wallet.switchToTN10();
    else wallet.connect();
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        onClick={onClick}
        disabled={busy}
        title={wallet.error || (wrong ? "Your wallet is on the wrong network." : "Human wallet · non-custodial · keys stay in Scorpion")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: wrong ? "rgba(248,113,113,0.14)" : "rgba(34,211,238,0.14)",
          border: `1px solid ${wrong ? "rgba(248,113,113,0.5)" : "rgba(34,211,238,0.5)"}`,
          color: wrong ? "#f87171" : "#22d3ee",
          padding: "6px 10px",
          borderRadius: 5,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          cursor: busy ? "wait" : "pointer",
          opacity: busy ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <ScorpionLogo size={15} />
        <span>{label}</span>
        {wallet.error && (
          <span
            title={wallet.error}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block" }}
          />
        )}
      </button>

      <button
        onClick={() => setOpen((v) => !v)}
        title="What is this?"
        style={{
          background: "none",
          border: "1px solid rgba(34,211,238,0.3)",
          color: "#22d3ee",
          width: 18,
          height: 18,
          borderRadius: 4,
          fontSize: 10,
          lineHeight: 1,
          cursor: "pointer",
          marginLeft: 4,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            width: 230,
            background: "rgba(9,14,24,0.96)",
            border: "1px solid rgba(34,211,238,0.3)",
            borderRadius: 8,
            padding: 12,
            fontSize: 9.5,
            color: "#54657c",
            lineHeight: 1.5,
            letterSpacing: "0.04em",
          }}
        >
          <div style={{ color: "#22d3ee", fontWeight: 800, letterSpacing: "0.18em", marginBottom: 6 }}>
            SCORPION WALLET
          </div>
          <div>Human wallet · non-custodial · keys stay in Scorpion.</div>
          <div style={{ marginTop: 6 }}>
            Scorpion opens → approve EVOLVE → we read your kaspatest: address.
            <br />Mainnet is disabled. TN-10 only.
          </div>
          {wallet.error && (
            <div style={{ marginTop: 8, color: "#f87171", fontSize: 9 }}>{wallet.error}</div>
          )}
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#54657c", fontSize: 9, cursor: "pointer", letterSpacing: "0.1em" }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}