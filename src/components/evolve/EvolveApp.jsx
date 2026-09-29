import React, { useMemo, useState } from "react";
import TopStatusHUD from "./TopStatusHUD";
import LeftNavigation from "./LeftNavigation";
import WorldViewport from "./WorldViewport";
import WorldToolbar from "./WorldToolbar";
import RightIntelPanel from "./RightIntelPanel";
import SelectedTileInspector from "./SelectedTileInspector";
import AgentList from "./AgentList";
import AgentInspector from "./AgentInspector";
import LineageViewer from "./LineageViewer";
import AssetInspector from "./AssetInspector";
import JobMarket from "./JobMarket";
import JobInspector from "./JobInspector";
import EconomyPanel from "./EconomyPanel";
import TreasuryPanel from "./TreasuryPanel";
import FactionsGrid from "./FactionsGrid";
import FactionPanel from "./FactionPanel";
import OrganizationInspector from "./OrganizationInspector";
import ResearchPanel from "./ResearchPanel";
import EventExplorer from "./EventExplorer";
import AttackPlanner from "./AttackPlanner";
import TradePanel from "./TradePanel";
import GenesisModal from "./GenesisModal";
import SimulationControls from "./SimulationControls";
import { PaneModeProvider } from "./PanelShell";
import { useEvolve } from "@/lib/evolve/useEvolve";
import "./evolve.css";

/**
 * EVOLVE — AppShell.
 * The world map is the product; everything else is HUD arranged around it.
 * Desktop and landscape phones get the same console, only the panel widths change.
 */
export default function EvolveApp() {
  const { engine, loading, flash, genesisStage } = useEvolve();
  const [view, setView] = useState("WORLD");
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 6 });
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  const [sheet, setSheet] = useState(null);

  const topAgent = useMemo(() => {
    if (!engine) return null;
    return [...engine.agents].filter((a) => a.status !== "archived").sort((a, b) => b.fitness - a.fitness)[0] || null;
  }, [engine]);

  if (loading) {
    return (
      <div className="ev-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#54657c" }}>RESTORING EXPERIMENT…</div>
      </div>
    );
  }

  if (!engine) return null;

  const open = (type, id) => setSheet({ type, id });
  const close = () => setSheet(null);

  /* --------------------------------------------------------- centre views */
  const centre = () => {
    switch (view) {
      case "AGENTS":
        return <AgentList onSelect={(id) => open("agent", id)} />;
      case "JOBS":
        return <JobMarket onSelectJob={(id) => open("job", id)} />;
      case "ECONOMY":
        return <EconomyPanel />;
      case "FACTIONS":
        return <FactionsGrid onSelect={(id) => open("faction", id)} onSelectOrg={(id) => open("org", id)} />;
      case "RESEARCH":
        return <ResearchPanel onSelectAgent={(id) => open("agent", id)} />;
      case "LINEAGE":
        return topAgent ? <LineageViewer agentId={topAgent.id} onSelect={(id) => open("agent", id)} /> : null;
      case "EVENTS":
        return <EventExplorer onPick={handleEvent} />;
      default:
        return null;
    }
  };

  function handleEvent(e) {
    if (!e) return;
    const agent = engine.agents.find((a) => a.code === e.actor_code);
    if (agent) return open("agent", agent.id);
    if (e.target_id && engine.world.findAsset(e.target_id)) return open("asset", e.target_id);
  }

  return (
    <div className="ev-root">
      <div className="ev-hud">
        <TopStatusHUD onMenu={() => open("sim")} onView={setView} onTreasury={() => open("treasury")} />
      </div>

      <div className="ev-mid">
        <LeftNavigation view={view} onView={setView} />

        {view === "WORLD" ? (
          <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex" }}>
            <WorldViewport cam={cam} setCam={setCam} onSize={setMapSize} />
            {engine.selection && (
              <div style={{ position: "absolute", left: 8, bottom: 8, zIndex: 20 }}>
                <SelectedTileInspector
                  onAttack={(asset) => open("attack", asset.sim_id)}
                  onTrade={(asset) => open("trade", asset.sim_id)}
                  onFortify={(asset) => engine.fortify(asset.sim_id, engine.agentById.get(asset.owner_id)?.id || "")}
                  onInspectAsset={(asset) => open("asset", asset.sim_id)}
                />
              </div>
            )}
          </div>
        ) : (
          <PaneModeProvider value="center">{centre()}</PaneModeProvider>
        )}

        <RightIntelPanel cam={cam} setCam={setCam} mapSize={mapSize} onPickEvent={handleEvent} />
      </div>

      <WorldToolbar onOpenJobs={() => open("jobs")} />

      {/* ------------------------------------------------------------ sheets */}
      {sheet?.type === "agent" && (
        <AgentInspector agentId={sheet.id} onClose={close} onLineage={(id) => open("lineage", id)} />
      )}
      {sheet?.type === "lineage" && (
        <LineageViewer agentId={sheet.id} onClose={close} onSelect={(id) => open("agent", id)} />
      )}
      {sheet?.type === "asset" && (
        <AssetInspector
          simId={sheet.id}
          onClose={close}
          onAttack={(asset) => open("attack", asset.sim_id)}
          onFortify={(asset) => engine.fortify(asset.sim_id, "")}
        />
      )}
      {sheet?.type === "jobs" && <JobMarket onClose={close} onSelectJob={(id) => open("job", id)} />}
      {sheet?.type === "job" && <JobInspector jobId={sheet.id} onClose={close} />}
      {sheet?.type === "treasury" && <TreasuryPanel onClose={close} />}
      {sheet?.type === "faction" && (
        <FactionPanel factionId={sheet.id} onClose={close} onSelectAgent={(id) => open("agent", id)} />
      )}
      {sheet?.type === "org" && (
        <OrganizationInspector orgId={sheet.id} onClose={close} onSelectAgent={(id) => open("agent", id)} />
      )}
      {sheet?.type === "attack" && <AttackPlanner simId={sheet.id} onClose={close} />}
      {sheet?.type === "trade" && <TradePanel simId={sheet.id} onClose={close} />}
      {sheet?.type === "sim" && <SimulationControls onClose={close} />}

      {!engine.started && <GenesisModal />}
      {genesisStage && engine.started && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(3,6,11,0.9)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.22em", color: "#22d3ee", fontWeight: 800 }}>{genesisStage}</div>
            <div style={{ fontSize: 10, color: "#54657c", marginTop: 6, letterSpacing: "0.14em" }}>WORLD ONLINE</div>
          </div>
        </div>
      )}

      {flash && <Toast flash={flash} />}
    </div>
  );
}

function Toast({ flash }) {
  return (
    <div
      key={flash.id}
      style={{
        position: "absolute", bottom: 84, left: "50%", transform: "translateX(-50%)", zIndex: 80,
        background: "rgba(9,14,24,0.96)", border: `1px solid ${flash.ok ? "rgba(34,211,238,0.45)" : "rgba(248,113,113,0.45)"}`,
        color: flash.ok ? "#22d3ee" : "#f87171", padding: "7px 14px", borderRadius: 6,
        fontSize: 10.5, letterSpacing: "0.08em", whiteSpace: "nowrap", maxWidth: "90vw", overflow: "hidden", textOverflow: "ellipsis",
      }}
    >
      {flash.message}
    </div>
  );
}