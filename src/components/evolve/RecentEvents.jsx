import React, { useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { EVENT_COLOR } from "@/lib/evolve/constants";

const CATEGORIES = ["ALL", "PAYMENT", "JOB", "CONFLICT", "EVOLUTION", "ECONOMY", "ORG", "WORLD"];

/**
 * RecentEvents — the live feed. Every entry is produced by the event system,
 * never written by hand, and can be traced back to the object it describes.
 */
export default function RecentEvents({ limit = 40, onPick, compact = false }) {
  const { engine } = useEvolve();
  const [cat, setCat] = useState("ALL");
  if (!engine) return null;

  const events = engine.events.recent(limit, cat);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="ev-scroll" style={{ display: "flex", gap: 4, padding: "6px 8px", overflowX: "auto", flex: "none", borderBottom: "1px solid rgba(120,160,200,0.1)" }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`ev-chip ${cat === c ? "is-on" : ""}`} style={{ flex: "none" }} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="ev-panel-body ev-scroll">
        {events.length === 0 && (
          <div style={{ padding: 14, fontSize: 10, color: "#54657c" }}>No events in this category yet.</div>
        )}
        {events.map((e) => (
          <button
            key={e.id}
            className="ev-event"
            style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}
            onClick={() => onPick?.(e)}
            title={e.type}
          >
            <span className="ev-event-time">
              {e.day != null ? `D${e.day} · ${e.clock || "—"}` : e.clock || "—"}
            </span>
            <span className="ev-event-msg">
              <span style={{ color: e.color, fontWeight: 700, marginRight: 5 }}>●</span>
              {e.message}
              {!compact && e.actor_code ? (
                <span style={{ color: "#54657c", marginLeft: 6 }}>
                  {e.actor_code}
                  {e.target_code ? ` → ${e.target_code}` : ""}
                </span>
              ) : null}
            </span>
            <span className="ev-event-amt" style={{ color: e.amount > 0 ? "#34d399" : "#54657c" }}>
              {e.amount > 0 ? `+${e.amount.toFixed(2)}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { EVENT_COLOR };