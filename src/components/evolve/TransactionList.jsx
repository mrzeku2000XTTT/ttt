import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { fmt } from "@/lib/evolve/constants";

/** Every settlement the treasury has made, with its ledger status. */
export default function TransactionList({ limit = 40 }) {
  const { engine, chainHistory } = useEvolve();
  if (!engine) return null;

  const rows = chainHistory.rows.filter(row => ['CONFIRMED', 'SETTLED'].includes(row.status)).slice(0, limit).map(row => ({ ...row, job_code: row.purpose, agent_code: row.recipient_code, amount: Number(row.amount_sompi) / 1e8 }));
  if (!chainHistory.ready) return <div className="ev-section">Confirmed transaction history unavailable.</div>;
  if (!rows.length) {
    return <div style={{ padding: 12, fontSize: 10, color: "#54657c" }}>No settlements yet.</div>;
  }

  return (
    <div>
      {rows.map((t) => (
        <div key={t.id} style={{ padding: "6px 10px", borderBottom: "1px solid rgba(120,160,200,0.07)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontSize: 10, color: "#7d90a8" }}>{t.job_code}</span>
            <span style={{ fontSize: 10.5, color: "#c9d6e4" }}>{t.agent_code}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>
              +{fmt(t.amount)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "baseline" }}>
            <span style={{ fontSize: 9, color: "#54657c", wordBreak: "break-all", flex: 1 }}>{t.txid}</span>
            <span className="ev-chip" style={{ borderColor: t.status === "CONFIRMED" ? "#34d399" : "#fbbf24", color: t.status === "CONFIRMED" ? "#34d399" : "#fbbf24" }}>
              {t.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}