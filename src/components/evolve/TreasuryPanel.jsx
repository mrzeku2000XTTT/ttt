import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import ChainAmount from '@/components/evolve/ChainAmount';
import { Landmark } from "lucide-react";
import PanelShell from "./PanelShell";
import TransactionList from "./TransactionList";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt } from "@/lib/evolve/constants";

/** The experiment treasury — the only source of payment for verified work. */
export default function TreasuryPanel({ onClose }) {
  const { engine, chainBalances } = useEvolve();
  if (!engine) return null;
  const s = engine.stats();

  return (
    <PanelShell title="Experiment Treasury" subtitle="KASPA TN-10 · CHAIN BALANCE" onClose={onClose} width={348}>
      <div className="ev-section">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Landmark className="h-4 w-4" style={{ color: "#34d399" }} />
          <div>
            <div className="ev-label">Treasury Balance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", fontVariantNumeric: "tabular-nums" }}><LiveBalance actor={engine.treasury} unit /></div>
          </div>
        </div>
        <div style={{ fontSize: 9.5, color: "#54657c", marginTop: 6, wordBreak: "break-all" }}>{chainBalances.addressFor(engine.treasury).startsWith('kaspatest:') ? chainBalances.addressFor(engine.treasury) : 'No TN-10 treasury wallet linked'}</div>
      </div>

      <div className="ev-section">
        <div className="ev-grid2">
          <Stat label="Total Paid" value={<ChainAmount actor={engine.treasury} direction="out" unit />} color="#34d399" />
          <Stat label="Pending" value={<ChainAmount actor={engine.treasury} direction="pending" unit />} color="#fbbf24" />
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
          Balance comes directly from TN-10. Transfer totals include recorded, confirmed EVOLVE transactions only. An unlinked wallet or unavailable chain answer is shown as N/A.
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