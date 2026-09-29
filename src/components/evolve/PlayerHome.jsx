import React from "react";
import { useEvolve } from "@/lib/evolve/useEvolve";
import { COUNTRIES } from "@/lib/evolve/countryMap";
import { C } from "@/lib/evolve/constants";

/**
 * PlayerHome — opening EVOLVE screen.
 * Shows LIVE EARTH immediately with OBSERVE / ENTER WORLD (or RETURN TO WORLD).
 * Displays aggregate AI/human/org/job stats.
 */
export default function PlayerHome({ onObserve, onEnterWorld }) {
  const { engine, currentPlayer } = useEvolve();
  if (!engine) return null;

  const aiCount = engine.agents.filter((a) => a.status !== "archived").length;
  const humanCount = engine.players.length;
  const orgCount = engine.orgs.length;
  const openJobs = engine.jobs.filter((j) => j.status === "OPEN").length;
  const hasPlayer = !!currentPlayer;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 35, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(3,6,11,0.88)", backdropFilter: "blur(6px)" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.textFaint, marginBottom: 4 }}>EVOLVE</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", color: C.text, marginBottom: 18 }}>LIVE EARTH</div>

      <div style={{ display: "flex", gap: 18, marginBottom: 24 }}>
        <Stat label="AI AGENTS" value={aiCount} color={C.cyan} />
        <Stat label="HUMANS" value={humanCount} color={C.text} />
        <Stat label="ORGANIZATIONS" value={orgCount} color={C.purple} />
        <Stat label="OPEN JOBS" value={openJobs} color={C.yellow} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="ev-btn ev-btn-ghost" onClick={onObserve} style={{ minWidth: 140 }}>
          OBSERVE
        </button>
        <button className="ev-btn" onClick={onEnterWorld} style={{ minWidth: 140 }}>
          {hasPlayer ? "RETURN TO WORLD" : "ENTER WORLD"}
        </button>
      </div>

      {hasPlayer && (
        <div style={{ marginTop: 16, fontSize: 10, color: C.cyan, letterSpacing: "0.1em" }}>
          {currentPlayer.code} · {currentPlayer.country} · {currentPlayer.balance.toFixed(2)} tKAS
        </div>
      )}
      <div style={{ marginTop: 10, fontSize: 9, color: C.textFaint, letterSpacing: "0.08em" }}>
        {COUNTRIES.length} REAL COUNTRIES · EARTH-Scale SIMULATION
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 8, letterSpacing: "0.13em", color: C.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );
}