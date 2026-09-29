import React, { useMemo, useState } from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { COUNTRIES, countryStats, countryGridBounds } from "@/lib/evolve/countryMap";
import { C } from "@/lib/evolve/constants";

/**
 * CountrySelect — user selects a real country from Earth.
 * Shows country inspector with AI/humans/orgs/jobs/economy.
 * Buttons: EXPLORE (zoom) / START HERE (proceed to cell select).
 * Existing players/AI never prevent choosing a country.
 */
export default function CountrySelect({ onExplore, onStartHere, onClose }) {
  const { engine, selectCountry, selectedCountry } = useEvolve();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q));
  }, [query]);

  const stats = useMemo(() => {
    if (!engine || !selectedCountry) return null;
    return countryStats(engine.world, engine.agents, engine.players, engine.world.assets, selectedCountry);
  }, [engine, selectedCountry]);

  if (!engine) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 36, display: "flex", background: "rgba(3,6,11,0.95)" }}>
      <div className="ev-panel" style={{ flex: "1 1 45%", maxWidth: 420, borderRight: `1px solid ${C.line}` }}>
        <div className="ev-panel-head">
          <span className="ev-panel-title">SELECT COUNTRY · REAL EARTH</span>
          <button className="ev-btn ev-btn-ghost" style={{ marginLeft: "auto", padding: "4px 10px" }} onClick={onClose}>CLOSE</button>
        </div>
        <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.line}` }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`, borderRadius: 5, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none" }}
          />
        </div>
        <div className="ev-panel-body ev-scroll">
          {filtered.map((c) => (
            <button
              key={c.iso}
              onClick={() => selectCountry(c.name)}
              style={{
                width: "100%", textAlign: "left", padding: "8px 12px",
                background: selectedCountry?.iso === c.iso ? "rgba(34,211,238,0.1)" : "transparent",
                border: "none", borderBottom: `1px solid ${C.line}`,
                color: selectedCountry?.iso === c.iso ? C.cyan : C.textDim, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 10, color: C.textFaint, marginRight: 8 }}>{c.iso}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, overflowY: "auto" }}>
        {stats ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>{selectedCountry.name}</div>
            <div style={{ fontSize: 9, color: C.textFaint, letterSpacing: "0.12em", marginBottom: 16 }}>ISO {selectedCountry.iso} · {selectedCountry.lat0}° to {selectedCountry.lat1}° lat</div>
            <div className="ev-grid2" style={{ gap: 10, marginBottom: 16 }}>
              <Metric label="AI AGENTS" value={stats.aiAgents} color={C.cyan} />
              <Metric label="HUMANS" value={stats.humans} color={C.text} />
              <Metric label="INDEPENDENTS" value={stats.independent} color={C.green} />
              <Metric label="ORGANIZATIONS" value={stats.organizations} color={C.purple} />
              <Metric label="OPEN JOBS" value={stats.openJobs} color={C.yellow} />
              <Metric label="ECON. ACTIVITY" value={stats.economicActivity} color={C.textDim} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
              <button className="ev-btn ev-btn-ghost" onClick={() => onExplore(selectedCountry)}>EXPLORE</button>
              <button className="ev-btn" onClick={() => onStartHere(selectedCountry)}>START HERE</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: C.textFaint, fontSize: 11 }}>
            Select a country to view its simulation stats.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}