import React from "react";
import { Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { ScorpionConnectionState as State } from "@/lib/evolve/scorpionAdapter";

/**
 * HumanDashboardButton — the single control that opens/closes the Human Dashboard.
 *
 * Only appears once Scorpion is connected. Replaces the old always-on
 * WALLET · ACTIVITY · DISCONNECT bar (those actions now live inside the dashboard).
 */
export default function HumanDashboardButton({ open, onToggle }) {
  const { wallet, currentPlayer, pendingTxCount } = useEvolve();

  if (wallet.connState === State.DISCONNECTED || wallet.connState === State.CONNECTING) return null;

  const tn10 = wallet.isTN10;

  return (
    <div className="ev-dash-row">
      <button
        className={`ev-dash-toggle ${open ? "is-open" : ""}`}
        onClick={onToggle}
        title={open ? "Close Human Dashboard" : "Open Human Dashboard"}
        aria-expanded={open}
      >
        <Wallet className="h-3.5 w-3.5" />
        <span className="ev-dash-toggle-code">{currentPlayer?.code || "PLAYER"}</span>
        <span className={`ev-dash-toggle-dot ${tn10 ? "is-on" : "is-off"}`} />
        <span className="ev-dash-toggle-bal">{tn10 ? `${wallet.balanceKasShort} tKAS` : "WRONG NET"}</span>
        {pendingTxCount > 0 && <span className="ev-dash-toggle-pending">PENDING</span>}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}