import React from "react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { marketSnapshot, economyTotals } from "@/lib/evolve/economyService";
import { fmt, fmtInt } from "@/lib/evolve/constants";

/** The simulated resource economy: pools, prices and what agents are worth. */
export default function EconomyPanel({ onClose }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const market = marketSnapshot(engine.world);
  const totals = economyTotals(engine.agents);

  return (
    <PanelShell title="Economy" subtitle={`Day ${engine.world.day} · ${fmtInt(totals.population)} active agents`} onClose={onClose} width={300}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Resource Pools</div>
        {market.map((m) => {
          const max = Math.max(1, ...market.map((x) => x.pool));
          return (
            <div key={m.id} style={{ marginBottom: 6 }}>
              <div className="ev-row">
                <span className="ev-label" style={{ color: m.color }}>{m.label}</span>
                <span className="ev-value" style={{ fontSize: 10.5 }}>
                  {m.pool.toFixed(0)} <span style={{ color: "#54657c" }}>@ {m.price.toFixed(2)}</span>
                </span>
              </div>
              <span className="ev-bar" style={{ display: "block", marginTop: 3 }}>
                <i style={{ width: `${(m.pool / max) * 100}%`, background: m.color }} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Agent Economics</div>
        <Row label="Total wealth" value={`${fmt(totals.wealth)} tKAS`} />
        <Row label="Lifetime earned" value={`${fmt(totals.earned)} tKAS`} color="#34d399" />
        <Row label="Lifetime spent" value={`${fmt(totals.spent)} tKAS`} color="#f87171" />
        <Row label="Net profit" value={`${fmt(totals.profit)} tKAS`} color={totals.profit >= 0 ? "#34d399" : "#f87171"} />
        <Row label="Profitable agents" value={`${totals.profitable} / ${totals.population}`} />
        <Row label="Median balance" value={`${fmt(totals.median)} tKAS`} />
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Settlement</div>
        <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.5 }}>
          Resources are simulated and live in world state — they are not tokens. Test KAS is the only
          settlement currency, and every payment is routed through the ledger adapter.
        </div>
      </div>
    </PanelShell>
  );
}

const Row = ({ label, value, color }) => (
  <div className="ev-row" style={{ padding: "2.5px 0" }}>
    <span className="ev-label">{label}</span>
    <span className="ev-value" style={{ color: color || "#eef3f9", fontSize: 10.5 }}>{value}</span>
  </div>
);