import React from "react";
import { Mountain, Waves, Trees, Landmark, Pickaxe, Cpu, Zap, Server, Building2, Briefcase, Flag, Crosshair, Shield, ArrowLeftRight, Eye } from "lucide-react";
import { TOOLS, BIOMES, orgColor } from "@/lib/evolve/constants";
import { useEvolve } from "@/lib/evolve/useEvolve";

const ICONS = {
  OBSERVE: Eye,
  TERRAIN: Mountain,
  WATER: Waves,
  FOREST: Trees,
  MOUNTAIN: Landmark,
  RESOURCE: Pickaxe,
  COMPUTE: Cpu,
  ENERGY: Zap,
  SERVER: Server,
  CITY: Building2,
  JOB: Briefcase,
  FACTION: Flag,
  ATTACK: Crosshair,
  DEFEND: Shield,
  TRADE: ArrowLeftRight,
};

const PAINT_BIOMES = ["PLAINS", "FOREST", "DESERT", "MOUNTAIN", "SNOW", "VOLCANIC", "TUNDRA", "COAST"];

/** The bottom toolbar. Selecting a tool changes what the next tap on the world does. */
export default function WorldToolbar({ onOpenJobs }) {
  const { engine } = useEvolve();
  if (!engine) return null;

  const needsBiome = ["TERRAIN"].includes(engine.tool);
  const needsFaction = ["FACTION", "SERVER", "COMPUTE", "ENERGY", "CITY", "RESOURCE"].includes(engine.tool);

  return (
    <div className="ev-tools">
      {(needsBiome || needsFaction) && (
        <div
          className="ev-scroll"
          style={{ display: "flex", gap: 5, padding: "6px 8px", overflowX: "auto", background: "rgba(7,11,19,0.94)", borderTop: "1px solid rgba(120,160,200,0.12)" }}
        >
          {needsBiome &&
            PAINT_BIOMES.map((k) => (
              <button
                key={k}
                className={`ev-chip ${engine.paintBiome === k ? "is-on" : ""}`}
                onClick={() => engine.setPaintBiome(k)}
                style={{ flex: "none" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: BIOMES.find((b) => b.key === k)?.color }} />
                {k}
              </button>
            ))}
          {needsFaction &&
            engine.orgs.length > 0 &&
            engine.orgs.slice(0, 8).map((org) => (
              <button
                key={org.id}
                className={`ev-chip ${engine.paintFaction === org.id ? "is-on" : ""}`}
                onClick={() => engine.setPaintFaction(org.id)}
                style={{ flex: "none" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: org.color || orgColor(org.id) }} />
                {org.name}
              </button>
            ))}
          {needsFaction && engine.orgs.length === 0 && (
            <span style={{ fontSize: 8.5, color: "#54657c", letterSpacing: "0.08em", padding: "0 6px" }}>No organizations yet</span>
          )}
        </div>
      )}

      <div className="ev-tools-row">
        {TOOLS.map((t) => {
          const Icon = ICONS[t.id] || Eye;
          const active = engine.tool === t.id;
          return (
            <button
              key={t.id}
              className={`ev-tool ${active ? "is-active" : ""}`}
              title={t.hint}
              onClick={() => {
                if (t.id === "JOB") onOpenJobs();
                else engine.setTool(t.id);
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="ev-tool-label">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}