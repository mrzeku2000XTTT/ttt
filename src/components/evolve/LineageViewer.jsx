import React from "react";
import LiveBalance from '@/components/evolve/LiveBalance';
import { ChevronLeft, ChevronRight } from "lucide-react";
import PanelShell from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";

/**
 * LineageViewer — the ancestry and descendants of one agent, so it is visible
 * which strategies actually survived.
 */
export default function LineageViewer({ agentId, onClose, onSelect }) {
  const { engine } = useEvolve();
  const data = engine?.lineageOf(agentId);
  if (!data) return null;

  return (
    <PanelShell title="Lineage" subtitle={`${data.self.code} · generation ${data.self.generation}`} onClose={onClose} width={340}>
      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Ancestry</div>
        {data.ancestors.length === 0 && <div style={{ fontSize: 10, color: "#54657c" }}>Genesis agent — no ancestors.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.ancestors.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className="ev-btn ev-btn-ghost"
              style={{ justifyContent: "flex-start", padding: "5px 8px", fontSize: 10 }}
            >
              <ChevronRight className="h-3 w-3" /> {a.code} · gen {a.generation} · <LiveBalance actor={a} unit />
            </button>
          ))}
          <div className="ev-chip is-on" style={{ alignSelf: "flex-start" }}>
            {data.self.code} · gen {data.self.generation} · fitness {data.self.fitness.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="ev-section">
        <div className="ev-label" style={{ marginBottom: 6 }}>Descendants ({data.descendants.length})</div>
        {data.descendants.length === 0 && <div style={{ fontSize: 10, color: "#54657c" }}>No descendants yet.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {data.descendants.slice(0, 40).map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="ev-btn ev-btn-ghost"
              style={{ justifyContent: "flex-start", padding: "5px 8px", fontSize: 10, paddingLeft: 8 + d.depth * 10 }}
            >
              <ChevronLeft className="h-3 w-3" /> {d.code} · gen {d.generation} · {d.status}
            </button>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}