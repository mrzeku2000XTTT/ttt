import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { orgColor, fmt } from "@/lib/evolve/constants";

const SORTS = [
  { id: "fitness", label: "Fitness" },
  { id: "balance", label: "Wealth" },
  { id: "generation", label: "Generation" },
  { id: "age", label: "Age" },
];

/** The agent roster — sortable, searchable, and the way into any inspector. */
export default function AgentList({ onSelect, onClose }) {
  const { engine } = useEvolve();
  const [sort, setSort] = useState("fitness");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    if (!engine) return [];
    const list = engine.agents.filter((a) => a.status !== "archived");
    const filtered = q
      ? list.filter((a) => a.code.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()))
      : list;
    return [...filtered]
      .sort((a, b) =>
        sort === "balance" ? b.balance - a.balance : sort === "generation" ? b.generation - a.generation : sort === "age" ? b.age_days - a.age_days : b.fitness - a.fitness
      )
      .slice(0, 200);
  }, [engine, sort, q, engine?.tickCount]);

  if (!engine) return null;

  return (
    <div className="ev-panel" style={{ flex: 1, minHeight: 0, border: "none" }}>
      <div className="ev-panel-head">
        <span className="ev-panel-title">Agents · {engine.stats().agents}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          {onClose && (
            <button className="ev-btn ev-btn-ghost" style={{ padding: 6 }} onClick={onClose} title="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Search className="h-3 w-3" style={{ color: "#54657c" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A#134"
            style={{
              width: 76, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(120,160,200,0.18)",
              borderRadius: 4, color: "#eef3f9", padding: "3px 6px", fontSize: 10, outline: "none",
            }}
          />
        </div>
      </div>

      <div className="ev-scroll" style={{ display: "flex", gap: 4, padding: "6px 8px", overflowX: "auto", borderBottom: "1px solid rgba(120,160,200,0.1)" }}>
        {SORTS.map((s) => (
          <button key={s.id} className={`ev-chip ${sort === s.id ? "is-on" : ""}`} style={{ flex: "none" }} onClick={() => setSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="ev-panel-body ev-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead>
            <tr style={{ color: "#54657c", textAlign: "left" }}>
              <th style={th}>Agent</th>
              <th style={th}>Gen</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Balance</th>
              <th style={{ ...th, textAlign: "right" }}>Fitness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} onClick={() => onSelect(a.id)} style={{ cursor: "pointer", borderTop: "1px solid rgba(120,160,200,0.07)" }}>
                <td style={td}>
                  <span style={{ color: a.organization_id ? orgColor(a.organization_id) : "#e2e8f0", marginRight: 5 }}>●</span>
                  {a.code} <span style={{ color: "#54657c" }}>{a.name}</span>
                </td>
                <td style={td}>{a.generation}</td>
                <td style={{ ...td, color: a.status === "working" ? "#22d3ee" : "#7d90a8" }}>{a.status}</td>
                <td style={{ ...td, textAlign: "right", color: "#34d399" }}>{fmt(a.balance)}</td>
                <td style={{ ...td, textAlign: "right" }}>{a.fitness.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: "5px 8px", fontWeight: 600, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase" };
const td = { padding: "5px 8px", color: "#c9d6e4", fontVariantNumeric: "tabular-nums" };