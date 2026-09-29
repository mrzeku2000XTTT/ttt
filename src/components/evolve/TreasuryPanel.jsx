import React from "react";
import { Landmark } from "lucide-react";
import PanelShell from "./PanelShell";
import TransactionList from "./TransactionList";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt } from "@/lib/evolve/constants";

/** The experiment treasury — the only source of payment for verified work. */
export default function TreasuryPanel({ onClose }) {
  const { engine } = useEvolve();
  if (!engine) return null;
  const s = engine.stats();

  return (
    <PanelShell title="Experiment Treasury" subtitle={engine.kaspa.ledger === "mock" ? "DEVELOPMENT LEDGER" : "KASPA TN-10"} onClose={onClose} width={348}>
      <div className="ev-section">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Landmark className="h-4 w-4" style={{ color: "#34d399" }} />
          <div>
            <div className="ev-label">Treasury Balance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>{fmt(s.treasury)}</div>
          </div>
        </div>
        <div style={{ fontSize: 9.5, color: "#54657c", marginTop: 6, wordBreak: "break-all" }}>{engine.treasury.address}</div>
      </div>

      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Total Paid" value={`${fmt(s.totalPaid)} tKAS`} color="#34d399" />
          <Stat label="Pending" value={`${fmt(s.pending)} tKAS`} color="#fbbf24" />
          <Stat label="Jobs paid" value={engine.jobs.filter((j) => j.status === "PAID").length} />
          <Stat label="Ledger" value={engine.kaspa.ledger === "mock" ? "DEVELOPMENT" : "TN-10"} />
        </div>
      </div>

      <div className="ev-section" style={{ padding: "8px 10px 4px" }}>
        <div className="ev-label">Transactions</div>
      </div>
      <TransactionList limit={60} />

      <div className="ev-section">
        <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.5 }}>
          {engine.kaspa.ledger === "mock"
            ? "Running on the DEVELOPMENT LEDGER: wallets, balances, sends and confirmations are simulated. Swapping in TN10KaspaService changes nothing else in the app."
            : "Settling on Kaspa TN-10. Confirmations are wall-clock and are never accelerated by simulation speed."}
        </div>
      </div>
    </PanelShell>
  );
}

const Stat = ({ label, value, color }) => (
  <div>
    <div className="ev-label">{label}</div>
    <div className="ev-value" style={{ color: color || "#eef3f9", fontWeight: 600 }}>{value}</div>
  </div>
);