import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import PanelShell from "./PanelShell";
import GenomePanel from "./GenomePanel";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { meanGenome } from "@/lib/evolve/genome";
import { TRAITS, fmt, fmtInt } from "@/lib/evolve/constants";

/**
 * ResearchPanel — what the population currently is, and therefore which
 * strategies selection is actually favouring.
 */
export default function ResearchPanel({ onClose, onSelectAgent }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const active = engine.agents.filter((a) => a.status !== "archived");
  const mean = meanGenome(active);
  const leaders = [...active].sort((a, b) => b.fitness - a.fitness).slice(0, 8);
  const byGen = {};
  active.forEach((a) => {
    byGen[a.generation] = (byGen[a.generation] || 0) + 1;
  });
  const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);
  const maxGen = Math.max(1, ...generations.map((g) => byGen[g]));

  const extremes = TRAITS.map((t) => {
    const sorted = [...active].sort((a, b) => (b.genome?.[t.id] ?? 0) - (a.genome?.[t.id] ?? 0));
    return { id: t.id, trait: t.label, high: sorted[0], low: sorted[sorted.length - 1] };
  });

  return (
    <PanelShell title="Research" subtitle={`${fmtInt(active.length)} agents · generation ${engine.maxGeneration()}`} onClose={onClose} width={372}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Population mean genome</div>
        <GenomePanel genome={mean} />
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Population by generation</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 56 }}>
          {generations.map((g) => (
            <div key={g} style={{ flex: 1, minWidth: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }} title={`Gen ${g}: ${byGen[g]} agents`}>
              <div style={{ width: "100%", height: `${(byGen[g] / maxGen) * 44}px`, background: "#22d3ee", borderRadius: 2, opacity: 0.8 }} />
              <span style={{ fontSize: 7.5, color: "#54657c" }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 5 }}>Fitness leaders</div>
        {leaders.map((a) => (
          <button
            key={a.id}
            className="ev-btn ev-btn-ghost"
            style={{ width: "100%", justifyContent: "space-between", padding: "5px 8px", fontSize: 10, marginBottom: 3 }}
            onClick={() => onSelectAgent(a.id)}
          >
            <span>{a.code} · gen {a.generation}</span>
            <span style={{ color: "#c084fc" }}>{a.fitness.toFixed(3)}</span>
          </button>
        ))}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 5 }}>Extremes of each strategy</div>
        {extremes.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "2.5px 0" }}>
            <span className="ev-label" style={{ width: 104 }}>{e.trait}</span>
            <span style={{ fontSize: 9.5, color: "#34d399", flex: 1 }}>{e.high ? `${e.high.code} ${(e.high.genome?.[e.id] ?? 0).toFixed(2)}` : ""}</span>
            <span style={{ fontSize: 9.5, color: "#f87171" }}>{e.low ? `${e.low.code} ${(e.low.genome?.[e.id] ?? 0).toFixed(2)}` : ""}</span>
          </div>
        ))}
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 4 }}>Selection</div>
        <div style={{ fontSize: 10, color: "#7d90a8", lineHeight: 1.5 }}>
          Selection is <b style={{ color: "#eef3f9" }}>{engine.config.selection}</b>. Objective: {engine.config.objective}.
          Fitness is derived from economic survival — wealth, profitability, resources, age, descendants and job
          success. No behaviour is rewarded directly, and mutation runs at{" "}
          <b style={{ color: "#eef3f9" }}>{(engine.config.mutation_rate * 100).toFixed(0)}%</b> per trait.
        </div>
        <div className="ev-row" style={{ marginTop: 7 }}>
          <span className="ev-label">Treasury</span>
          <span className="ev-value" style={{ color: "#34d399" }}><LiveBalance actor={engine.treasury} unit /></span>
        </div>
      </div>
    </PanelShell>
  );
}