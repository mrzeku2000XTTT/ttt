import React from "react";
import { TRAITS } from "@/lib/evolve/constants";

/** Strategy traits, with the mutation the agent carries against its parent. */
export default function GenomePanel({ genome = {}, delta }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {TRAITS.map((t) => {
        const v = genome[t.id] ?? 0;
        const d = delta?.[t.id];
        return (
          <div key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="ev-label">{t.label}</span>
              <span style={{ display: "flex", gap: 7, alignItems: "baseline" }}>
                <span className="ev-value" style={{ fontSize: 10.5 }}>{v.toFixed(2)}</span>
                {d !== undefined && Math.abs(d) > 0.001 ? (
                  <span style={{ fontSize: 9, fontWeight: 700, color: d > 0 ? "#34d399" : "#f87171" }}>
                    {d > 0 ? "+" : ""}
                    {d.toFixed(2)}
                  </span>
                ) : null}
              </span>
            </div>
            <span className="ev-bar" style={{ display: "block", marginTop: 3 }}>
              <i style={{ width: `${Math.max(2, v * 100)}%`, background: v > 0.66 ? "#a78bfa" : v > 0.33 ? "#22d3ee" : "#54657c" }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}